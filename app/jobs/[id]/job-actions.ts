"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function deleteJob(
  jobId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  // Capture file paths before the cascade wipes the document rows.
  const { data: docs } = await supabase
    .from("documents")
    .select("file_url")
    .eq("job_id", jobId);

  const filePaths = (docs ?? [])
    .map((d) => d.file_url)
    .filter((p): p is string => Boolean(p));

  const { error: dbErr } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId);

  if (dbErr) {
    return { error: dbErr.message };
  }

  // Best effort — DB is the source of truth; orphaned files in Storage are
  // recoverable, but broken state (rows referencing missing files) is not.
  if (filePaths.length > 0) {
    const { error: removeErr } = await supabase.storage
      .from("documents")
      .remove(filePaths);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for job ${jobId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/office");
  redirect("/jobs");
}
