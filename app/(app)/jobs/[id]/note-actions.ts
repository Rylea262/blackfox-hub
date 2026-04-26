"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function addNote(
  jobId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "Note cannot be empty" };
  }

  const { error } = await supabase
    .from("job_notes")
    .insert({ job_id: jobId, user_id: user.id, body });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/jobs/${jobId}`);
}
