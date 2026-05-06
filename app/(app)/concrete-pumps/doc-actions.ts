"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getPumpDocUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("concrete-pump-documents")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function attachPumpDoc(
  pumpId: string,
  fileName: string,
  filePath: string,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase.from("concrete_pump_documents").insert({
    pump_id: pumpId,
    file_name: fileName,
    file_url: filePath,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/concrete-pumps");
}

export async function deletePumpDoc(
  docId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("concrete_pump_documents")
    .select("file_url")
    .eq("id", docId)
    .maybeSingle();

  const { error } = await supabase
    .from("concrete_pump_documents")
    .delete()
    .eq("id", docId);
  if (error) return { error: error.message };

  if (existing?.file_url) {
    const { error: removeErr } = await supabase.storage
      .from("concrete-pump-documents")
      .remove([existing.file_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for pump doc ${docId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/concrete-pumps");
}

export async function getCompanyDocUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("pump-company-documents")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function attachCompanyDoc(
  companyName: string,
  fileName: string,
  filePath: string,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const trimmed = companyName.trim();
  if (!trimmed) return { error: "Company is required" };

  const { error } = await supabase.from("pump_company_documents").insert({
    company_name: trimmed,
    file_name: fileName,
    file_url: filePath,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/concrete-pumps");
}

export async function deleteCompanyDoc(
  docId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("pump_company_documents")
    .select("file_url")
    .eq("id", docId)
    .maybeSingle();

  const { error } = await supabase
    .from("pump_company_documents")
    .delete()
    .eq("id", docId);
  if (error) return { error: error.message };

  if (existing?.file_url) {
    const { error: removeErr } = await supabase.storage
      .from("pump-company-documents")
      .remove([existing.file_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for pump company doc ${docId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/concrete-pumps");
}
