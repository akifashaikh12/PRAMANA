import { StateGraph, END } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { AgentStateAnnotation, AgentState, UnresolvedSlot, AgentLog } from "./state";
import {
  ExtractedClaim,
  ExtractionOutputSchema,
  CoachQuestion,
  CoachQuestionSchema,
} from "./schemas";
import {
  getClaimExtractionPrompt,
  getClarificationPrompt,
  getCoachSystemPrompt,
} from "./prompts";
import {
  checkMissingSlots,
  normalizeTimeExpression,
  lintAndRewriteQuestion,
  detectConflicts,
  detectTimelineGaps,
} from "../tools";

// Initialize ChatGroq LLM helper
function getGroqLLM(temperature = 0.1) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new ChatGroq({
    apiKey,
    model: "llama-3.3-70b-versatile",
    temperature,
  });
}

/**
 * Deterministic fallback claim extractor for when Groq API key is absent or unreachable
 */
function fallbackExtractClaims(
  statement: string,
  narrator: string,
  statementDate: string,
  requiredSlots: string[]
): ExtractedClaim[] {
  // Split into sentences or clauses
  const sentences = statement
    .split(/(?<=[.?!;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length === 0 && statement.trim()) {
    sentences.push(statement.trim());
  }

  return sentences.map((sentence, idx) => {
    // Basic heuristic slot identification
    const timeMatch = sentence.match(
      /\b(?:yesterday|today|last night|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}:\d{2}\s*(?:am|pm)?|morning|afternoon|evening|around\s+\d{1,2}(?::\d{2})?)\b/i
    );
    const timeExpr = timeMatch ? timeMatch[0] : null;

    const locMatch = sentence.match(
      /\b(?:at|in|inside|to|near)\s+(?:the\s+)?([A-Z][a-zA-Z0-9\s]+|(?:room|office|lobby|server room|vault|cafe|building|warehouse|headquarters|lab)\s*[0-9a-zA-Z]*)/i
    );
    const place = locMatch ? locMatch[0].replace(/^(?:at|in|inside|to|near)\s+(?:the\s+)?/i, "") : null;

    const normTime = normalizeTimeExpression(timeExpr, statementDate);

    const unknown: string[] = [];
    if (requiredSlots.includes("who") && !narrator) unknown.push("who");
    if (requiredSlots.includes("place") && !place) unknown.push("place");
    if (requiredSlots.includes("time_start") && !normTime.timeStart) unknown.push("time_start");

    return {
      id: `claim-${Date.now()}-${idx}`,
      source_quote: sentence,
      who: narrator || "Unknown",
      what: sentence,
      place: place || null,
      time_expression: timeExpr,
      time_start: normTime.timeStart,
      time_end: normTime.timeEnd,
      unknown_slots: unknown,
      status: unknown.length > 0 ? "needs_clarification" : "verified",
    };
  });
}

/**
 * NODE 1: EXTRACT_CLAIMS
 * Uses ChatGroq (or deterministic heuristic fallback) to break statement into atomic claims.
 */
async function extractClaimsNode(state: AgentState): Promise<Partial<AgentState>> {
  const timestamp = new Date().toISOString();
  const logs: AgentLog[] = [
    {
      step: "EXTRACT_CLAIMS",
      message: `Analyzing statement by "${state.narrator}" (${state.statement.length} characters) in "${state.modeConfig.mode}" mode.`,
      timestamp,
    },
  ];

  const llm = getGroqLLM(0.1);
  let claims: ExtractedClaim[] = [];

  if (llm) {
    try {
      const prompt = getClaimExtractionPrompt(state.modeConfig);
      const userContent = `NARRATOR: ${state.narrator}\nREFERENCE DATE: ${state.statementDate}\nSTATEMENT BODY:\n"""${state.statement}"""`;

      const response = await llm.invoke([
        { role: "system", content: prompt },
        { role: "user", content: userContent },
      ]);

      const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = ExtractionOutputSchema.safeParse(parsed);
        if (validated.success) {
          claims = validated.data.claims;
        }
      }
    } catch (err: unknown) {
      logs.push({
        step: "EXTRACT_CLAIMS",
        message: `LLM extraction encountered an error, activating resilient heuristic extractor: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // If LLM returned no claims or was unavailable, use fallback
  if (claims.length === 0) {
    claims = fallbackExtractClaims(
      state.statement,
      state.narrator,
      state.statementDate,
      state.modeConfig.required_slots
    );
  }

  // Normalize time expressions across all extracted claims
  const normalizedClaims: ExtractedClaim[] = claims.map((c, i) => {
    const norm = normalizeTimeExpression(c.time_expression || c.time_start, state.statementDate);
    return {
      ...c,
      id: c.id || `claim-${Date.now()}-${i}`,
      who: c.who || state.narrator || null,
      time_start: norm.timeStart || c.time_start || null,
      time_end: norm.timeEnd || c.time_end || null,
      status: (c.unknown_slots && c.unknown_slots.length > 0) ? "needs_clarification" : "verified",
    };
  });

  logs.push({
    step: "EXTRACT_CLAIMS",
    message: `Extracted ${normalizedClaims.length} atomic claims.`,
    timestamp: new Date().toISOString(),
  });

  return {
    extractedClaims: normalizedClaims,
    logs,
  };
}

/**
 * NODE 2: CHECK_SLOTS
 * Deterministic code tool checking required slots based on mode.
 */
async function checkSlotsNode(state: AgentState): Promise<Partial<AgentState>> {
  const timestamp = new Date().toISOString();
  const missingResults = checkMissingSlots(
    state.extractedClaims,
    state.modeConfig.required_slots
  );

  const unresolvedSlots: UnresolvedSlot[] = [];
  for (const item of missingResults) {
    for (const slot of item.missingSlots) {
      unresolvedSlots.push({
        claimIndex: item.claimIndex,
        claimQuote: item.claim.source_quote,
        slot,
      });
    }
  }

  const logs: AgentLog[] = [
    {
      step: "CHECK_SLOTS",
      message: `Evaluated ${state.extractedClaims.length} claims against required slots [${state.modeConfig.required_slots.join(", ")}]. Found ${unresolvedSlots.length} missing/ambiguous slot(s).`,
      timestamp,
    },
  ];

  return {
    unresolvedSlots,
    logs,
  };
}

/**
 * NODE 3: GENERATE_CLARIFICATION
 * Generates non-leading prompt to resolve missing slot.
 */
async function generateClarificationNode(state: AgentState): Promise<Partial<AgentState>> {
  const timestamp = new Date().toISOString();
  const firstUnresolved = state.unresolvedSlots[0];
  let rawQuestion = `Could you please clarify the ${firstUnresolved?.slot || "details"} regarding: "${firstUnresolved?.claimQuote || ""}"?`;

  const llm = getGroqLLM(0.2);
  if (llm && firstUnresolved) {
    try {
      const prompt = getClarificationPrompt(
        firstUnresolved.claimQuote,
        firstUnresolved.slot,
        state.modeConfig
      );
      const res = await llm.invoke([{ role: "system", content: prompt }]);
      const text = typeof res.content === "string" ? res.content : "";
      if (text.trim()) rawQuestion = text.trim();
    } catch {
      // Fallback question is already defined
    }
  }

  // Guardrail: question-linter
  const lintResult = lintAndRewriteQuestion(rawQuestion, firstUnresolved?.slot);

  const logs: AgentLog[] = [
    {
      step: "GENERATE_CLARIFICATION",
      message: `Generated clarification inquiry for slot "${firstUnresolved?.slot || "unknown"}". ${lintResult.isLeading ? "Linter detected leading phrasing and rewrote to cognitive interview standard." : "Passed linter."}`,
      timestamp,
    },
  ];

  return {
    clarificationQuestion: lintResult.cleanedQuestion,
    logs,
  };
}

/**
 * NODE 4: EVALUATE_EVIDENCE
 * Deterministic code tool matching claims with evidence to produce findings.
 */
async function evaluateEvidenceNode(state: AgentState): Promise<Partial<AgentState>> {
  const timestamp = new Date().toISOString();
  const conflictFindings = detectConflicts(state.extractedClaims, state.evidenceList);
  const gapFindings = detectTimelineGaps(state.extractedClaims, state.evidenceList, {
    mode: state.modeConfig.mode,
  });

  const combinedFindings = [...state.findings, ...conflictFindings, ...gapFindings];

  // Deduplicate findings by explanation or id
  const uniqueFindings = combinedFindings.filter(
    (f, idx, arr) => arr.findIndex((x) => x.explanation === f.explanation) === idx
  );

  const logs: AgentLog[] = [
    {
      step: "EVALUATE_EVIDENCE",
      message: `Audited ${state.extractedClaims.length} claims against ${state.evidenceList.length} evidence records. Detected ${conflictFindings.length} conflict(s) and ${gapFindings.length} timeline gap(s).`,
      timestamp,
    },
  ];

  return {
    findings: uniqueFindings,
    logs,
  };
}

/**
 * NODE 5: GENERATE_COACH
 * LLM node producing next-best question, passed through question-linter guardrail.
 */
async function generateCoachNode(state: AgentState): Promise<Partial<AgentState>> {
  const timestamp = new Date().toISOString();
  let coachQuestion: CoachQuestion = {
    question: "What, if anything, did you observe next after this sequence of events?",
    reason: "Establish chronological continuation and probe forward timeline continuity.",
    priority: "low",
    target_slot: "what",
  };

  // Prioritize findings if present
  const openConflicts = state.findings.filter((f) => f.type === "time_conflict" || f.type === "location_conflict");
  const openGaps = state.findings.filter((f) => f.type === "timeline_gap");

  const llm = getGroqLLM(0.2);
  if (llm) {
    try {
      const prompt = getCoachSystemPrompt(state.modeConfig);
      const userContext = `
MODE: ${state.modeConfig.mode}
CLAIMS:
${JSON.stringify(state.extractedClaims.map((c) => ({ quote: c.source_quote, what: c.what, place: c.place, time: c.time_start })), null, 2)}

FINDINGS (${state.findings.length}):
${JSON.stringify(state.findings.map((f) => ({ type: f.type, explanation: f.explanation })), null, 2)}

UNRESOLVED SLOTS:
${JSON.stringify(state.unresolvedSlots, null, 2)}
`;
      const res = await llm.invoke([
        { role: "system", content: prompt },
        { role: "user", content: userContext },
      ]);

      const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const validated = CoachQuestionSchema.safeParse(parsed);
        if (validated.success) {
          coachQuestion = validated.data;
        }
      }
    } catch {
      // Heuristic fallback below
    }
  }

  // If no LLM result, generate tailored heuristic question based on highest priority finding
  if (openConflicts.length > 0) {
    coachQuestion = {
      question: `Regarding the interval around ${state.extractedClaims[0]?.time_expression || "the stated time"}, can you walk through your precise movements and observations step-by-step?`,
      reason: `Directly address critical ${openConflicts[0].type.replace("_", " ")}: ${openConflicts[0].explanation}`,
      priority: "high",
      target_slot: "place",
    };
  } else if (openGaps.length > 0) {
    coachQuestion = {
      question: "What, if anything, occurred during the unaccounted interval between your arrival and later departure?",
      reason: `Bridge timeline gap: ${openGaps[0].explanation}`,
      priority: "high",
      target_slot: "time_start",
    };
  } else if (state.unresolvedSlots.length > 0) {
    coachQuestion = {
      question: `To the best of your recollection, what was the exact ${state.unresolvedSlots[0].slot} associated with "${state.unresolvedSlots[0].claimQuote}"?`,
      reason: `Resolve missing required slot: ${state.unresolvedSlots[0].slot}`,
      priority: "medium",
      target_slot: state.unresolvedSlots[0].slot,
    };
  }

  // Guardrail: Pass through question-linter
  const lintResult = lintAndRewriteQuestion(coachQuestion.question, coachQuestion.target_slot);
  coachQuestion.question = lintResult.cleanedQuestion;

  const logs: AgentLog[] = [
    {
      step: "GENERATE_COACH",
      message: `Formulated Next-Best Question [Priority: ${coachQuestion.priority.toUpperCase()}]. Linter Status: ${lintResult.isLeading ? "Rewritten to non-leading format" : "Clean non-leading formulation"}.`,
      timestamp,
    },
  ];

  return {
    nextBestQuestion: coachQuestion,
    logs,
  };
}

/**
 * Conditional Router after CHECK_SLOTS
 */
function routeAfterSlots(state: AgentState): string {
  // If slots are missing and user hasn't provided a clarification answer, gate for clarification
  if (state.unresolvedSlots.length > 0 && !state.userClarificationAnswer) {
    return "GENERATE_CLARIFICATION";
  }
  return "EVALUATE_EVIDENCE";
}

// Build and compile the LangGraph State Machine
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("EXTRACT_CLAIMS", extractClaimsNode)
  .addNode("CHECK_SLOTS", checkSlotsNode)
  .addNode("GENERATE_CLARIFICATION", generateClarificationNode)
  .addNode("EVALUATE_EVIDENCE", evaluateEvidenceNode)
  .addNode("GENERATE_COACH", generateCoachNode)
  // Edges
  .addEdge("__start__", "EXTRACT_CLAIMS")
  .addEdge("EXTRACT_CLAIMS", "CHECK_SLOTS")
  .addConditionalEdges("CHECK_SLOTS", routeAfterSlots, [
    "GENERATE_CLARIFICATION",
    "EVALUATE_EVIDENCE",
  ])
  .addEdge("GENERATE_CLARIFICATION", END)
  .addEdge("EVALUATE_EVIDENCE", "GENERATE_COACH")
  .addEdge("GENERATE_COACH", END);

export const pramanaGraph = workflow.compile();

/**
 * Helper to run the complete PRAMANA agent pipeline with input state
 */
export async function runPramanaPipeline(
  initialInput: Partial<AgentState>
): Promise<AgentState> {
  const result = await pramanaGraph.invoke(initialInput);
  return result as AgentState;
}
