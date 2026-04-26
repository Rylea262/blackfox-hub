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

  const { error } = await supabase
    .from("tools")
    .update({
      name,
      category,
      serial_number,
      location,
      notes,
      next_service_due,
      value,
    })
    .eq("id", toolId);

  if (error) return { error: error.message };

  revalidatePath("/tools");
}

export async function deleteTool(
  toolId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  // Capture receipt path before deleting so we can clean it up after.
  const { data: existing } = await supabase
    .from("tools")
    .select("receipt_url")
    .eq("id", toolId)
    .maybeSingle();

  const { error } = await supabase.from("tools").delete().eq("id", toolId);
  if (error) return { error: error.message };

  // Best-effort Storage cleanup. DB is the source of truth.
  if (existing?.receipt_url) {
    const { error: removeErr } = await supabase.storage
      .from("tool-receipts")
      .remove([existing.receipt_url]);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for tool ${toolId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/tools");
}
