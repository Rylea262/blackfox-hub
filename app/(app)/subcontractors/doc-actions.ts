"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getSubDocUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("subcontractor-documents")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function attachSubDoc(
  subId: string,
  fileName: string,
  filePath: string,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase.from("subcontractor_documents").insert({
    subcontractor_id: subId,
    file_name: fileName,
    file_url: filePath,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/subcontractors");
}

export async function deleteSubDoc(
  docId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("subcontractor_documents")
    .select("file_url")
    .eq("id", docId)
    .maybeSingle();

  const { error } = await supabase
    .from("subcontractor_documents")
    .delete()
    .eq("id", docId);
  if (error) return { error: error.message };

  if (existing?.file_url) {
    const { error: removeErr } = await supabase.storage
      .from("subcontractor-documents")
      .remove([existing.file_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for sub doc ${docId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/subcontractors");
}
