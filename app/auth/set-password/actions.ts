"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROLE_TO_SLUG: Record<string, string> = {
  owner: "owner",
  office: "office",
  leading_hand: "leading-hand",
};

function back(error: string): never {
  redirect(`/auth/set-password?error=${encodeURIComponent(error)}`);
}

export async function setPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) back("Password must be at least 8 characters");
  if (password !== confirm) back("Passwords do not match");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) back("Session expired — click the email link again");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) back(error.message);

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const slug = ROLE_TO_SLUG[profile?.role ?? "leading_hand"] ?? "leading-hand";
  revalidatePath("/", "layout");
  redirect(`/dashboard/${slug}`);
}
