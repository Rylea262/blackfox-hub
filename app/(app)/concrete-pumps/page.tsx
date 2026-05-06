import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import AddPumpButton from "./add-pump-button";
import EditPumpButton from "./edit-pump-button";
import DeletePumpButton from "./delete-pump-button";
import PumpDocs, { type PumpDoc } from "./pump-docs";
import CompanyContactCard, {
  type PumpCompanyContact,
} from "./company-contact-card";
import PumpCompanyDocs, {
  type PumpCompanyDoc,
} from "./pump-company-docs";

type Pump = {
  id: string;
  company: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  registration: string | null;
  capacity: string | null;
  notes: string | null;
  created_at: string;
};

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

export default async function ConcretePumpsPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const [pumpRes, docRes, companyRes, companyDocRes] = await Promise.all([
    supabase
      .from("concrete_pumps")
      .select(
        "id, company, name, model, serial_number, registration, capacity, notes, created_at",
      )
      .order("company", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("concrete_pump_documents")
      .select("id, pump_id, file_name, file_url, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("pump_companies")
      .select(
        "name, contact_name, contact_phone, contact_email, notes, account_number, credit_limit, payment_terms",
      ),
    supabase
      .from("pump_company_documents")
      .select("id, company_name, file_name, file_url, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const companyContacts = new Map<string, PumpCompanyContact>();
  for (const c of (companyRes.data ?? []) as PumpCompanyContact[]) {
    companyContacts.set(c.name, c);
  }

  const companyDocs = new Map<string, PumpCompanyDoc[]>();
  for (const d of (companyDocRes.data ?? []) as (PumpCompanyDoc & {
    company_name: string;
  })[]) {
    const arr = companyDocs.get(d.company_name);
    const doc = {
      id: d.id,
      file_name: d.file_name,
      file_url: d.file_url,
      created_at: d.created_at,
    };
    if (arr) arr.push(doc);
    else companyDocs.set(d.company_name, [doc]);
  }

  const pumps = (pumpRes.data ?? []) as Pump[];

  const docsByPump = new Map<string, PumpDoc[]>();
  for (const d of (docRes.data ?? []) as (PumpDoc & {
    pump_id: string;
  })[]) {
    const arr = docsByPump.get(d.pump_id);
    const doc = {
      id: d.id,
      file_name: d.file_name,
      file_url: d.file_url,
      created_at: d.created_at,
    };
    if (arr) arr.push(doc);
    else docsByPump.set(d.pump_id, [doc]);
  }

  const grouped = new Map<string, Pump[]>();
  for (const p of pumps) {
    const key = p.company;
    const arr = grouped.get(key);
    if (arr) arr.push(p);
    else grouped.set(key, [p]);
  }
  const companyKeys = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Concrete Pumps</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Pump fleet grouped by operating company.
          </p>
        </div>
        <AddPumpButton knownCompanies={companyKeys} />
      </div>

      {pumpRes.error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {pumpRes.error.message}
        </p>
      )}

      {!pumpRes.error && pumps.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No pumps yet. Add the first one.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {companyKeys.map((company) => {
          const items = grouped.get(company)!;
          return (
            <details
              key={company}
              className="rounded border border-neutral-200 bg-white"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3">
                <span className="font-semibold">{company}</span>
                <span className="text-xs text-neutral-500">
                  {items.length} {items.length === 1 ? "pump" : "pumps"}
                </span>
              </summary>
              <div className="border-t border-neutral-200 bg-neutral-50/40 p-3">
                <CompanyContactCard
                  company={company}
                  contact={companyContacts.get(company) ?? null}
                />
                <PumpCompanyDocs
                  companyName={company}
                  docs={companyDocs.get(company) ?? []}
                />
                <div className="flex flex-col gap-2">
                  {items.map((p) => {
                    const docs = docsByPump.get(p.id) ?? [];
                    return (
                      <details
                        key={p.id}
                        className="rounded border border-neutral-200 bg-white"
                      >
                        <summary className="flex cursor-pointer select-none flex-wrap items-center gap-3 px-3 py-2">
                          <span className="font-medium">{p.name}</span>
                          {p.capacity && (
                            <span className="text-xs text-neutral-500">
                              ID {p.capacity}
                            </span>
                          )}
                          {p.registration && (
                            <span className="text-xs text-neutral-500">
                              Rego {p.registration}
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-2">
                            <EditPumpButton
                              pump={{
                                id: p.id,
                                company: p.company,
                                name: p.name,
                                model: p.model,
                                serial_number: p.serial_number,
                                registration: p.registration,
                                capacity: p.capacity,
                                notes: p.notes,
                              }}
                              knownCompanies={companyKeys}
                            />
                            <DeletePumpButton
                              pumpId={p.id}
                              pumpName={p.name}
                              docCount={docs.length}
                            />
                          </span>
                        </summary>
                        <div className="border-t border-neutral-200 p-4">
                          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                            <div className="flex gap-2">
                              <dt className="w-32 shrink-0 text-neutral-500">
                                Model
                              </dt>
                              <dd className="min-w-0 truncate">
                                {nonEmpty(p.model)}
                              </dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-32 shrink-0 text-neutral-500">
                                Serial number
                              </dt>
                              <dd className="min-w-0 truncate">
                                {nonEmpty(p.serial_number)}
                              </dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-32 shrink-0 text-neutral-500">
                                Registration
                              </dt>
                              <dd className="min-w-0 truncate">
                                {nonEmpty(p.registration)}
                              </dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-32 shrink-0 text-neutral-500">
                                ID
                              </dt>
                              <dd className="min-w-0 truncate">
                                {nonEmpty(p.capacity)}
                              </dd>
                            </div>
                          </dl>

                          {p.notes && p.notes.trim() !== "" && (
                            <p className="mt-3 whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-700">
                              {p.notes}
                            </p>
                          )}

                          <PumpDocs pumpId={p.id} docs={docs} />
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
