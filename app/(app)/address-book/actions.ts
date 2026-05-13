"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

const VALID_BF_COMPANIES = [
  "black_fox_industries",
  "black_fox_concrete_pumping",
] as const;

function readContact(formData: FormData) {
  const bf_company = String(formData.get("bf_company") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { bf_company, name, company, position, email, phone, notes };
}

export async function addContact(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readContact(formData);
  if (!fields.name) return { error: "Name is required" };
  if (
    !VALID_BF_COMPANIES.includes(
      fields.bf_company as (typeof VALID_BF_COMPANIES)[number],
    )
  ) {
    return { error: "Pick a Black Fox company" };
  }

  const { data, error } = await supabase
    .from("address_book_contacts")
    .insert({ ...fields, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Insert returned no row" };

  revalidatePath("/address-book");
  return { id: data.id };
}

export async function updateContact(
  contactId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readContact(formData);
  if (!fields.name) return { error: "Name is required" };
  if (
    !VALID_BF_COMPANIES.includes(
      fields.bf_company as (typeof VALID_BF_COMPANIES)[number],
    )
  ) {
    return { error: "Pick a Black Fox company" };
  }

  const { error } = await supabase
    .from("address_book_contacts")
    .update(fields)
    .eq("id", contactId);

  if (error) return { error: error.message };

  revalidatePath("/address-book");
}

export async function deleteContact(
  contactId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("address_book_contacts")
    .delete()
    .eq("id", contactId);
  if (error) return { error: error.message };

  revalidatePath("/address-book");
}
