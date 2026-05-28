"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminAvailable } from "@/lib/supabase/admin";
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
  const { error } = await supabase.rpc("delete_employee_permanently", {
    target_user_id: userId,
  });

  if (error) return { error: error.message };

  // Also remove their auth.users row so the login is fully gone.
  // Best-effort — if it fails the public.users delete already succeeded.
  if (isAdminAvailable()) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.error("Failed to delete auth.users entry:", e);
    }
  }

  revalidatePath("/employees");
}
