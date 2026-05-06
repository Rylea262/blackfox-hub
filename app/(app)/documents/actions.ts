"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getCompanyDocUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("company-documents")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function attachCompanyDoc(
  fileName: string,
  filePath: string,
  description: string | null,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase.from("company_documents").insert({
    file_name: fileName,
    file_url: filePath,
    description,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/documents");
}

export async function renameCompanyDoc(
  docId: string,
  newName: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const trimmed = newName.trim();
  if (!trimmed) return { error: "Name cannot be empty" };
  const supabase = createClient();
  const { error } = await supabase
    .from("company_documents")
    .update({ file_name: trimmed })
    .eq("id", docId);
  if (error) return { error: error.message };
  revalidatePath("/documents");
}

export async function updateCompanyDocDescription(
  docId: string,
  description: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const trimmed = description.trim();
  const supabase = createClient();
  const { error } = await supabase
    .from("company_documents")
    .update({ description: trimmed || null })
    .eq("id", docId);
  if (error) return { error: error.message };
  revalidatePath("/documents");
}

export async function deleteCompanyDoc(
  docId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("company_documents")
    .select("file_url")
    .eq("id", docId)
    .maybeSingle();

  const { error } = await supabase
    .from("company_documents")
    .delete()
    .eq("id", docId);
  if (error) return { error: error.message };

  if (existing?.file_url) {
    const { error: removeErr } = await supabase.storage
      .from("company-documents")
      .remove([existing.file_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for company doc ${docId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/documents");
}
