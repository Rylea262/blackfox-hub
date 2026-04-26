"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { ASSET_TYPES } from "@/lib/servicing/constants";

const VALID_TYPES: string[] = ASSET_TYPES.map((a) => a.value);

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

  const { error } = await supabase
    .from("assets")
    .insert({ name, type, created_by: user.id });

  if (error) {
    if (error.code === "23505") {
      return { error: "An asset with this name and type already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/servicing");
}
