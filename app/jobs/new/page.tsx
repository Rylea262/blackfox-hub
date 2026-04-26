import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { JOB_STATUSES } from "@/lib/jobs/constants";
import { createJob } from "./actions";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireRole(["owner", "office"]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <Link href="/jobs" className="text-sm underline">
        ← Back to jobs
      </Link>
      <h1 className="mt-4 text-2xl font-bold">New Job</h1>

      {searchParams.error && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form action={createJob} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Name *
          <input name="name" required className="rounded border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input name="address" className="rounded border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Client
          <input name="client" className="rounded border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Start date
          <input name="start_date" type="date" className="rounded border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Project value (AUD)
          <input
            name="project_value"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="e.g. 1500000"
            className="rounded border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue="active"
            className="rounded border p-2"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-black p-2 text-white hover:bg-neutral-800"
        >
          Create Job
        </button>
      </form>
    </main>
  );
}
