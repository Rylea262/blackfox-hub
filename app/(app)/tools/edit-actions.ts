"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { TOOL_CATEGORIES } from "@/lib/tools/constants";

const VALID_CATEGORIES: string[] = TOOL_CATEGORIES.map((c) => c.value);

export async function updateTool(
  toolId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const category = String(formData.get("category") ?? "").trim();
  if (!VALID_CATEGORIES.includes(category)) {
    return { error: "Pick a category" };
  }

  const serial_number =
    String(formData.get("serial_number") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase
    .from("tools")
    .update({ name, category, serial_number, location, notes })
    .eq("id", toolId);

  if (error) return { error: error.message };

  revalidatePath("/tools");
}

export async function deleteTool(
  toolId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { error } = await supabase.from("tools").delete().eq("id", toolId);

  if (error) return { error: error.message };

  revalidatePath("/tools");
}
