import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROLE_TO_SLUG: Record<string, string> = {
  owner: "owner",
  office: "office",
  leading_hand: "leading-hand",
};

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const slug = ROLE_TO_SLUG[profile?.role ?? "leading_hand"] ?? "leading-hand";
  redirect(`/dashboard/${slug}`);
}
