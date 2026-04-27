"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { COMPANY_ASSET_CATEGORIES } from "@/lib/company-assets/constants";

const VALID_CATEGORIES: string[] = COMPANY_ASSET_CATEGORIES.map((c) => c.value);

export async function updateAsset(
  assetId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
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

  const { error } = await supabase
    .from("company_assets")
    .update({ name, category, value, purchase_date, notes })
    .eq("id", assetId);

  if (error) return { error: error.message };

  revalidatePath("/assets");
}

export async function deleteAsset(
  assetId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("company_assets")
    .select("receipt_url")
    .eq("id", assetId)
    .maybeSingle();

  const { error } = await supabase
    .from("company_assets")
    .delete()
    .eq("id", assetId);
  if (error) return { error: error.message };

  if (existing?.receipt_url) {
    const { error: removeErr } = await supabase.storage
      .from("asset-receipts")
      .remove([existing.receipt_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for asset ${assetId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/assets");
}
