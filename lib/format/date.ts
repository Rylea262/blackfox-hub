export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// For prefilling a free-text DD/MM/YYYY input (no em-dash fallback).
export function formatDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Accept DD/MM/YYYY or D/M/YYYY (or already-ISO YYYY-MM-DD) and return
// canonical YYYY-MM-DD. Returns null if blank, "invalid" if the input
// isn't parseable so the caller can surface a useful message.
export function parseDateInput(
  input: string,
): string | null | "invalid" {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "invalid";
  const [, d, mo, y] = m;
  const day = Number(d);
  const month = Number(mo);
  const year = Number(y);
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return "invalid";
  }
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
