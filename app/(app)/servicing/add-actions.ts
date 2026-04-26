"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { ASSET_TYPES } from "@/lib/servicing/constants";

const VALID_TYPES: string[] = ASSET_TYPES.map((a) => a.value);

export async function addServicing(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const asset_name = String(formData.get("asset_name") ?? "").trim();
  if (!asset_name) return { error: "Asset name is required" };

  const asset_type = String(formData.get("asset_type") ?? "").trim();
  if (!VALID_TYPES.includes(asset_type)) {
    return { error: "Asset type must be vehicle or plant" };
  }

  const serviceRaw = String(formData.get("service_date") ?? "").trim();
  const nextRaw = String(formData.get("next_service_date") ?? "").trim();
  const serviced_by =
    String(formData.get("serviced_by") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("servicing").insert({
    asset_name,
    asset_type,
    service_date: serviceRaw || null,
    next_service_date: nextRaw || null,
    serviced_by,
    notes,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/servicing");
}
