import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/format/relative-time";

type FeedItem = {
  kind: "job" | "document";
  id: string;
  timestamp: string;
  title: string;
  subtitle: string;
  href: string;
};

type DocumentRow = {
  id: string;
  file_name: string | null;
  doc_type: string | null;
  job_id: string;
  created_at: string;
  jobs: { name: string } | null;
};

export default async function ActivityFeed() {
  const supabase = createClient();

  const [jobsRes, docsRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, name, client, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("documents")
      .select("id, file_name, doc_type, job_id, created_at, jobs(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const jobs = jobsRes.data ?? [];
  const docs = (docsRes.data ?? []) as unknown as DocumentRow[];

  const items: FeedItem[] = [
    ...jobs.map((j) => ({
      kind: "job" as const,
      id: j.id,
      timestamp: j.created_at,
      title: `New job: ${j.name}`,
      subtitle: [j.client, j.status].filter(Boolean).join(" · "),
      href: `/jobs/${j.id}`,
    })),
    ...docs.map((d) => ({
      kind: "document" as const,
      id: d.id,
      timestamp: d.created_at,
      title: `Uploaded: ${d.file_name ?? "(unnamed)"}`,
      subtitle: [d.doc_type, d.jobs?.name].filter(Boolean).join(" · "),
      href: `/jobs/${d.job_id}`,
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 20);

  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Recent activity</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Latest 20 jobs and documents.
      </p>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 rounded border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-600">
          <p>No activity yet.</p>
          <Link href="/jobs/new" className="underline">
            Create a job to get started.
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
          {items.map((it) => (
            <li key={`${it.kind}-${it.id}`}>
              <Link
                href={it.href}
                className="flex items-center justify-between gap-4 px-2 py-3 hover:bg-neutral-50"
              >
                <div className="flex min-w-0 items-baseline gap-3">
                  <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral-600">
                    {it.kind === "job" ? "JOB" : "DOC"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{it.title}</p>
                    {it.subtitle && (
                      <p className="truncate text-xs text-neutral-500">
                        {it.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-neutral-500">
                  {relativeTime(it.timestamp)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
