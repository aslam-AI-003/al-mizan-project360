/** Business time zone: entries are dated by the Indian calendar day. */
const BUSINESS_TZ = "Asia/Kolkata";

/** Today's date as YYYY-MM-DD in the business time zone. */
export function todayKey(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ }).format(new Date());
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * A calendar day stored as [UTC midnight, next UTC midnight). All entry dates
 * are saved as UTC midnight of their calendar day, so this matches them exactly.
 */
export function dayRange(key: string) {
  const start = new Date(`${key}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

export function todayRangeUTC() {
  return dayRange(todayKey());
}
