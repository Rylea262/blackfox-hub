"use server";

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
