import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatCurrency } from "@/lib/format/currency";
import AddSupplierButton from "./add-supplier-button";
import EditSupplierButton from "./edit-supplier-button";
import DeleteSupplierButton from "./delete-supplier-button";
import SupplierDocs, { type SupplierDoc } from "./supplier-docs";

type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  account_number: string | null;
  credit_limit: number | string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
};

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

export default async function SuppliersPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const [supRes, docRes] = await Promise.all([
    supabase
      .from("suppliers")
      .select(
        "id, name, contact_name, contact_email, contact_phone, website, address, account_number, credit_limit, payment_terms, notes, created_at",
      )
      .order("name", { ascending: true }),
    supabase
      .from("supplier_documents")
      .select("id, supplier_id, file_name, file_url, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const suppliers = (supRes.data ?? []) as Supplier[];

  const docsBySupplier = new Map<string, SupplierDoc[]>();
  for (const d of (docRes.data ?? []) as (SupplierDoc & {
    supplier_id: string;
  })[]) {
    const arr = docsBySupplier.get(d.supplier_id);
    const doc = {
      id: d.id,
      file_name: d.file_name,
      file_url: d.file_url,
      created_at: d.created_at,
    };
    if (arr) arr.push(doc);
    else docsBySupplier.set(d.supplier_id, [doc]);
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Trading-account suppliers with credit limits and paperwork.
          </p>
        </div>
        <AddSupplierButton />
      </div>

      {supRes.error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {supRes.error.message}
        </p>
      )}

      {!supRes.error && suppliers.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No suppliers yet. Add the first one.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {suppliers.map((s) => {
          const docs = docsBySupplier.get(s.id) ?? [];
          return (
            <details
              key={s.id}
              className="rounded border border-neutral-200 bg-white"
            >
              <summary className="flex cursor-pointer select-none flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-semibold">{s.name}</span>
                {s.payment_terms && (
                  <span className="text-xs text-neutral-500">
                    {s.payment_terms}
                  </span>
                )}
                {s.credit_limit != null && s.credit_limit !== "" && (
                  <span className="text-xs tabular-nums text-neutral-500">
                    Limit {formatCurrency(s.credit_limit)}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2">
                  <EditSupplierButton
                    supplier={{
                      id: s.id,
                      name: s.name,
                      contact_name: s.contact_name,
                      contact_email: s.contact_email,
                      contact_phone: s.contact_phone,
                      website: s.website,
                      address: s.address,
                      account_number: s.account_number,
                      credit_limit: s.credit_limit,
                      payment_terms: s.payment_terms,
                      notes: s.notes,
                    }}
                  />
                  <DeleteSupplierButton
                    supplierId={s.id}
                    supplierName={s.name}
                    docCount={docs.length}
                  />
                </span>
              </summary>
              <div className="border-t border-neutral-200 p-4">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-neutral-500">Contact</dt>
                    <dd className="min-w-0 truncate">
                      {nonEmpty(s.contact_name)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-neutral-500">Phone</dt>
                    <dd className="min-w-0 truncate">
                      {nonEmpty(s.contact_phone)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-neutral-500">Email</dt>
                    <dd className="min-w-0 truncate">
                      {nonEmpty(s.contact_email)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-neutral-500">Website</dt>
                    <dd className="min-w-0 truncate">
                      {nonEmpty(s.website)}
                    </dd>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="w-32 shrink-0 text-neutral-500">Address</dt>
                    <dd className="min-w-0">{nonEmpty(s.address)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-neutral-500">Account</dt>
                    <dd className="min-w-0 truncate">
                      {nonEmpty(s.account_number)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-neutral-500">
                      Credit limit
                    </dt>
                    <dd className="tabular-nums">
                      {s.credit_limit != null && s.credit_limit !== ""
                        ? formatCurrency(s.credit_limit)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-neutral-500">Terms</dt>
                    <dd className="min-w-0">{nonEmpty(s.payment_terms)}</dd>
                  </div>
                </dl>

                {s.notes && s.notes.trim() !== "" && (
                  <p className="mt-3 whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-700">
                    {s.notes}
                  </p>
                )}

                <SupplierDocs supplierId={s.id} docs={docs} />
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
