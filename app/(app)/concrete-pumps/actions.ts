"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

function readFields(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim() || null;
  const serial_number =
    String(formData.get("serial_number") ?? "").trim() || null;
  const registration =
    String(formData.get("registration") ?? "").trim() || null;
  const capacity = String(formData.get("capacity") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { company, name, model, serial_number, registration, capacity, notes };
}

export async function addPump(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readFields(formData);
  if (!fields.company) return { error: "Company is required" };
  if (!fields.name) return { error: "Pump name is required" };

  const { data, error } = await supabase
    .from("concrete_pumps")
    .insert({ ...fields, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Insert returned no row" };

  revalidatePath("/concrete-pumps");
  return { id: data.id };
}

export async function updatePump(
  pumpId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readFields(formData);
  if (!fields.company) return { error: "Company is required" };
  if (!fields.name) return { error: "Pump name is required" };

  const { error } = await supabase
    .from("concrete_pumps")
    .update(fields)
    .eq("id", pumpId);

  if (error) return { error: error.message };

  revalidatePath("/concrete-pumps");
}

export async function upsertPumpCompany(
  name: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Company name is required" };

  const contact_name =
    String(formData.get("contact_name") ?? "").trim() || null;
  const contact_phone =
    String(formData.get("contact_phone") ?? "").trim() || null;
  const contact_email =
    String(formData.get("contact_email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const account_number =
    String(formData.get("account_number") ?? "").trim() || null;
  const payment_terms =
    String(formData.get("payment_terms") ?? "").trim() || null;
  const limitRaw = String(formData.get("credit_limit") ?? "").trim();
  let credit_limit: number | null = null;
  if (limitRaw) {
    const parsed = Number(limitRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Credit limit must be a non-negative number" };
    }
    credit_limit = parsed;
  }

  const { error } = await supabase.from("pump_companies").upsert(
    {
      name: trimmed,
      contact_name,
      contact_phone,
      contact_email,
      notes,
      account_number,
      credit_limit,
      payment_terms,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "name" },
  );

  if (error) return { error: error.message };

  revalidatePath("/concrete-pumps");
}

export async function deletePump(
  pumpId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: docs } = await supabase
    .from("concrete_pump_documents")
    .select("file_url")
    .eq("pump_id", pumpId);

  const { error } = await supabase
    .from("concrete_pumps")
    .delete()
    .eq("id", pumpId);
  if (error) return { error: error.message };

  const paths = (docs ?? [])
    .map((d) => d.file_url)
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    const { error: removeErr } = await supabase.storage
      .from("concrete-pump-documents")
      .remove(paths);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for pump ${pumpId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/concrete-pumps");
}
