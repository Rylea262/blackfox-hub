export const ASSET_TYPES = [
  { value: "vehicle", label: "Vehicle" },
  { value: "plant", label: "Plant" },
] as const;

export const ASSET_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ASSET_TYPES.map((a) => [a.value, a.label]),
);
