import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import TabNav from "./tab-nav";

const ROLE_TO_SLUG: Record<string, string> = {
  owner: "owner",
  office: "office",
  leading_hand: "leading-hand",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const role = profile?.role ?? "leading_hand";
  const dashboardHref = `/dashboard/${ROLE_TO_SLUG[role] ?? "leading-hand"}`;
  const isAdmin = role === "owner" || role === "office";

  return (
    <div className="min-h-screen bg-sky-50">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-200 bg-white/70 px-6 py-3 backdrop-blur">
        <Link href={dashboardHref} className="font-bold">
          BLACK FOX HUB
        </Link>
        <TabNav
          dashboardHref={dashboardHref}
          showNotes={isAdmin}
          showJobs={isAdmin}
          showEmployees={isAdmin}
          showInsurances={isAdmin}
          showServicing={isAdmin}
          showTools={isAdmin}
          showAssets={isAdmin}
          showSuppliers={isAdmin}
          showSubcontractors={isAdmin}
          showConcretePumps={isAdmin}
          showDocuments={isAdmin}
        />
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-neutral-600 sm:inline">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <div>{children}</div>
    </div>
  );
}
