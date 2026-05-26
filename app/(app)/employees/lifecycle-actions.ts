"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

async function setIsPrevious(
  userId: string,
  value: boolean,
): Promise<{ error?: string } | void> {
  const { user: currentUser } = await requireRole(["owner", "office"]);
  if (userId === currentUser.id) {
    return { error: "You can't change your own employee status." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ is_previous: value })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/employees");
}

export async function markEmployeeAsPrevious(userId: string) {
  return setIsPrevious(userId, true);
}

export async function restoreEmployee(userId: string) {
  return setIsPrevious(userId, false);
}

export async function deleteEmployeePermanently(
  userId: string,
): Promise<{ error?: string } | void> {
  const { user: currentUser } = await requireRole(["owner", "office"]);
  if (userId === currentUser.id) {
    return { error: "You can't delete your own employee record." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "This employee is still linked to jobs, certificates, notes, or other records. Move them to Previous instead, or remove those links first.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/employees");
}
