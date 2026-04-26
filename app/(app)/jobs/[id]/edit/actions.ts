"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function updateJob(jobId: string, formData: FormData) {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(
      `/jobs/${jobId}/edit?error=${encodeURIComponent("Name is required")}`,
    );
  }

  const address = String(formData.get("address") ?? "").trim() || null;
  const client = String(formData.get("client") ?? "").trim() || null;
  const startDateRaw = String(formData.get("start_date") ?? "").trim();
  const start_date = startDateRaw || null;
  const status = String(formData.get("status") ?? "active");

  const projectValueRaw = String(formData.get("project_value") ?? "").trim();
  let project_value: number | null = null;
  if (projectValueRaw) {
    const parsed = Number(projectValueRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      redirect(
        `/jobs/${jobId}/edit?error=${encodeURIComponent("Project value must be a non-negative number")}`,
      );
    }
    project_value = parsed;
  }

  const { error } = await supabase
    .from("jobs")
    .update({ name, address, client, start_date, status, project_value })
    .eq("id", jobId);

  if (error) {
    redirect(
      `/jobs/${jobId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  redirect(`/jobs/${jobId}`);
}
