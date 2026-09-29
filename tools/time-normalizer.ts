export interface TimeNormalizationResult {
  timeStart: string | null;
  timeEnd: string | null;
  precision: "minute" | "hour" | "day" | "unknown";
  normalized: boolean;
  originalExpression: string;
}

/**
 * Normalizes relative or natural language time expressions into ISO 8601 start/end timestamps.
 * Anchored to the provided reference statementDate.
 */
export function normalizeTimeExpression(
  expression: string | null | undefined,
  referenceDateIso: string = new Date().toISOString()
): TimeNormalizationResult {
  if (!expression || expression.trim() === "") {
    return {
      timeStart: null,
      timeEnd: null,
      precision: "unknown",
      normalized: false,
      originalExpression: "",
    };
  }

  const raw = expression.trim();
  const lower = raw.toLowerCase();

  const refDate = new Date(referenceDateIso);
  const baseDate = isNaN(refDate.getTime()) ? new Date() : refDate;

  // 1. Check if expression is already a valid ISO or date format
  const parsedDirect = Date.parse(raw);
  if (!isNaN(parsedDirect) && (raw.includes("-") || raw.includes("/") || raw.includes("T"))) {
    const directDate = new Date(parsedDirect);
    const hasTime = raw.includes("T") || raw.includes(":") || raw.includes(" ");
    return {
      timeStart: directDate.toISOString(),
      timeEnd: null,
      precision: hasTime ? (raw.includes(":") ? "minute" : "hour") : "day",
      normalized: true,
      originalExpression: raw,
    };
  }

  // Helper to extract time (HH:mm) from a string
  const parseClockTime = (str: string): { hour: number; minute: number } | null => {
    // Matches 14:30, 2:30pm, 2:30 pm, 3pm, 3:00am, etc.
    const timeMatch = str.match(/(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (!timeMatch) return null;

    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3]?.toLowerCase();

    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
    return null;
  };

  // 2. Range check: "between X and Y" or "from X to Y"
  const rangeMatch = lower.match(/(?:between|from)\s+([0-9a-z:\s]+)\s+(?:and|to)\s+([0-9a-z:\s]+)/i);
  if (rangeMatch) {
    const startPart = rangeMatch[1];
    const endPart = rangeMatch[2];
    const clockStart = parseClockTime(startPart);
    const clockEnd = parseClockTime(endPart);

    if (clockStart && clockEnd) {
      const targetStart = new Date(baseDate);
      targetStart.setHours(clockStart.hour, clockStart.minute, 0, 0);

      const targetEnd = new Date(baseDate);
      targetEnd.setHours(clockEnd.hour, clockEnd.minute, 0, 0);

      // If expression includes "yesterday", adjust day
      if (lower.includes("yesterday")) {
        targetStart.setDate(targetStart.getDate() - 1);
        targetEnd.setDate(targetEnd.getDate() - 1);
      }

      return {
        timeStart: targetStart.toISOString(),
        timeEnd: targetEnd.toISOString(),
        precision: "minute",
        normalized: true,
        originalExpression: raw,
      };
    }
  }

  // 3. Determine target day offset
  let dayOffset = 0;
  let defaultHour = 12;
  let defaultMinute = 0;
  let precision: "minute" | "hour" | "day" = "day";

  if (lower.includes("yesterday")) {
    dayOffset = -1;
  } else if (lower.includes("tomorrow")) {
    dayOffset = 1;
  } else if (lower.includes("today")) {
    dayOffset = 0;
  } else if (lower.includes("last night")) {
    dayOffset = -1;
    defaultHour = 22;
    precision = "hour";
  } else if (lower.includes("tonight")) {
    dayOffset = 0;
    defaultHour = 21;
    precision = "hour";
  }

  // Relative hours: "2 hours ago", "3 hours later"
  const relHoursMatch = lower.match(/(\d+)\s*(?:hour|hr)s?\s*(ago|later|after)/i);
  if (relHoursMatch) {
    const hrs = parseInt(relHoursMatch[1], 10);
    const direction = relHoursMatch[2] === "ago" ? -1 : 1;
    const target = new Date(baseDate.getTime() + direction * hrs * 3600 * 1000);
    return {
      timeStart: target.toISOString(),
      timeEnd: null,
      precision: "minute",
      normalized: true,
      originalExpression: raw,
    };
  }

  // Relative minutes: "15 minutes later", "30 minutes ago"
  const relMinMatch = lower.match(/(\d+)\s*(?:minute|min)s?\s*(ago|later|after)/i);
  if (relMinMatch) {
    const mins = parseInt(relMinMatch[1], 10);
    const direction = relMinMatch[2] === "ago" ? -1 : 1;
    const target = new Date(baseDate.getTime() + direction * mins * 60 * 1000);
    return {
      timeStart: target.toISOString(),
      timeEnd: null,
      precision: "minute",
      normalized: true,
      originalExpression: raw,
    };
  }

  // Relative days: "3 days ago"
  const relDaysMatch = lower.match(/(\d+)\s*days?\s*ago/i);
  if (relDaysMatch) {
    const days = parseInt(relDaysMatch[1], 10);
    const target = new Date(baseDate);
    target.setDate(target.getDate() - days);
    target.setHours(12, 0, 0, 0);
    return {
      timeStart: target.toISOString(),
      timeEnd: null,
      precision: "day",
      normalized: true,
      originalExpression: raw,
    };
  }

  // Time-of-day phrases
  if (lower.includes("morning")) {
    defaultHour = 9;
    precision = "hour";
  } else if (lower.includes("noon")) {
    defaultHour = 12;
    precision = "hour";
  } else if (lower.includes("afternoon")) {
    defaultHour = 14;
    precision = "hour";
  } else if (lower.includes("evening")) {
    defaultHour = 19;
    precision = "hour";
  } else if (lower.includes("midnight")) {
    defaultHour = 0;
    precision = "hour";
  }

  // Extract explicit clock time if available
  const clock = parseClockTime(raw);
  if (clock) {
    defaultHour = clock.hour;
    defaultMinute = clock.minute;
    precision = "minute";
  }

  // Compute final timestamp
  const targetDate = new Date(baseDate);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  targetDate.setHours(defaultHour, defaultMinute, 0, 0);

  return {
    timeStart: targetDate.toISOString(),
    timeEnd: null,
    precision,
    normalized: true,
    originalExpression: raw,
  };
}
