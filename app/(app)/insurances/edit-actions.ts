"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { COMPANIES } from "@/lib/insurances/constants";

const VALID_COMPANIES: string[] = COMPANIES.map((c) => c.value);

export async function updateInsurance(
  insuranceId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const company = String(formData.get("company") ?? "").trim();
  if (!company) return { error: "Company is required" };
  if (!VALID_COMPANIES.includes(company)) {
    return { error: "Invalid company" };
  }

  const provider = String(formData.get("provider") ?? "").trim() || null;
  const policy_number =
    String(formData.get("policy_number") ?? "").trim() || null;
  const startRaw = String(formData.get("start_date") ?? "").trim();
  const expiryRaw = String(formData.get("expiry_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase
    .from("insurances")
    .update({
      name,
      company,
      provider,
      policy_number,
      start_date: startRaw || null,
      expiry_date: expiryRaw || null,
      notes,
    })
    .eq("id", insuranceId);

  if (error) return { error: error.message };

  revalidatePath("/insurances");
}

export async function deleteInsurance(
  insuranceId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  // Capture certificate path before deleting so we can clean up Storage.
  const { data: existing } = await supabase
    .from("insurances")
    .select("certificate_url")
    .eq("id", insuranceId)
    .maybeSingle();

  const { error: dbErr } = await supabase
    .from("insurances")
    .delete()
    .eq("id", insuranceId);

  if (dbErr) return { error: dbErr.message };

  // Best-effort Storage cleanup. DB is the source of truth.
  if (existing?.certificate_url) {
    const { error: removeErr } = await supabase.storage
      .from("insurance-certificates")
      .remove([existing.certificate_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for insurance ${insuranceId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/insurances");
}
