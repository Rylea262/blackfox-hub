"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { COMPANY_ASSET_CATEGORIES } from "@/lib/company-assets/constants";

const VALID_CATEGORIES: string[] = COMPANY_ASSET_CATEGORIES.map((c) => c.value);

export async function addAsset(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const category = String(formData.get("category") ?? "").trim();
  if (!VALID_CATEGORIES.includes(category)) {
    return { error: "Pick a category" };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;
  const purchaseDateRaw = String(formData.get("purchase_date") ?? "").trim();
  const purchase_date = purchaseDateRaw || null;

  const valueRaw = String(formData.get("value") ?? "").trim();
  let value: number | null = null;
  if (valueRaw) {
    const parsed = Number(valueRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Value must be a non-negative number" };
    }
    value = parsed;
  }

  const { data, error } = await supabase
    .from("company_assets")
    .insert({
      name,
      category,
      value,
      purchase_date,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Insert returned no row" };

  revalidatePath("/assets");
  return { id: data.id };
}
