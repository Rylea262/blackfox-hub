// Brisbane has no DST — fixed UTC+10 year-round. Using a literal
// offset here is intentional and avoids pulling in a TZ library.
const TZ = "Australia/Brisbane";

function formatYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function todayInBrisbane(): string {
  return formatYmd(new Date());
}

export function isValidYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function dayBoundsUtc(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00+10:00`).toISOString();
  const end = new Date(`${date}T23:59:59.999+10:00`).toISOString();
  return { start, end };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00+10:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return formatYmd(d);
}

export function formatDateLong(date: string): string {
  return new Date(`${date}T12:00:00+10:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
