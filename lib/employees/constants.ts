export const POSITIONS = [
  { value: "concreter", label: "Concreter" },
  { value: "labourer", label: "Labourer" },
  { value: "operator", label: "Operator" },
  { value: "admin", label: "Admin" },
  { value: "contract_admin", label: "Contract Admin" },
] as const;

export type PositionValue = (typeof POSITIONS)[number]["value"];

export const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  POSITIONS.map((p) => [p.value, p.label]),
);
