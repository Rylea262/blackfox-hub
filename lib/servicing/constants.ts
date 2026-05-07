export const ASSET_TYPES = [
  { value: "vehicle", label: "Vehicle" },
  { value: "plant", label: "Plant" },
  { value: "trailer", label: "Trailer" },
] as const;

export function isVehicleLike(type: string): boolean {
  return type === "vehicle" || type === "trailer";
}

export const ASSET_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ASSET_TYPES.map((a) => [a.value, a.label]),
);
