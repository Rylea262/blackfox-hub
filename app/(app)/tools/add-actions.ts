"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { TOOL_CATEGORIES } from "@/lib/tools/constants";

const VALID_CATEGORIES: string[] = TOOL_CATEGORIES.map((c) => c.value);

export async function addTool(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const { user } = await requireRole(["owner", "office"]);
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

  const dueRaw = String(formData.get("next_service_due") ?? "").trim();
  const next_service_due =
    category === "lasers" && dueRaw ? dueRaw : null;

  const valueRaw = String(formData.get("value") ?? "").trim();
  let value: number | null = null;
  if (valueRaw) {
    const parsed = Number(valueRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Value must be a non-negative number" };
    }
    value = parsed;
  }

  const { data, error } = await supabase
    .from("tools")
    .insert({
      name,
      category,
      serial_number,
      location,
      notes,
      next_service_due,
      value,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Insert returned no row" };

  revalidatePath("/tools");
  return { id: data.id };
}
