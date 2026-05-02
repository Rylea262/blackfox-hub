"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { ASSET_TYPES } from "@/lib/servicing/constants";

const VALID_TYPES: string[] = ASSET_TYPES.map((a) => a.value);

function parseHours(
  raw: string,
  label: string,
): { value: number | null } | { error: string } {
  if (!raw) return { value: null };
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: `${label} must be a non-negative whole number` };
  }
  return { value: parsed };
}

export async function addAsset(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const type = String(formData.get("type") ?? "").trim();
  if (!VALID_TYPES.includes(type)) {
    return { error: "Type must be vehicle or plant" };
  }

  let current_hours: number | null = null;
  let next_service_hours: number | null = null;
  if (type === "plant") {
    const cur = parseHours(
      String(formData.get("current_hours") ?? "").trim(),
      "Current hours",
    );
    if ("error" in cur) return { error: cur.error };
    current_hours = cur.value;

    const nxt = parseHours(
      String(formData.get("next_service_hours") ?? "").trim(),
      "Next service hours",
    );
    if ("error" in nxt) return { error: nxt.error };
    next_service_hours = nxt.value;
  }

  let rego_due: string | null = null;
  let rego: string | null = null;
  if (type === "vehicle") {
    const dueRaw = String(formData.get("rego_due") ?? "").trim();
    rego_due = dueRaw || null;
    const regoRaw = String(formData.get("rego") ?? "").trim();
    rego = regoRaw || null;
  }

  const { error } = await supabase.from("assets").insert({
    name,
    type,
    current_hours,
    next_service_hours,
    rego_due,
    rego,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "An asset with this name and type already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/servicing");
}

export async function updateAsset(
  assetId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const type = String(formData.get("type") ?? "").trim();
  if (!VALID_TYPES.includes(type)) {
    return { error: "Type must be vehicle or plant" };
  }

  let current_hours: number | null = null;
  let next_service_hours: number | null = null;
  if (type === "plant") {
    const cur = parseHours(
      String(formData.get("current_hours") ?? "").trim(),
      "Current hours",
    );
    if ("error" in cur) return { error: cur.error };
    current_hours = cur.value;

    const nxt = parseHours(
      String(formData.get("next_service_hours") ?? "").trim(),
      "Next service hours",
    );
    if ("error" in nxt) return { error: nxt.error };
    next_service_hours = nxt.value;
  }

  let rego_due: string | null = null;
  let rego: string | null = null;
  if (type === "vehicle") {
    const dueRaw = String(formData.get("rego_due") ?? "").trim();
    rego_due = dueRaw || null;
    const regoRaw = String(formData.get("rego") ?? "").trim();
    rego = regoRaw || null;
  }

  const { error } = await supabase
    .from("assets")
    .update({ name, type, current_hours, next_service_hours, rego_due, rego })
    .eq("id", assetId);

  if (error) {
    if (error.code === "23505") {
      return { error: "An asset with this name and type already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/servicing");
}

export async function deleteAsset(
  assetId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  // FK on servicing has on delete cascade, so service records are removed.
  const { error } = await supabase.from("assets").delete().eq("id", assetId);

  if (error) return { error: error.message };

  revalidatePath("/servicing");
}
