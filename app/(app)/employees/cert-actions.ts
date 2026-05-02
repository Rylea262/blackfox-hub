"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function getCertDownloadUrl(path: string): Promise<string> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("employee-certificates")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not generate signed URL");
  }
  return data.signedUrl;
}

export async function attachCert(
  userId: string,
  fileName: string,
  filePath: string,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase.from("employee_certificates").insert({
    user_id: userId,
    file_name: fileName,
    file_url: filePath,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/employees");
}

export async function deleteCert(
  certId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("employee_certificates")
    .select("file_url")
    .eq("id", certId)
    .maybeSingle();

  const { error } = await supabase
    .from("employee_certificates")
    .delete()
    .eq("id", certId);
  if (error) return { error: error.message };

  if (existing?.file_url) {
    const { error: removeErr } = await supabase.storage
      .from("employee-certificates")
      .remove([existing.file_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for cert ${certId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/employees");
}
