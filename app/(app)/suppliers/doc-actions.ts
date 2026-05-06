"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getSupplierDocUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("supplier-documents")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function attachSupplierDoc(
  supplierId: string,
  fileName: string,
  filePath: string,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase.from("supplier_documents").insert({
    supplier_id: supplierId,
    file_name: fileName,
    file_url: filePath,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/suppliers");
}

export async function renameSupplierDoc(
  docId: string,
  newName: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const trimmed = newName.trim();
  if (!trimmed) return { error: "Name cannot be empty" };
  const supabase = createClient();
  const { error } = await supabase
    .from("supplier_documents")
    .update({ file_name: trimmed })
    .eq("id", docId);
  if (error) return { error: error.message };
  revalidatePath("/suppliers");
}

export async function deleteSupplierDoc(
  docId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("supplier_documents")
    .select("file_url")
    .eq("id", docId)
    .maybeSingle();

  const { error } = await supabase
    .from("supplier_documents")
    .delete()
    .eq("id", docId);
  if (error) return { error: error.message };

  if (existing?.file_url) {
    const { error: removeErr } = await supabase.storage
      .from("supplier-documents")
      .remove([existing.file_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for supplier doc ${docId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/suppliers");
}
