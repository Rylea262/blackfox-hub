import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import DocumentsList, { type CompanyDoc } from "./documents-list";

export default async function DocumentsPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("company_documents")
    .select("id, file_name, file_url, description, created_at")
    .order("created_at", { ascending: false });

  const docs = (data ?? []) as CompanyDoc[];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-1 text-sm text-neutral-500">
          General company files — policies, certificates, templates, etc.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <div className="mt-4">
        <DocumentsList docs={docs} />
      </div>
    </main>
  );
}
