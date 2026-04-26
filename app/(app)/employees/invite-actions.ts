"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

const VALID_ROLES = ["owner", "office", "leading_hand"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteEmployee(
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "leading_hand");

  if (!email) return { error: "Email is required" };
  if (!EMAIL_RE.test(email)) return { error: "Email looks invalid" };
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: "Invalid role" };
  }

  const admin = createAdminClient();

  const { data, error: inviteErr } =
    await admin.auth.admin.inviteUserByEmail(email);

  if (inviteErr) {
    return { error: inviteErr.message };
  }
  if (!data?.user) {
    return { error: "Invite did not return a user" };
  }

  // The handle_new_user trigger has already created a public.users row
  // with role = leading_hand. Patch it with the name and chosen role.
  const updates: Record<string, string> = { role };
  if (name) updates.name = name;

  const { error: updateErr } = await admin
    .from("users")
    .update(updates)
    .eq("id", data.user.id);

  if (updateErr) {
    return {
      error: `Invite sent, but failed to set details: ${updateErr.message}`,
    };
  }

  revalidatePath("/employees");
}
