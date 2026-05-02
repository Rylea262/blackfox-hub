import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { JOB_STATUSES } from "@/lib/jobs/constants";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  ...JOB_STATUSES,
];

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const status = searchParams.status ?? "active";

  let query = supabase
    .from("jobs")
    .select("id, name, client, status, project_value, created_at")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: jobs, error } = await query;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link
          href="/jobs/new"
          className="rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          + New Job
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutral-600">Status:</span>
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s.value}
            href={`/jobs?status=${s.value}`}
            className={`rounded px-2 py-0.5 text-sm ${
              status === s.value
                ? "bg-black text-white"
                : "border border-neutral-300"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && (!jobs || jobs.length === 0) && (
        <p className="rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No jobs yet. Create your first one.
        </p>
      )}

      {jobs && jobs.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th className="py-2">Client</th>
              <th className="py-2">Status</th>
              <th className="py-2 pl-8 pr-8 text-right">Value</th>
              <th className="py-2 pr-8">Created</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b">
                <td className="py-2">{j.name}</td>
                <td className="py-2">{j.client ?? "—"}</td>
                <td className="py-2">{j.status}</td>
                <td className="py-2 pl-8 pr-8 text-right tabular-nums">
                  {formatCurrency(j.project_value)}
                </td>
                <td className="py-2 pr-8">{formatDate(j.created_at)}</td>
                <td className="py-2 text-right">
                  <Link href={`/jobs/${j.id}`} className="underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
