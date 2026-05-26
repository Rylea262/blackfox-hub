"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestReset(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect(
      `/auth/forgot-password?error=${encodeURIComponent("Email is required")}`,
    );
  }

  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const redirectTo = siteUrl ? `${siteUrl}/auth/callback` : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );

  // Don't reveal whether the email exists. Log the error server-side.
  if (error) {
    console.error("resetPasswordForEmail error:", error.message);
  }

  redirect("/auth/forgot-password?sent=1");
}
