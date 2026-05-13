"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function addDefect(
  jobId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "Description is required" };

  const defect_date = String(formData.get("defect_date") ?? "").trim();
  if (!defect_date) return { error: "Date is required" };

  const costRaw = String(formData.get("cost") ?? "").trim();
  if (!costRaw) return { error: "Cost is required" };
  const cost = Number(costRaw);
  if (!Number.isFinite(cost)) {
    return { error: "Cost must be a number" };
  }

  const { error } = await supabase.from("job_defects").insert({
    job_id: jobId,
    description,
    defect_date,
    cost,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteDefect(
  defectId: string,
  jobId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("job_defects")
    .delete()
    .eq("id", defectId);

  if (error) return { error: error.message };

  revalidatePath(`/jobs/${jobId}`);
}
