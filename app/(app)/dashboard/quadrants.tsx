import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/format/relative-time";
import { formatCurrency } from "@/lib/format/currency";

function Quadrant({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link href={href} className="text-xs underline">
          View all
        </Link>
      </div>
      <div className="mt-3 flex-1">{children}</div>
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-neutral-500">{message}</p>;
}

export async function RecentJobsQuadrant() {
  const supabase = createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, name, client, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const rows = data ?? [];

  return (
    <Quadrant title="Recent jobs" href="/jobs">
      {rows.length === 0 ? (
        <Empty message="No jobs yet." />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {rows.map((j) => (
            <li key={j.id}>
              <Link
                href={`/jobs/${j.id}`}
                className="flex items-baseline justify-between gap-3 py-2 hover:bg-neutral-50"
              >
                <span className="min-w-0">
                  <p className="truncate text-sm font-medium">{j.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {[j.client, j.status].filter(Boolean).join(" · ") || "—"}
                  </p>
                </span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {relativeTime(j.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Quadrant>
  );
}

type DocumentRow = {
  id: string;
  file_name: string | null;
  doc_type: string | null;
  job_id: string;
  created_at: string;
  jobs: { name: string } | null;
};

export async function RecentDocumentsQuadrant() {
  const supabase = createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, file_name, doc_type, job_id, created_at, jobs(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const rows = (data ?? []) as unknown as DocumentRow[];

  return (
    <Quadrant title="Recent documents" href="/documents">
      {rows.length === 0 ? (
        <Empty message="No documents uploaded yet." />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {rows.map((d) => (
            <li key={d.id}>
              <Link
                href={`/jobs/${d.job_id}`}
                className="flex items-baseline justify-between gap-3 py-2 hover:bg-neutral-50"
              >
                <span className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {d.file_name ?? "(unnamed)"}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {[d.doc_type, d.jobs?.name].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {relativeTime(d.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Quadrant>
  );
}

type NoteRow = {
  id: string;
  body: string;
  job_id: string;
  created_at: string;
  jobs: { name: string } | null;
};

export async function RecentNotesQuadrant() {
  const supabase = createClient();
  const { data } = await supabase
    .from("job_notes")
    .select("id, body, job_id, created_at, jobs(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const rows = (data ?? []) as unknown as NoteRow[];

  return (
    <Quadrant title="Recent job notes" href="/notes">
      {rows.length === 0 ? (
        <Empty message="No notes yet." />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {rows.map((n) => (
            <li key={n.id}>
              <Link
                href={`/jobs/${n.job_id}`}
                className="flex items-baseline justify-between gap-3 py-2 hover:bg-neutral-50"
              >
                <span className="min-w-0">
                  <p className="truncate text-sm">{n.body}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {n.jobs?.name ?? "—"}
                  </p>
                </span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {relativeTime(n.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Quadrant>
  );
}

type ChangeRow = {
  key: string;
  kind: "VAR" | "DEF";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  href: string;
};

type VariationRow = {
  id: string;
  type: string;
  value: number;
  variation_date: string;
  job_id: string;
  jobs: { name: string } | null;
};

type DefectRow = {
  id: string;
  description: string;
  cost: number;
  defect_date: string;
  job_id: string;
  jobs: { name: string } | null;
};

export async function RecentChangesQuadrant() {
  const supabase = createClient();
  const [varsRes, defsRes] = await Promise.all([
    supabase
      .from("job_variations")
      .select("id, type, value, variation_date, job_id, jobs(name)")
      .order("variation_date", { ascending: false })
      .limit(5),
    supabase
      .from("job_defects")
      .select("id, description, cost, defect_date, job_id, jobs(name)")
      .order("defect_date", { ascending: false })
      .limit(5),
  ]);

  const variations = (varsRes.data ?? []) as unknown as VariationRow[];
  const defects = (defsRes.data ?? []) as unknown as DefectRow[];

  const items: ChangeRow[] = [
    ...variations.map((v) => ({
      key: `var-${v.id}`,
      kind: "VAR" as const,
      title: v.type,
      subtitle: v.jobs?.name ?? "—",
      amount: Number(v.value),
      date: v.variation_date,
      href: `/jobs/${v.job_id}`,
    })),
    ...defects.map((d) => ({
      key: `def-${d.id}`,
      kind: "DEF" as const,
      title: d.description,
      subtitle: d.jobs?.name ?? "—",
      amount: Number(d.cost),
      date: d.defect_date,
      href: `/jobs/${d.job_id}`,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <Quadrant title="Recent variations & defects" href="/jobs">
      {items.length === 0 ? (
        <Empty message="No variations or defects yet." />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {items.map((it) => (
            <li key={it.key}>
              <Link
                href={it.href}
                className="flex items-baseline justify-between gap-3 py-2 hover:bg-neutral-50"
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                      it.kind === "VAR"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {it.kind}
                  </span>
                  <span className="min-w-0">
                    <p className="truncate text-sm font-medium">{it.title}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {it.subtitle}
                    </p>
                  </span>
                </span>
                <span className="shrink-0 text-xs text-neutral-700">
                  {formatCurrency(it.amount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Quadrant>
  );
}
