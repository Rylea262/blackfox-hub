import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatDate } from "@/lib/format/date";
import AddSubcontractorButton from "./add-subcontractor-button";
import EditSubcontractorButton from "./edit-subcontractor-button";
import DeleteSubcontractorButton from "./delete-subcontractor-button";
import SubcontractorDocs, { type SubDoc } from "./subcontractor-docs";

type Sub = {
  id: string;
  type: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  abn: string | null;
  public_liability_expiry: string | null;
  workcover_expiry: string | null;
  notes: string | null;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  sole_trader: "Sole trader",
  company: "Company",
};

const TYPE_ORDER = ["sole_trader", "company"];

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

type ExpiryStatus = "expired" | "soon" | "ok" | "none";

function expiryStatus(iso: string | null): ExpiryStatus {
  if (!iso) return "none";
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  if (iso < today) return "expired";
  if (iso <= soon) return "soon";
  return "ok";
}

function expiryClass(status: ExpiryStatus): string {
  switch (status) {
    case "expired":
      return "text-red-700 font-medium";
    case "soon":
      return "text-orange-700 font-medium";
    case "ok":
      return "text-green-700";
    default:
      return "text-neutral-500";
  }
}

export default async function SubcontractorsPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const [subRes, docRes] = await Promise.all([
    supabase
      .from("subcontractors")
      .select(
        "id, type, name, contact_person, phone, email, address, abn, public_liability_expiry, workcover_expiry, notes, created_at",
      )
      .order("name", { ascending: true }),
    supabase
      .from("subcontractor_documents")
      .select("id, subcontractor_id, file_name, file_url, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const subs = (subRes.data ?? []) as Sub[];

  const docsBySub = new Map<string, SubDoc[]>();
  for (const d of (docRes.data ?? []) as (SubDoc & {
    subcontractor_id: string;
  })[]) {
    const arr = docsBySub.get(d.subcontractor_id);
    const doc = {
      id: d.id,
      file_name: d.file_name,
      file_url: d.file_url,
      created_at: d.created_at,
    };
    if (arr) arr.push(doc);
    else docsBySub.set(d.subcontractor_id, [doc]);
  }

  const grouped = new Map<string, Sub[]>();
  for (const s of subs) {
    const arr = grouped.get(s.type);
    if (arr) arr.push(s);
    else grouped.set(s.type, [s]);
  }
  const typeKeys = Array.from(grouped.keys()).sort(
    (a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b),
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subcontractors</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sole traders and companies engaged on jobs.
          </p>
        </div>
        <AddSubcontractorButton />
      </div>

      {subRes.error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {subRes.error.message}
        </p>
      )}

      {!subRes.error && subs.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No subcontractors yet. Add the first one.
        </p>
      )}

      {typeKeys.map((typeKey) => {
        const items = grouped.get(typeKey)!;
        return (
          <section key={typeKey} className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">
              {TYPE_LABELS[typeKey] ?? typeKey}
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({items.length})
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((s) => {
                const docs = docsBySub.get(s.id) ?? [];
                const plStatus = expiryStatus(s.public_liability_expiry);
                const wcStatus = expiryStatus(s.workcover_expiry);
                return (
                  <details
                    key={s.id}
                    className="rounded border border-neutral-200 bg-white"
                  >
                    <summary className="flex cursor-pointer select-none flex-wrap items-center gap-3 px-4 py-3">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-xs text-neutral-500">
                        {TYPE_LABELS[s.type] ?? s.type}
                      </span>
                      <span className="ml-auto flex items-center gap-2">
                        <EditSubcontractorButton
                          sub={{
                            id: s.id,
                            type: s.type,
                            name: s.name,
                            contact_person: s.contact_person,
                            phone: s.phone,
                            email: s.email,
                            address: s.address,
                            abn: s.abn,
                            public_liability_expiry: s.public_liability_expiry,
                            workcover_expiry: s.workcover_expiry,
                            notes: s.notes,
                          }}
                        />
                        <DeleteSubcontractorButton
                          subId={s.id}
                          subName={s.name}
                          docCount={docs.length}
                        />
                      </span>
                    </summary>
                    <div className="border-t border-neutral-200 p-4">
                      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        {s.type === "company" && (
                          <div className="flex gap-2">
                            <dt className="w-32 shrink-0 text-neutral-500">
                              Contact
                            </dt>
                            <dd className="min-w-0 truncate">
                              {nonEmpty(s.contact_person)}
                            </dd>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <dt className="w-32 shrink-0 text-neutral-500">
                            Phone
                          </dt>
                          <dd className="min-w-0 truncate">
                            {nonEmpty(s.phone)}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-32 shrink-0 text-neutral-500">
                            Email
                          </dt>
                          <dd className="min-w-0 truncate">
                            {nonEmpty(s.email)}
                          </dd>
                        </div>
                        <div className="flex gap-2 sm:col-span-2">
                          <dt className="w-32 shrink-0 text-neutral-500">
                            Address
                          </dt>
                          <dd className="min-w-0">{nonEmpty(s.address)}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-32 shrink-0 text-neutral-500">
                            ABN
                          </dt>
                          <dd className="min-w-0 truncate">
                            {nonEmpty(s.abn)}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-32 shrink-0 text-neutral-500">
                            Public liability
                          </dt>
                          <dd className={`min-w-0 ${expiryClass(plStatus)}`}>
                            {s.public_liability_expiry
                              ? formatDate(s.public_liability_expiry)
                              : "—"}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-32 shrink-0 text-neutral-500">
                            Workcover
                          </dt>
                          <dd className={`min-w-0 ${expiryClass(wcStatus)}`}>
                            {s.workcover_expiry
                              ? formatDate(s.workcover_expiry)
                              : "—"}
                          </dd>
                        </div>
                      </dl>

                      {s.notes && s.notes.trim() !== "" && (
                        <p className="mt-3 whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-700">
                          {s.notes}
                        </p>
                      )}

                      <SubcontractorDocs subId={s.id} docs={docs} />
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
