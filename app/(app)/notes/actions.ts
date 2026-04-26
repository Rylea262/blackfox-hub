"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function addOfficeNote(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const subject = String(formData.get("subject") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Body cannot be empty" };

  const { error } = await supabase
    .from("office_notes")
    .insert({ user_id: user.id, subject, body });

  if (error) return { error: error.message };

  revalidatePath("/notes");
}

export async function updateOfficeNote(
  noteId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const subject = String(formData.get("subject") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Body cannot be empty" };

  const { error } = await supabase
    .from("office_notes")
    .update({ subject, body, updated_at: new Date().toISOString() })
    .eq("id", noteId);

  if (error) return { error: error.message };

  revalidatePath("/notes");
}

export async function deleteOfficeNote(
  noteId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("office_notes")
    .delete()
    .eq("id", noteId);

  if (error) return { error: error.message };

  revalidatePath("/notes");
}
