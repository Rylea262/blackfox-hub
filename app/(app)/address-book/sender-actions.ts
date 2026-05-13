"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim();
}

export async function addSender(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const email = readEmail(formData);
  if (!email) return { error: "Email is required" };

  const { error } = await supabase
    .from("address_book_senders")
    .insert({ email, created_by: user.id });

  if (error) return { error: error.message };
  revalidatePath("/address-book");
}

export async function updateSender(
  senderId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const email = readEmail(formData);
  if (!email) return { error: "Email is required" };

  const { error } = await supabase
    .from("address_book_senders")
    .update({ email })
    .eq("id", senderId);

  if (error) return { error: error.message };
  revalidatePath("/address-book");
}

export async function deleteSender(
  senderId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("address_book_senders")
    .delete()
    .eq("id", senderId);

  if (error) return { error: error.message };
  revalidatePath("/address-book");
}
