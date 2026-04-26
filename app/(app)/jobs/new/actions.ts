"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function createJob(formData: FormData) {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(`/jobs/new?error=${encodeURIComponent("Name is required")}`);
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
        `/jobs/new?error=${encodeURIComponent("Project value must be a non-negative number")}`,
      );
    }
    project_value = parsed;
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      name,
      address,
      client,
      start_date,
      status,
      project_value,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/jobs/new?error=${encodeURIComponent(error?.message ?? "Failed to create job")}`,
    );
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
}
