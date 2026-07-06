const DEFAULT_TZ = "Africa/Lagos";

/**
 * Timezone for all date resolution, from the TZ env var. Falls back to the
 * default when unset or when the value isn't a valid IANA zone (Lambda sets
 * TZ to ":UTC", which Intl rejects).
 */
export function resolveTz(): string {
  const tz = process.env.TZ;
  if (!tz) {
    return DEFAULT_TZ;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

/** Today's calendar date (YYYY-MM-DD) and weekday name in the given zone. */
export function todayInTz(tz: string): { date: string; weekday: string } {
  const now = new Date();
  return {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now),
    weekday: new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
    }).format(now),
  };
}

/**
 * Midnight of a YYYY-MM-DD date in the given zone, as an absolute instant
 * for a TIMESTAMPTZ column. Returns null on anything malformed.
 */
export function midnightInTz(dateStr: string, tz: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  // Read the zone's UTC offset at noon of that day — noon can't land on the
  // wrong calendar date, and no zone shifts DST at noon.
  const noon = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(noon.getTime())) {
    return null;
  }
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  })
    .formatToParts(noon)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/.exec(offset ?? "");
  if (!match) {
    return null;
  }
  const suffix = match[1] ? `${match[1]}${match[2]}:${match[3]}` : "Z";
  const date = new Date(`${dateStr}T00:00:00${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats an instant back to its YYYY-MM-DD calendar date in the given zone. */
export function formatDateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
}
