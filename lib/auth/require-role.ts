import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireRole(allowed: readonly string[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = data?.role;
  if (!role || !allowed.includes(role)) {
    redirect("/login");
  }

  return { user, role };
}
