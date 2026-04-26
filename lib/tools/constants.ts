export const TOOL_CATEGORIES = [
  { value: "power_tools", label: "Power Tools" },
  { value: "hand_tools", label: "Hand Tools" },
  { value: "safety", label: "Safety Equipment" },
  { value: "lasers", label: "Lasers" },
  { value: "specialized", label: "Specialized Equipment" },
  { value: "other", label: "Other" },
] as const;

export type ToolCategoryValue = (typeof TOOL_CATEGORIES)[number]["value"];

export const TOOL_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  TOOL_CATEGORIES.map((c) => [c.value, c.label]),
);

export const TOOL_CATEGORY_ORDER: string[] = TOOL_CATEGORIES.map((c) => c.value);
