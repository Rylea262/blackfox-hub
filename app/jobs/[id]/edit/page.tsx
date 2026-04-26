import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { JOB_STATUSES } from "@/lib/jobs/constants";
import { updateJob } from "./actions";

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, name, address, client, status, start_date, project_value")
    .eq("id", params.id)
    .maybeSingle();

  if (!job) notFound();

  return (
    <main className="mx-auto max-w-xl p-6">
      <Link href={`/jobs/${job.id}`} className="text-sm underline">
        ← Back to job
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Edit job</h1>

      {searchParams.error && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form
        action={updateJob.bind(null, job.id)}
        className="mt-4 flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          Name *
          <input
            name="name"
            required
            defaultValue={job.name ?? ""}
            className="rounded border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            name="address"
            defaultValue={job.address ?? ""}
            className="rounded border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Client
          <input
            name="client"
            defaultValue={job.client ?? ""}
            className="rounded border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Start date
          <input
            name="start_date"
            type="date"
            defaultValue={job.start_date ?? ""}
            className="rounded border p-2"
          />
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
            defaultValue={job.project_value ?? ""}
            className="rounded border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue={job.status ?? "active"}
            className="rounded border p-2"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800"
          >
            Save changes
          </button>
          <Link
            href={`/jobs/${job.id}`}
            className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
