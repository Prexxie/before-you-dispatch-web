// Shared clock formatting, always in Nigeria time. Deliveries are same-day
// (CLAUDE.md), so screens about one delivery show a time only; the dashboard
// list spans days, so it uses formatDayTime.

export function formatTime(iso: string): string;
export function formatTime(iso: string | null): string | undefined;
export function formatTime(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

const LAGOS = "Africa/Lagos";

// The calendar day in Nigeria, as YYYY-MM-DD, for comparing days.
function lagosDay(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: LAGOS });
}

// "Today, 8:04 pm", "Yesterday, 6:55 pm", or "Mon 28 Sep, 6:10 pm"; the
// year is added only for a different year.
export function formatDayTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = formatTime(iso);
  const day = lagosDay(d);
  if (day === lagosDay(now)) return `Today, ${time}`;
  if (day === lagosDay(new Date(now.getTime() - 86_400_000))) return `Yesterday, ${time}`;
  const sameYear =
    d.toLocaleDateString("en-NG", { year: "numeric", timeZone: LAGOS }) ===
    now.toLocaleDateString("en-NG", { year: "numeric", timeZone: LAGOS });
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: LAGOS,
  });
  return `${date}, ${time}`;
}
