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

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      name,
      address,
      client,
      start_date,
      status,
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
