export const COMPANIES = [
  { value: "black_fox_industries", label: "Black Fox Industries" },
  {
    value: "black_fox_concrete_pumping",
    label: "Black Fox Concrete Pumping",
  },
  { value: "black_fox_barbers", label: "Black Fox Barbers" },
] as const;

export const COMPANY_LABELS: Record<string, string> = Object.fromEntries(
  COMPANIES.map((c) => [c.value, c.label]),
);
