import Link from "next/link";
import { signOut } from "../actions";

export default function OfficeDashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Office Dashboard</h1>
      <Link href="/jobs" className="underline">
        Jobs
      </Link>
      <form action={signOut}>
        <button type="submit" className="rounded border px-3 py-1">
          Sign out
        </button>
      </form>
    </main>
  );
}
