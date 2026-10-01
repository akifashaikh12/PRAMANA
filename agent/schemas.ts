import { z } from "zod";

export const ModeConfigSchema = z.object({
  mode: z.enum(["diary", "investigation", "hiring"]),
  name: z.string().optional(),
  description: z.string().optional(),
  time_precision: z.enum(["minute", "hour", "day"]),
  tone: z.string(),
  required_slots: z.array(z.string()),
  outputs: z.array(z.string()),
  guardrails: z.record(z.string(), z.boolean()),
});

export type ModeConfig = z.infer<typeof ModeConfigSchema>;

export const ExtractedClaimSchema = z.object({
  id: z.string().optional(),
  source_quote: z.string(),
  who: z.string().nullable().optional(),
  what: z.string(),
  place: z.string().nullable().optional(),
  time_expression: z.string().nullable().optional(),
  time_start: z.string().nullable().optional(),
  time_end: z.string().nullable().optional(),
  unknown_slots: z.array(z.string()).default([]),
  status: z
    .enum(["pending", "verified", "disputed", "needs_clarification"])
    .default("pending"),
});

export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;

export const ExtractionOutputSchema = z.object({
  claims: z.array(ExtractedClaimSchema),
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

export const CoachQuestionSchema = z.object({
  question: z.string(),
  reason: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  target_slot: z.string().nullable().optional(),
});

export type CoachQuestion = z.infer<typeof CoachQuestionSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  case_id: z.string().optional(),
  kind: z.string(),
  description: z.string(),
  place: z.string().nullable().optional(),
  timestamp: z.string(),
  source: z.string(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const FindingTypeSchema = z.enum([
  "time_conflict",
  "location_conflict",
  "timeline_gap",
  "statement_dispute",
  "internal_inconsistency",
]);

export type FindingType = z.infer<typeof FindingTypeSchema>;

export const FindingSchema = z.object({
  id: z.string().optional(),
  case_id: z.string().optional(),
  type: FindingTypeSchema,
  claim_id: z.string().nullable().optional(),
  evidence_id: z.string().nullable().optional(),
  status: z.string().default("open"),
  explanation: z.string(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const StatementRecordSchema = z.object({
  id: z.string().optional(),
  case_id: z.string().optional(),
  narrator: z.string(),
  body: z.string(),
  statement_date: z.string(),
  prev_hash: z.string(),
  hash: z.string(),
  created_at: z.string().optional(),
});

export type StatementRecord = z.infer<typeof StatementRecordSchema>;

export const CaseRecordSchema = z.object({
  id: z.string(),
  mode: z.enum(["diary", "investigation", "hiring"]),
  title: z.string(),
  created_at: z.string().optional(),
});

export type CaseRecord = z.infer<typeof CaseRecordSchema>;

/** Full case metadata: id, title, mode, created_at, updated_at, version. */
export const CaseMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  mode: z.enum(["diary", "investigation", "hiring"]),
  created_at: z.string(),
  updated_at: z.string(),
  version: z.number().int().nonnegative(),
});

export type CaseMeta = z.infer<typeof CaseMetaSchema>;

/** One immutable, hash-chained audit entry for a case. */
export const CaseAuditLogSchema = z.object({
  id: z.string().optional(),
  case_id: z.string().nullable().optional(),
  action_type: z.string(),
  changed_by: z.string().default("system_user"),
  previous_state: z.unknown().nullable().optional(),
  new_state: z.unknown().nullable().optional(),
  timestamp: z.string(),
  sha256_hash: z.string(),
});

export type CaseAuditLog = z.infer<typeof CaseAuditLogSchema>;
