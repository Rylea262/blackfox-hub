"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

function parseAmount(raw: string, label: string):
  | { value: number | null }
  | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: `${label} must be a non-negative number` };
  }
  return { value: parsed };
}

function readSupplier(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const contact_name =
    String(formData.get("contact_name") ?? "").trim() || null;
  const contact_email =
    String(formData.get("contact_email") ?? "").trim() || null;
  const contact_phone =
    String(formData.get("contact_phone") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const account_number =
    String(formData.get("account_number") ?? "").trim() || null;
  const payment_terms =
    String(formData.get("payment_terms") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return {
    name,
    contact_name,
    contact_email,
    contact_phone,
    website,
    address,
    account_number,
    payment_terms,
    notes,
  };
}

export async function addSupplier(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readSupplier(formData);
  if (!fields.name) return { error: "Name is required" };

  const limit = parseAmount(
    String(formData.get("credit_limit") ?? ""),
    "Credit limit",
  );
  if ("error" in limit) return { error: limit.error };

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      ...fields,
      credit_limit: limit.value,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Insert returned no row" };

  revalidatePath("/suppliers");
  return { id: data.id };
}

export async function updateSupplier(
  supplierId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readSupplier(formData);
  if (!fields.name) return { error: "Name is required" };

  const limit = parseAmount(
    String(formData.get("credit_limit") ?? ""),
    "Credit limit",
  );
  if ("error" in limit) return { error: limit.error };

  const { error } = await supabase
    .from("suppliers")
    .update({ ...fields, credit_limit: limit.value })
    .eq("id", supplierId);

  if (error) return { error: error.message };

  revalidatePath("/suppliers");
}

export async function deleteSupplier(
  supplierId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  // Capture document paths so we can clean up storage after the cascade.
  const { data: docs } = await supabase
    .from("supplier_documents")
    .select("file_url")
    .eq("supplier_id", supplierId);

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId);
  if (error) return { error: error.message };

  const paths = (docs ?? [])
    .map((d) => d.file_url)
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    const { error: removeErr } = await supabase.storage
      .from("supplier-documents")
      .remove(paths);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for supplier ${supplierId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/suppliers");
}
