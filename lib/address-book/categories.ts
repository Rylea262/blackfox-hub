export const CONTACT_CATEGORIES = [
  { value: "builder", label: "Builder" },
  { value: "civil", label: "Civil" },
  { value: "developer", label: "Developer" },
  { value: "concreter", label: "Concreter" },
  { value: "pumpy", label: "Pumpy" },
  { value: "blocklayer", label: "Blocklayer" },
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["value"];

export const CONTACT_CATEGORY_VALUES = CONTACT_CATEGORIES.map(
  (c) => c.value,
) as readonly ContactCategory[];

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const match = CONTACT_CATEGORIES.find((c) => c.value === value);
  return match?.label ?? value;
}
