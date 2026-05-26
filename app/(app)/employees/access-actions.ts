"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

const ROLES = ["owner", "office", "leading_hand"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export async function inviteEmployeeLogin(
  userId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner"]);

  const supabase = createClient();
  const { data: profile, error: lookupError } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (lookupError) return { error: lookupError.message };
  if (!profile?.email) return { error: "Employee has no email on file" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const redirectTo = siteUrl ? `${siteUrl}/login` : undefined;

  const admin = createAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    profile.email,
    redirectTo ? { redirectTo } : undefined,
  );

  if (inviteError) {
    if (/already.*registered|already.*exists/i.test(inviteError.message)) {
      return {
        error:
          "This email already has a login. Ask them to use \"Forgot password\" on the sign-in page.",
      };
    }
    return { error: inviteError.message };
  }

  revalidatePath("/employees");
}

export async function setUserRole(
  userId: string,
  role: string,
): Promise<{ error?: string } | void> {
  const { user: currentUser } = await requireRole(["owner"]);
  if (!isRole(role)) return { error: "Invalid role" };
  if (userId === currentUser.id) {
    return {
      error:
        "Use a different owner account to change your own role (safety guard).",
    };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/employees");
}
