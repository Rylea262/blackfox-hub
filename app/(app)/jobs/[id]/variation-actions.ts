"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function addVariation(
  jobId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const type = String(formData.get("type") ?? "").trim();
  if (!type) return { error: "Type is required" };

  const variation_date = String(formData.get("variation_date") ?? "").trim();
  if (!variation_date) return { error: "Date is required" };

  const valueRaw = String(formData.get("value") ?? "").trim();
  if (!valueRaw) return { error: "Value is required" };
  const value = Number(valueRaw);
  if (!Number.isFinite(value)) {
    return { error: "Value must be a number" };
  }

  const { error } = await supabase.from("job_variations").insert({
    job_id: jobId,
    type,
    variation_date,
    value,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteVariation(
  variationId: string,
  jobId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("job_variations")
    .delete()
    .eq("id", variationId);

  if (error) return { error: error.message };

  revalidatePath(`/jobs/${jobId}`);
}
