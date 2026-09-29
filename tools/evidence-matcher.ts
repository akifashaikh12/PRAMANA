import { ExtractedClaim, Evidence } from "../agent/schemas";

export interface MatchResult {
  claim: ExtractedClaim;
  evidence: Evidence;
  timeDeltaMinutes: number | null;
  sameLocation: boolean;
  type: "corroborating" | "conflicting_time" | "conflicting_location" | "unrelated";
  detail: string;
}

/**
 * Calculates time difference in minutes between two ISO date strings.
 */
export function getTimeDeltaMinutes(timeA?: string | null, timeB?: string | null): number | null {
  if (!timeA || !timeB) return null;
  const da = new Date(timeA).getTime();
  const db = new Date(timeB).getTime();
  if (isNaN(da) || isNaN(db)) return null;
  return Math.round(Math.abs(da - db) / (60 * 1000));
}

/**
 * Normalizes location strings for comparison.
 */
export function normalizeLocation(loc?: string | null): string {
  if (!loc) return "";
  return loc.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Matches a single claim against all available evidence items.
 */
export function matchClaimAgainstEvidence(
  claim: ExtractedClaim,
  evidenceList: Evidence[],
  maxTimeDeltaMinutes: number = 60
): MatchResult[] {
  const matches: MatchResult[] = [];
  const claimPlaceNorm = normalizeLocation(claim.place);

  for (const ev of evidenceList) {
    const deltaMin = getTimeDeltaMinutes(claim.time_start, ev.timestamp);
    const evPlaceNorm = normalizeLocation(ev.place);

    const isCloseInTime = deltaMin !== null && deltaMin <= maxTimeDeltaMinutes;
    const sameLocation = Boolean(
      claimPlaceNorm &&
      evPlaceNorm &&
      (claimPlaceNorm.includes(evPlaceNorm) || evPlaceNorm.includes(claimPlaceNorm))
    );

    // If both within reasonable time window
    if (isCloseInTime) {
      if (claimPlaceNorm && evPlaceNorm && !sameLocation) {
        // Close in time (e.g. <= 30 mins) but different locations!
        matches.push({
          claim,
          evidence: ev,
          timeDeltaMinutes: deltaMin,
          sameLocation: false,
          type: "conflicting_location",
          detail: `Claim states location "${claim.place}" around ${claim.time_start || claim.time_expression}, but evidence (${ev.source}) places activity at "${ev.place}" only ${deltaMin} minutes apart (${ev.timestamp}).`,
        });
      } else if (sameLocation) {
        matches.push({
          claim,
          evidence: ev,
          timeDeltaMinutes: deltaMin,
          sameLocation: true,
          type: "corroborating",
          detail: `Evidence (${ev.source}) corroborates presence at "${ev.place}" at ${ev.timestamp}.`,
        });
      }
    }
  }

  return matches;
}
