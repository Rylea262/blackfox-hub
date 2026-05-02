"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getDownloadUrl(filePath: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 3600);

  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function renameDocument(
  documentId: string,
  jobId: string,
  newName: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const trimmed = newName.trim();
  if (!trimmed) return { error: "Name cannot be empty" };

  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .update({ file_name: trimmed })
    .eq("id", documentId);

  if (error) return { error: error.message };

  revalidatePath(`/jobs/${jobId}`);
}
