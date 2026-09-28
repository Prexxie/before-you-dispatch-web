// Shared clock formatting: same-day product (CLAUDE.md), so every
// timestamp the vendor sees is a time only, in Nigeria time, never a date.

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
