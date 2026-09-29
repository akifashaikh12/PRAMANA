import { ExtractedClaim } from "../agent/schemas";

const VAGUE_IDENTIFIERS = [
  "someone",
  "somebody",
  "a person",
  "they",
  "people",
  "unknown",
  "unspecified",
  "n/a",
];

const VAGUE_PLACES = [
  "somewhere",
  "around here",
  "nearby",
  "there",
  "at the place",
  "unknown",
  "unspecified",
  "n/a",
];

/**
 * Checks whether a particular semantic slot is sufficiently filled on a claim.
 */
export function isSlotFilled(claim: ExtractedClaim, slot: string): boolean {
  const normSlot = slot.toLowerCase().trim();

  switch (normSlot) {
    case "who": {
      if (!claim.who || claim.who.trim() === "") return false;
      const lower = claim.who.trim().toLowerCase();
      if (VAGUE_IDENTIFIERS.includes(lower)) return false;
      return true;
    }
    case "what": {
      return Boolean(claim.what && claim.what.trim().length > 2);
    }
    case "place":
    case "where":
    case "location": {
      if (!claim.place || claim.place.trim() === "") return false;
      const lower = claim.place.trim().toLowerCase();
      if (VAGUE_PLACES.includes(lower)) return false;
      return true;
    }
    case "time_start":
    case "time":
    case "when": {
      // Considered filled if either time_start ISO is set, or a meaningful time_expression is present
      if (claim.time_start && claim.time_start.trim().length > 0) return true;
      if (
        claim.time_expression &&
        claim.time_expression.trim().length > 0 &&
        !claim.time_expression.toLowerCase().includes("sometime") &&
        !claim.time_expression.toLowerCase().includes("at some point")
      ) {
        return true;
      }
      return false;
    }
    case "time_end": {
      return Boolean(claim.time_end && claim.time_end.trim().length > 0);
    }
    default: {
      // For any custom required slot (e.g. role, ownership), check dynamic property or unknown_slots
      const val = (claim as Record<string, unknown>)[normSlot];
      if (typeof val === "string") return val.trim().length > 0;
      return !claim.unknown_slots?.includes(normSlot);
    }
  }
}

/**
 * Evaluates missing slots for a single extracted claim against a list of required slots.
 */
export function checkMissingSlotsForClaim(
  claim: ExtractedClaim,
  requiredSlots: string[]
): string[] {
  const missing: string[] = [];

  for (const slot of requiredSlots) {
    if (!isSlotFilled(claim, slot)) {
      missing.push(slot);
    }
  }

  // Also include explicitly tagged unknown_slots from LLM extraction if they intersect with requiredSlots
  if (Array.isArray(claim.unknown_slots)) {
    for (const unk of claim.unknown_slots) {
      if (requiredSlots.includes(unk) && !missing.includes(unk)) {
        missing.push(unk);
      }
    }
  }

  return missing;
}

export interface ClaimSlotCheckResult {
  claimIndex: number;
  claim: ExtractedClaim;
  missingSlots: string[];
}

/**
 * Checks missing required slots across all claims for a given mode's requirements.
 */
export function checkMissingSlots(
  claims: ExtractedClaim[],
  requiredSlots: string[]
): ClaimSlotCheckResult[] {
  const results: ClaimSlotCheckResult[] = [];

  claims.forEach((claim, idx) => {
    const missing = checkMissingSlotsForClaim(claim, requiredSlots);
    if (missing.length > 0) {
      results.push({
        claimIndex: idx,
        claim,
        missingSlots: missing,
      });
    }
  });

  return results;
}
