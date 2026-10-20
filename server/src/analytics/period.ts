export const DAY_MS = 86_400_000;
/** The county works in EAT (UTC+3, no daylight saving). The SQL in the analytics service uses the same offset. */
export const EAT_OFFSET_MS = 3 * 3_600_000;

/** Start of the first day of a `days`-day period ending today, as the UTC instant of 00:00 EAT. */
export function periodStart(days: number) {
  const todayStart = Math.floor((Date.now() + EAT_OFFSET_MS) / DAY_MS) * DAY_MS - EAT_OFFSET_MS;
  return new Date(todayStart - (days - 1) * DAY_MS);
}
