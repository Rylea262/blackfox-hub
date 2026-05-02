import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatCurrency } from "@/lib/format/currency";
import UploadForm from "./upload-form";
import DocumentList from "./document-list";
import DeleteJobButton from "./delete-job-button";
import NotesSection, { type NoteRow } from "./notes-section";
import VariationsSection, {
  type VariationRow,
} from "./variations-section";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, name, address, client, status, start_date, project_value, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!job) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, file_name, doc_type, file_url, created_at")
    .eq("job_id", params.id)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("job_notes")
    .select("id, body, created_at, users(name, email)")
    .eq("job_id", params.id)
    .order("created_at", { ascending: false });

  const { data: variations } = await supabase
    .from("job_variations")
    .select("id, type, variation_date, value, created_at")
    .eq("job_id", params.id)
    .order("variation_date", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/jobs" className="text-sm underline">
        ← Back to jobs
      </Link>

      <header className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{job.name}</h1>
          <Link
            href={`/jobs/${job.id}/edit`}
            className="rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50"
          >
            Edit
          </Link>
        </div>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-neutral-500">Client</dt>
          <dd>{job.client ?? "—"}</dd>
          <dt className="text-neutral-500">Address</dt>
          <dd>{job.address ?? "—"}</dd>
          <dt className="text-neutral-500">Status</dt>
          <dd>{job.status}</dd>
          <dt className="text-neutral-500">Start date</dt>
          <dd>
            {job.start_date
              ? new Date(job.start_date).toLocaleDateString()
              : "—"}
          </dd>
          <dt className="text-neutral-500">Value</dt>
          <dd>{formatCurrency(job.project_value)}</dd>
        </dl>
      </header>

      <details open className="mt-8">
        <summary className="cursor-pointer select-none text-lg font-semibold">
          Notes{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({notes?.length ?? 0})
          </span>
        </summary>
        <div className="mt-2">
          <NotesSection
            jobId={job.id}
            notes={(notes ?? []) as unknown as NoteRow[]}
          />
        </div>
      </details>

      <details className="mt-8">
        <summary className="cursor-pointer select-none text-lg font-semibold">
          Variations{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({variations?.length ?? 0})
          </span>
        </summary>
        <div className="mt-2">
          <VariationsSection
            jobId={job.id}
            variations={(variations ?? []) as VariationRow[]}
          />
        </div>
      </details>

      <details className="mt-8">
        <summary className="cursor-pointer select-none text-lg font-semibold">
          Documents{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({documents?.length ?? 0})
          </span>
        </summary>
        <div className="mt-2">
          <DocumentList documents={documents ?? []} jobId={job.id} />
        </div>
      </details>

      <details className="mt-8">
        <summary className="cursor-pointer select-none text-lg font-semibold">
          Upload
        </summary>
        <div className="mt-2">
          <UploadForm jobId={job.id} userId={user.id} />
        </div>
      </details>

      <section className="mt-12 border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold text-red-700">Danger zone</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Deleting this job will also remove all attached documents and their
          files. This cannot be undone.
        </p>
        <div className="mt-3">
          <DeleteJobButton jobId={job.id} />
        </div>
      </section>
    </main>
  );
}
