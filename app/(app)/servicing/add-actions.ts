"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function addServicing(
  assetId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  if (!assetId) return { error: "Missing asset" };

  const serviceRaw = String(formData.get("service_date") ?? "").trim();
  const nextRaw = String(formData.get("next_service_date") ?? "").trim();
  const serviced_by =
    String(formData.get("serviced_by") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("servicing").insert({
    asset_id: assetId,
    service_date: serviceRaw || null,
    next_service_date: nextRaw || null,
    serviced_by,
    notes,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/servicing");
}
