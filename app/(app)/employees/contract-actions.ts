"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getContractDownloadUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("employee-contracts")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function setContractPath(
  userId: string,
  path: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  // If a previous contract exists for this user, remove it from storage
  // so we don't leak orphaned files when replacing.
  const { data: existing } = await supabase
    .from("users")
    .select("contract_url")
    .eq("id", userId)
    .maybeSingle();

  if (existing?.contract_url && existing.contract_url !== path) {
    const { error: removeErr } = await supabase.storage
      .from("employee-contracts")
      .remove([existing.contract_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed when replacing contract for ${userId}: ${removeErr.message}`,
      );
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ contract_url: path })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/employees");
}

export async function removeContract(
  userId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("users")
    .select("contract_url")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("users")
    .update({ contract_url: null })
    .eq("id", userId);
  if (error) return { error: error.message };

  if (existing?.contract_url) {
    const { error: removeErr } = await supabase.storage
      .from("employee-contracts")
      .remove([existing.contract_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for contract on ${userId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/employees");
}
