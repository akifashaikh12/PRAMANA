import { ExtractedClaim, Evidence, Finding } from "../agent/schemas";

export interface GapDetectionOptions {
  mode?: "investigation" | "hiring" | "diary";
  gapThresholdMinutes?: number;
}

interface TimelinePoint {
  sourceType: "claim" | "evidence";
  id?: string;
  label: string;
  place?: string | null;
  timestamp: string;
  timeMs: number;
}

/**
 * Identifies significant unaccounted gaps in the chronological timeline of claims and evidence.
 */
export function detectTimelineGaps(
  claims: ExtractedClaim[],
  evidenceList: Evidence[],
  options: GapDetectionOptions = {}
): Finding[] {
  const mode = options.mode || "investigation";

  // Mode-dependent default gap thresholds
  let defaultThresholdMin = 120; // 2 hours for investigation
  if (mode === "hiring") {
    defaultThresholdMin = 60 * 24 * 30; // 30 days for career continuity
  } else if (mode === "diary") {
    defaultThresholdMin = 60 * 24; // 24 hours for diary narrative
  }

  const thresholdMinutes = options.gapThresholdMinutes ?? defaultThresholdMin;

  const points: TimelinePoint[] = [];

  // Collect claims with valid timestamps
  for (const c of claims) {
    if (c.time_start) {
      const ms = new Date(c.time_start).getTime();
      if (!isNaN(ms)) {
        points.push({
          sourceType: "claim",
          id: c.id,
          label: c.what,
          place: c.place,
          timestamp: c.time_start,
          timeMs: ms,
        });
      }
    }
  }

  // Collect evidence points
  for (const ev of evidenceList) {
    if (ev.timestamp) {
      const ms = new Date(ev.timestamp).getTime();
      if (!isNaN(ms)) {
        points.push({
          sourceType: "evidence",
          id: ev.id,
          label: `${ev.source}: ${ev.description}`,
          place: ev.place,
          timestamp: ev.timestamp,
          timeMs: ms,
        });
      }
    }
  }

  // Need at least 2 points to find a gap between them
  if (points.length < 2) {
    return [];
  }

  // Sort chronologically
  points.sort((a, b) => a.timeMs - b.timeMs);

  const findings: Finding[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const diffMinutes = Math.round((next.timeMs - current.timeMs) / (60 * 1000));

    if (diffMinutes >= thresholdMinutes) {
      const hours = Math.floor(diffMinutes / 60);
      const remainingMin = diffMinutes % 60;
      const durationStr =
        hours > 0
          ? `${hours}h ${remainingMin > 0 ? remainingMin + "m" : ""}`.trim()
          : `${diffMinutes}m`;

      findings.push({
        id: `finding-gap-${i}-${next.id || i + 1}`,
        type: "timeline_gap",
        claim_id: current.sourceType === "claim" ? current.id : next.id,
        evidence_id: current.sourceType === "evidence" ? current.id : undefined,
        status: "open",
        explanation: `Unaccounted timeline gap of ${durationStr} detected between "${current.label}" (${current.timestamp}) and "${next.label}" (${next.timestamp}). No activities, movements, or logs accounted for in this interval.`,
      });
    }
  }

  return findings;
}
