"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

const VALID_ROLES = ["owner", "office", "leading_hand"] as const;

export async function updateRole(
  userId: string,
  role: string,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);

  if (userId === user.id) {
    return { error: "You can't change your own role" };
  }
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: "Invalid role" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/employees");
}
