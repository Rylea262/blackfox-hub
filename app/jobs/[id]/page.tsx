import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import UploadForm from "./upload-form";
import DocumentList from "./document-list";
import DeleteJobButton from "./delete-job-button";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, name, address, client, status, start_date, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!job) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, file_name, doc_type, file_url, created_at")
    .eq("job_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/jobs" className="text-sm underline">
        ← Back to jobs
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold">{job.name}</h1>
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
        </dl>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Documents</h2>
        <DocumentList documents={documents ?? []} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upload</h2>
        <UploadForm jobId={job.id} userId={user.id} />
      </section>

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
