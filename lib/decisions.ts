import { ExtractedClaim, Evidence } from "@/agent/schemas";

/**
 * Deterministic "Decisions Made" synthesis shared by the agent pipeline
 * (server) and the demo workspace (client). Given the deduplicated claims
 * and the evidence ledger, produces one human-readable decision per claim:
 *
 * - Verified:      claim corroborated by an evidence record (same place,
 *                  timestamp within 30 minutes)
 * - Disputed:      claim conflicts with the evidentiary record
 * - Pending:       claim still awaits slot clarification
 * - Uncontradicted: no evidence contradicts the claim (weak support)
 *
 * Originals are NEVER mutated — decisions are new strings derived at
 * synthesis time, so SHA-256 hash chains stay valid.
 */
export function synthesizeDecisions(
  claims: ExtractedClaim[],
  evidenceList: Evidence[]
): string[] {
  // Deduplicate by verbatim source quote (audit-chain safe — copies only)
  const unique = claims.filter(
    (c, i, arr) => arr.findIndex((x) => x.source_quote === c.source_quote) === i
  );

  return unique.map((claim) => {
    if (claim.status === "disputed") {
      return `Disputed: "${claim.what}" (${claim.who ?? "unknown actor"}) - conflicts with the evidentiary record${claim.place ? ` at ${claim.place}` : ""}.`;
    }

    const corroborating = evidenceList.find(
      (ev) =>
        Boolean(
          claim.place &&
            ev.place &&
            ev.place.trim().toLowerCase() === claim.place.trim().toLowerCase() &&
            claim.time_start &&
            Math.abs(
              new Date(ev.timestamp).getTime() -
                new Date(claim.time_start as string).getTime()
            ) <
              30 * 60 * 1000
        )
    );

    if (corroborating) {
      return `Verified: "${claim.what}" (${claim.who ?? "unknown actor"}) - corroborated by ${corroborating.kind.replace("_", " ")} record at ${corroborating.place}.`;
    }
    if (claim.status === "needs_clarification") {
      return `Pending: "${claim.what}" - awaiting clarification of ${(claim.unknown_slots ?? []).join(", ")}.`;
    }
    return `Uncontradicted: "${claim.what}" (${claim.who ?? "unknown actor"}).`;
  });
}
