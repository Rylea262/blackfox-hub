export const COMPANY_ASSET_CATEGORIES = [
  { value: "real_estate", label: "Real Estate" },
  { value: "office_furniture", label: "Office Furniture" },
  { value: "it_computers", label: "IT / Computers" },
  { value: "office_equipment", label: "Office Equipment" },
  { value: "software_licenses", label: "Software / Licenses" },
  { value: "other", label: "Other" },
] as const;

export type CompanyAssetCategoryValue =
  (typeof COMPANY_ASSET_CATEGORIES)[number]["value"];

export const COMPANY_ASSET_CATEGORY_LABELS: Record<string, string> =
  Object.fromEntries(COMPANY_ASSET_CATEGORIES.map((c) => [c.value, c.label]));

export const COMPANY_ASSET_CATEGORY_ORDER: string[] =
  COMPANY_ASSET_CATEGORIES.map((c) => c.value);
