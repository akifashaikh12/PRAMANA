import { Annotation } from "@langchain/langgraph";
import {
  ModeConfig,
  ExtractedClaim,
  Evidence,
  Finding,
  CoachQuestion,
} from "./schemas";

export interface UnresolvedSlot {
  claimIndex: number;
  claimQuote: string;
  slot: string;
}

export interface AgentLog {
  step: string;
  message: string;
  timestamp: string;
}

export const AgentStateAnnotation = Annotation.Root({
  caseId: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => "",
  }),
  modeConfig: Annotation<ModeConfig>({
    reducer: (_x, y) => y,
    default: () => ({
      mode: "investigation",
      time_precision: "minute",
      tone: "objective_forensic",
      required_slots: ["who", "what", "place", "time_start"],
      outputs: ["timeline", "discrepancies", "gaps"],
      guardrails: { non_leading_questions: true },
    }),
  }),
  statement: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => "",
  }),
  narrator: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => "Unknown",
  }),
  statementDate: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => new Date().toISOString(),
  }),
  extractedClaims: Annotation<ExtractedClaim[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  unresolvedSlots: Annotation<UnresolvedSlot[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  clarificationQuestion: Annotation<string | null>({
    reducer: (_x, y) => y,
    default: () => null,
  }),
  userClarificationAnswer: Annotation<string | null>({
    reducer: (_x, y) => y,
    default: () => null,
  }),
  evidenceList: Annotation<Evidence[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  findings: Annotation<Finding[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  nextBestQuestion: Annotation<CoachQuestion | null>({
    reducer: (_x, y) => y,
    default: () => null,
  }),
  /**
   * Decisions Made: verifiable facts established by the timeline,
   * e.g. "Verified: Alice claims arriving 09:00; badge log confirms 08:57".
   */
  decisions: Annotation<string[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  logs: Annotation<AgentLog[]>({
    reducer: (x, y) => (y ? [...x, ...y] : x),
    default: () => [],
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
