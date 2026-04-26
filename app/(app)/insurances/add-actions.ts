"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { COMPANIES } from "@/lib/insurances/constants";

const VALID_COMPANIES: string[] = COMPANIES.map((c) => c.value);

export async function addInsurance(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const { user } = await requireRole(["owner", "office"]);
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

  const { data, error } = await supabase
    .from("insurances")
    .insert({
      name,
      company,
      provider,
      policy_number,
      start_date: startRaw || null,
      expiry_date: expiryRaw || null,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Insert returned no row" };

  revalidatePath("/insurances");
  return { id: data.id };
}
