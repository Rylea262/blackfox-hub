import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPassword } from "./actions";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <form
        action={setPassword}
        className="flex w-full max-w-sm flex-col gap-3 rounded border p-6"
      >
        <h1 className="text-2xl font-bold">Set your password</h1>
        <p className="text-sm text-neutral-500">
          Signed in as <span className="font-medium">{user.email}</span>. Choose
          a password to finish setting up your account.
        </p>
        {searchParams.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          New password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirm password
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border p-2"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-black p-2 text-white hover:bg-neutral-800"
        >
          Save password
        </button>
      </form>
    </main>
  );
}
