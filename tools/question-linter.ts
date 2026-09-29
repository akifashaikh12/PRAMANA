export interface QuestionLintResult {
  isLeading: boolean;
  issues: string[];
  ruleViolations: string[];
  originalQuestion: string;
  cleanedQuestion: string;
}

interface LeadingPatternRule {
  id: string;
  regex: RegExp;
  description: string;
  suggestedTemplate?: (match: RegExpMatchArray, slot?: string | null) => string;
}

const LEADING_RULES: LeadingPatternRule[] = [
  {
    id: "presupposition_tag_question",
    regex: /(?:,\s*(?:right|correct|isn['’]t it|didn['’]t you|wasn['’]t it|aren['’]t you)\s*\??$)/i,
    description: "Contains a confirming tag question that biases the witness toward agreement.",
  },
  {
    id: "leading_item_adjective",
    regex: /\b(?:did you see|did you notice)\s+(?:the|that)\s+([a-z]+)\s+([a-z]+)\b/i,
    description: "Presupposes specific descriptive attributes (e.g. 'the red car', 'the broken lock') instead of open recall.",
    suggestedTemplate: (match) =>
      `What, if anything, did you observe regarding the ${match[2] || "subject"}?`,
  },
  {
    id: "accusatory_presumption",
    regex: /\bwhy did you\s+(?:take|steal|hide|alter|remove|flee|escape|break)\b/i,
    description: "Presupposes illicit or contested actions without factual establishment.",
    suggestedTemplate: () =>
      "What actions, if any, occurred during that interval?",
  },
  {
    id: "negative_leading_prompt",
    regex: /\b(?:didn['’]t you|wouldn['’]t you|couldn['’]t you|haven['’]t you)\b/i,
    description: "Uses negative phrasing that suggests the expected answer.",
    suggestedTemplate: () =>
      "Can you describe your recollection of those events?",
  },
  {
    id: "subjective_state_attribution",
    regex: /\b(?:was|were)\s+([a-z\s]+)\s+(?:nervous|angry|suspicious|anxious|guilty|hurrying|frightened)\b/i,
    description: "Injects emotional or psychological characterization rather than asking for observable behavior.",
    suggestedTemplate: (match) =>
      `How would you describe the demeanor or actions of ${match[1]?.trim() || "the individual"}?`,
  },
  {
    id: "forced_confirmation",
    regex: /\b(?:is it true that|confirm that|admit that|agree that)\b/i,
    description: "Demands confirmation of investigator hypothesis rather than eliciting organic memory.",
    suggestedTemplate: () =>
      "What can you tell us regarding those circumstances?",
  },
];

/**
 * Lints a proposed inquiry against cognitive interview standards.
 * Detects leading language, cognitive bias, and presuppositions,
 * and rewrites the question into open-ended, non-leading format.
 */
export function lintAndRewriteQuestion(
  rawQuestion: string,
  targetSlot?: string | null
): QuestionLintResult {
  const issues: string[] = [];
  const ruleViolations: string[] = [];
  let isLeading = false;
  let cleaned = rawQuestion.trim();

  for (const rule of LEADING_RULES) {
    const match = cleaned.match(rule.regex);
    if (match) {
      isLeading = true;
      issues.push(rule.description);
      ruleViolations.push(rule.id);

      // Apply rule-based rewriting if applicable
      if (rule.suggestedTemplate) {
        cleaned = rule.suggestedTemplate(match, targetSlot);
      }
    }
  }

  // Remove trailing tag questions if still lingering
  cleaned = cleaned.replace(
    /,\s*(?:right|correct|isn['’]t it|didn['’]t you|wasn['’]t it)\s*\??$/i,
    "?"
  );

  // If a specific slot was targeted and the question was flagged as leading,
  // align with standard cognitive interview open-ended prompt templates
  if (isLeading && targetSlot) {
    const slotLower = targetSlot.toLowerCase();
    if (slotLower === "who") {
      cleaned = "Who, if anyone, was present at that time?";
    } else if (slotLower === "place" || slotLower === "location") {
      cleaned = "What, if anything, can you describe about the location where this took place?";
    } else if (slotLower === "time_start" || slotLower === "time") {
      cleaned = "To the best of your recollection, what time or time window did this occur?";
    } else if (slotLower === "what") {
      cleaned = "What, if anything, did you observe happening?";
    }
  }

  // Ensure trailing question mark
  if (!cleaned.endsWith("?")) {
    cleaned += "?";
  }

  return {
    isLeading,
    issues,
    ruleViolations,
    originalQuestion: rawQuestion,
    cleanedQuestion: cleaned,
  };
}
