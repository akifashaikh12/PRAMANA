import { ExtractedClaim, Evidence, Finding } from "../agent/schemas";
import { getTimeDeltaMinutes, normalizeLocation } from "./evidence-matcher";

export interface ConflictDetectorOptions {
  transitSpeedThresholdKmH?: number;
  timeConflictThresholdMinutes?: number;
}

/**
 * Detects factual, temporal, and spatial conflicts between extracted claims and evidence,
 * as well as internal inconsistencies and statement disputes between multiple claims.
 */
export function detectConflicts(
  claims: ExtractedClaim[],
  evidenceList: Evidence[],
  options: ConflictDetectorOptions = {}
): Finding[] {
  const findings: Finding[] = [];
  const timeThreshold = options.timeConflictThresholdMinutes ?? 45;

  // 1. Check Claims against Evidence
  for (const claim of claims) {
    if (!claim.time_start) continue;

    for (const ev of evidenceList) {
      const deltaMinutes = getTimeDeltaMinutes(claim.time_start, ev.timestamp);
      if (deltaMinutes === null) continue;

      const claimLoc = normalizeLocation(claim.place);
      const evLoc = normalizeLocation(ev.place);

      // A. Location Conflict / Impossible Colocation
      if (deltaMinutes <= timeThreshold && claimLoc && evLoc && claimLoc !== evLoc) {
        // If neither is substring of the other
        if (!claimLoc.includes(evLoc) && !evLoc.includes(claimLoc)) {
          findings.push({
            id: `finding-loc-${claim.id || Math.random().toString(36).substring(7)}`,
            type: "location_conflict",
            claim_id: claim.id,
            evidence_id: ev.id,
            status: "open",
            explanation: `Location conflict: Statement asserts presence at "${claim.place}" (${claim.time_expression || claim.time_start}), but verified evidence (${ev.source}: "${ev.description}") records presence at "${ev.place}" only ${deltaMinutes}m apart (${ev.timestamp}).`,
          });
        }
      }

      // B. Time Conflict on Same Action / Resource
      // If evidence contradicts a specific claim event (e.g., system access or door unlock)
      const claimDescLower = claim.what.toLowerCase();
      const evDescLower = ev.description.toLowerCase();

      // Check if evidence directly mentions the same subject or entity
      const keyWords = ["badge", "card", "logged in", "camera", "cctv", "departure", "arrival", "car", "keycard"];
      const hasKeySubject = keyWords.some(
        (kw) => claimDescLower.includes(kw) || evDescLower.includes(kw)
      );

      if (hasKeySubject && deltaMinutes > 15 && deltaMinutes <= 180) {
        // Claims action took place at T1, but evidence logs it at T2
        if (claimLoc && evLoc && (claimLoc.includes(evLoc) || evLoc.includes(claimLoc))) {
          findings.push({
            id: `finding-time-${claim.id || Math.random().toString(36).substring(7)}`,
            type: "time_conflict",
            claim_id: claim.id,
            evidence_id: ev.id,
            status: "open",
            explanation: `Time conflict: Claim reports "${claim.what}" at "${claim.place}" during ${claim.time_expression || claim.time_start}, but audit record (${ev.source}) logs "${ev.description}" at ${ev.timestamp} (discrepancy of ${deltaMinutes} minutes).`,
          });
        }
      }
    }
  }

  // 2. Check Claims against each other (Internal Inconsistencies & Statement Disputes)
  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const c1 = claims[i];
      const c2 = claims[j];

      // Check same timeframe
      if (c1.time_start && c2.time_start) {
        const delta = getTimeDeltaMinutes(c1.time_start, c2.time_start);
        if (delta !== null && delta <= 30) {
          const loc1 = normalizeLocation(c1.place);
          const loc2 = normalizeLocation(c2.place);
          const who1 = (c1.who || "").toLowerCase();
          const who2 = (c2.who || "").toLowerCase();

          // If same person claimed to be in two distinct distant places at the same time
          if (who1 && who2 && who1 === who2 && loc1 && loc2 && loc1 !== loc2 && !loc1.includes(loc2) && !loc2.includes(loc1)) {
            findings.push({
              id: `finding-inconsistency-${i}-${j}`,
              type: "internal_inconsistency",
              claim_id: c1.id,
              status: "open",
              explanation: `Internal contradiction: "${c1.who}" is asserted to be at "${c1.place}" and "${c2.place}" within ${delta} minutes of each other without plausible transit.`,
            });
          }
        }
      }

      // Check direct semantic contradiction (e.g. "I was alone" vs "I was with X", or "never" vs "did")
      const what1 = c1.what.toLowerCase();
      const what2 = c2.what.toLowerCase();

      if (
        (what1.includes("alone") && what2.includes("with")) ||
        (what1.includes("never") && (what2.includes("saw") || what2.includes("met")))
      ) {
        findings.push({
          id: `finding-dispute-${i}-${j}`,
          type: "statement_dispute",
          claim_id: c1.id,
          status: "open",
          explanation: `Contradiction between claims: "${c1.source_quote}" disputes "${c2.source_quote}".`,
        });
      }
    }
  }

  return findings;
}
