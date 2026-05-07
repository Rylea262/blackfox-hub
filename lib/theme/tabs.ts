// Shared per-tab colour theme. Tailwind needs each utility class as a
// literal string in source so the JIT scanner picks them up — keep
// every entry below exactly as written.

export type TabColour = {
  pillIdle: string;
  pillActive: string;
  pageBg: string;
};

export const TAB_THEME: TabColour[] = [
  {
    pillIdle: "bg-blue-100 text-blue-900 hover:bg-blue-200",
    pillActive: "bg-blue-600 text-white",
    pageBg: "bg-blue-50",
  },
  {
    pillIdle: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
    pillActive: "bg-emerald-600 text-white",
    pageBg: "bg-emerald-50",
  },
  {
    pillIdle: "bg-amber-100 text-amber-900 hover:bg-amber-200",
    pillActive: "bg-amber-600 text-white",
    pageBg: "bg-amber-50",
  },
  {
    pillIdle: "bg-purple-100 text-purple-900 hover:bg-purple-200",
    pillActive: "bg-purple-600 text-white",
    pageBg: "bg-purple-50",
  },
  {
    pillIdle: "bg-rose-100 text-rose-900 hover:bg-rose-200",
    pillActive: "bg-rose-600 text-white",
    pageBg: "bg-rose-50",
  },
  {
    pillIdle: "bg-cyan-100 text-cyan-900 hover:bg-cyan-200",
    pillActive: "bg-cyan-600 text-white",
    pageBg: "bg-cyan-50",
  },
  {
    pillIdle: "bg-teal-100 text-teal-900 hover:bg-teal-200",
    pillActive: "bg-teal-600 text-white",
    pageBg: "bg-teal-50",
  },
  {
    pillIdle: "bg-indigo-100 text-indigo-900 hover:bg-indigo-200",
    pillActive: "bg-indigo-600 text-white",
    pageBg: "bg-indigo-50",
  },
  {
    pillIdle: "bg-fuchsia-100 text-fuchsia-900 hover:bg-fuchsia-200",
    pillActive: "bg-fuchsia-600 text-white",
    pageBg: "bg-fuchsia-50",
  },
  {
    pillIdle: "bg-lime-100 text-lime-900 hover:bg-lime-200",
    pillActive: "bg-lime-600 text-white",
    pageBg: "bg-lime-50",
  },
];

// Match longest paths first so /concrete-pumps doesn't accidentally hit
// /co... wait, none of these collide, but order is still source-of-truth
// for both pill index and theme. Keep in sync with the tab order in
// app/(app)/tab-nav.tsx.
export const PATH_TO_COLOUR_INDEX: { match: string; index: number }[] = [
  { match: "/dashboard", index: 0 },
  { match: "/notes", index: 1 },
  { match: "/jobs", index: 2 },
  { match: "/employees", index: 3 },
  { match: "/insurances", index: 4 },
  { match: "/servicing", index: 5 },
  { match: "/tools", index: 6 },
  { match: "/assets", index: 7 },
  { match: "/suppliers", index: 8 },
  { match: "/subcontractors", index: 9 },
  { match: "/concrete-pumps", index: 10 },
  { match: "/documents", index: 11 },
];

export function pageBgForPath(pathname: string): string {
  const hit = PATH_TO_COLOUR_INDEX.find((p) => pathname.startsWith(p.match));
  if (!hit) return "bg-sky-50";
  // Wrap with modulo so the bg keeps matching the pill when there
  // are more tabs than palette entries.
  return TAB_THEME[hit.index % TAB_THEME.length]?.pageBg ?? "bg-sky-50";
}
