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
        <div className="overflow-hidden rounded border border-neutral-200">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 border-b bg-neutral-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <div>Name</div>
            <div>Client</div>
            <div>Status</div>
            <div className="text-right">Value</div>
            <div>Created</div>
          </div>
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 border-b border-neutral-200 px-3 py-2 text-sm last:border-b-0 hover:bg-neutral-50"
            >
              <span className="truncate">{j.name}</span>
              <span className="truncate">{j.client ?? "—"}</span>
              <span className="truncate">{j.status}</span>
              <span className="text-right tabular-nums">
                {formatCurrency(j.project_value)}
              </span>
              <span className="truncate">{formatDate(j.created_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
