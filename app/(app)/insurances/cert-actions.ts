"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getCertDownloadUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("insurance-certificates")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function updateCertPath(
  insuranceId: string,
  path: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { error } = await supabase
    .from("insurances")
    .update({ certificate_url: path })
    .eq("id", insuranceId);

  if (error) return { error: error.message };
  revalidatePath("/insurances");
}
