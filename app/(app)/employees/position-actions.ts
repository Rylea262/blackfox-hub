"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { POSITIONS } from "@/lib/employees/constants";

const VALID_POSITIONS: string[] = POSITIONS.map((p) => p.value);

export async function updatePosition(
  userId: string,
  position: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);

  const value: string | null = position === "" ? null : position;
  if (value !== null && !VALID_POSITIONS.includes(value)) {
    return { error: "Invalid position" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ position: value })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/employees");
}
