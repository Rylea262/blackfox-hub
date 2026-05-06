import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import AddEmployeeButton from "./add-employee-button";
import EditEmployeeButton from "./edit-employee-button";
import EmployeeCerts, { type EmployeeCert } from "./employee-certs";
import EmployeeContractButton from "./employee-contract-button";

type Employee = {
  id: string;
  name: string | null;
  email: string;
  position: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  start_date: string | null;
  date_of_birth: string | null;
  notes: string | null;
  address: string | null;
  licence_number: string | null;
  white_card_number: string | null;
  licence_expiry: string | null;
  employment_type: string | null;
  abn_number: string | null;
  tfn_number: string | null;
  pay_type: string | null;
  pay_amount: number | string | null;
  qleave_number: string | null;
  shirt_size: string | null;
  shorts_size: string | null;
  jacket_size: string | null;
  company: string | null;
  contract_url: string | null;
  created_at: string;
};

const COMPANY_ORDER = [
  "black_fox_industries",
  "black_fox_concrete_pumping",
  "black_fox_barbers",
] as const;

const COMPANY_LABELS: Record<string, string> = {
  black_fox_industries: "Black Fox Industries",
  black_fox_concrete_pumping: "Black Fox Concrete Pumping",
  black_fox_barbers: "Black Fox Barbers",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full time",
  casual: "Casual",
  abn: "ABN",
};

function formatPay(
  payType: string | null,
  payAmount: number | string | null,
): string {
  if (!payType || payAmount == null || payAmount === "") return "—";
  const formatted = formatCurrency(payAmount);
  return payType === "hourly" ? `${formatted}/hr` : `${formatted}/yr`;
}

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

type RecordStatus = "ok" | "soon" | "expired";

const SOON_DAYS = 30;

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoSoon(): string {
  return new Date(Date.now() + SOON_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);
}

function isFilled(value: string | number | null | undefined): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return Number.isFinite(value as number);
}

// The director is exempt from the employment-contract field — they
// don't have one with themselves.
const NO_CONTRACT_EMAIL = "info@blackfoxindustries.com.au";

function requiresContract(email: string): boolean {
  return email.toLowerCase() !== NO_CONTRACT_EMAIL;
}

function expiryStatus(iso: string | null): RecordStatus {
  if (!iso) return "ok";
  const today = isoToday();
  if (iso < today) return "expired";
  if (iso <= isoSoon()) return "soon";
  return "ok";
}

function recordStatus(u: Employee): RecordStatus {
  // Required for "green": basic identity, contact, employment, and a
  // contract on file.
  const requiredFilled =
    isFilled(u.name) &&
    isFilled(u.position) &&
    isFilled(u.phone) &&
    isFilled(u.address) &&
    isFilled(u.date_of_birth) &&
    isFilled(u.start_date) &&
    isFilled(u.emergency_contact_name) &&
    isFilled(u.emergency_contact_phone) &&
    isFilled(u.licence_number) &&
    isFilled(u.licence_expiry) &&
    isFilled(u.white_card_number) &&
    isFilled(u.pay_type) &&
    isFilled(u.pay_amount) &&
    isFilled(u.employment_type) &&
    (u.employment_type === "abn"
      ? isFilled(u.abn_number)
      : isFilled(u.tfn_number)) &&
    (!requiresContract(u.email) || isFilled(u.contract_url));

  const expiries = [expiryStatus(u.licence_expiry)];
  if (expiries.includes("expired")) return "expired";
  if (expiries.includes("soon")) return "soon";
  if (!requiredFilled) return "soon";
  return "ok";
}

function statusClass(status: RecordStatus): string {
  switch (status) {
    case "expired":
      return "border-red-300 bg-red-50";
    case "soon":
      return "border-orange-300 bg-orange-50";
    default:
      return "border-green-300 bg-green-50";
  }
}

export default async function EmployeesPage() {
  const { user: currentUser } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const [usersRes, certsRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, name, email, position, phone, emergency_contact_name, emergency_contact_phone, start_date, date_of_birth, notes, address, licence_number, white_card_number, licence_expiry, employment_type, abn_number, tfn_number, pay_type, pay_amount, qleave_number, shirt_size, shorts_size, jacket_size, company, contract_url, created_at",
      )
      .order("name", { ascending: true, nullsFirst: false }),
    supabase
      .from("employee_certificates")
      .select("id, user_id, file_name, file_url, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const { data: users, error } = usersRes;
  const employees = (users ?? []) as Employee[];

  const certsByUser = new Map<string, EmployeeCert[]>();
  for (const c of (certsRes.data ?? []) as (EmployeeCert & {
    user_id: string;
  })[]) {
    const arr = certsByUser.get(c.user_id);
    const cert = {
      id: c.id,
      file_name: c.file_name,
      file_url: c.file_url,
      created_at: c.created_at,
    };
    if (arr) arr.push(cert);
    else certsByUser.set(c.user_id, [cert]);
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Company employee register. Edit a record to update contact details.
          </p>
        </div>
        <AddEmployeeButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && employees.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No employees yet. Add the first one.
        </p>
      )}

      {(() => {
        const groups = new Map<string, Employee[]>();
        for (const u of employees) {
          const key = u.company ?? "unassigned";
          const arr = groups.get(key);
          if (arr) arr.push(u);
          else groups.set(key, [u]);
        }
        const orderedKeys: string[] = [
          ...COMPANY_ORDER.filter((k) => groups.has(k)),
        ];
        if (groups.has("unassigned")) orderedKeys.push("unassigned");
        return orderedKeys.map((companyKey) => {
          const list = groups.get(companyKey)!;
          const heading =
            companyKey === "unassigned"
              ? "Unassigned"
              : COMPANY_LABELS[companyKey] ?? companyKey;
          return (
            <details
              key={companyKey}
              open
              className="mt-4 rounded border border-neutral-200 bg-white"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3">
                <span className="text-base font-semibold">{heading}</span>
                <span className="text-xs text-neutral-500">
                  {list.length}{" "}
                  {list.length === 1 ? "employee" : "employees"}
                </span>
              </summary>
              <div className="border-t border-neutral-200 bg-neutral-50/40 p-3">
                <div className="flex flex-col gap-3">
                  {list.map((u) => {
                    const isSelf = u.id === currentUser.id;
          return (
            <details
              key={u.id}
              className={`rounded border ${statusClass(recordStatus(u))}`}
            >
              <summary className="flex cursor-pointer select-none flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-semibold">
                  {u.name?.trim() || u.email}
                </span>
                {isSelf && (
                  <span className="text-xs text-neutral-500">(you)</span>
                )}
                <span className="text-xs text-neutral-500">
                  {nonEmpty(u.position)}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {requiresContract(u.email) && (
                    <EmployeeContractButton
                      userId={u.id}
                      contractUrl={u.contract_url}
                    />
                  )}
                  <EditEmployeeButton
                    employee={{
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      position: u.position,
                      phone: u.phone,
                      emergency_contact_name: u.emergency_contact_name,
                      emergency_contact_phone: u.emergency_contact_phone,
                      start_date: u.start_date,
                      date_of_birth: u.date_of_birth,
                      notes: u.notes,
                      address: u.address,
                      licence_number: u.licence_number,
                      white_card_number: u.white_card_number,
                      licence_expiry: u.licence_expiry,
                      employment_type: u.employment_type,
                      abn_number: u.abn_number,
                      tfn_number: u.tfn_number,
                      pay_type: u.pay_type,
                      pay_amount: u.pay_amount,
                      qleave_number: u.qleave_number,
                      shirt_size: u.shirt_size,
                      shorts_size: u.shorts_size,
                      jacket_size: u.jacket_size,
                      company: u.company,
                    }}
                  />
                </span>
              </summary>
              <div className="border-t border-neutral-200 p-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Email</dt>
                  <dd className="min-w-0 truncate">{u.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Phone</dt>
                  <dd className="min-w-0 truncate">{nonEmpty(u.phone)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Emergency</dt>
                  <dd className="min-w-0">
                    {u.emergency_contact_name || u.emergency_contact_phone ? (
                      <>
                        {u.emergency_contact_name ?? "—"}
                        {u.emergency_contact_phone && (
                          <>
                            <span className="text-neutral-400"> · </span>
                            {u.emergency_contact_phone}
                          </>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Start date</dt>
                  <dd>{formatDate(u.start_date)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">DOB</dt>
                  <dd>{formatDate(u.date_of_birth)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Address</dt>
                  <dd className="min-w-0 truncate">{nonEmpty(u.address)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Pay</dt>
                  <dd className="tabular-nums">
                    {formatPay(u.pay_type, u.pay_amount)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Licence</dt>
                  <dd className="min-w-0 truncate">
                    {nonEmpty(u.licence_number)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">White Card</dt>
                  <dd className="min-w-0 truncate">
                    {nonEmpty(u.white_card_number)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Employment</dt>
                  <dd className="min-w-0">
                    {u.employment_type
                      ? EMPLOYMENT_TYPE_LABELS[u.employment_type] ??
                        u.employment_type
                      : "—"}
                  </dd>
                </div>
                {u.employment_type === "abn" && (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-neutral-500">ABN</dt>
                    <dd className="min-w-0 truncate">
                      {nonEmpty(u.abn_number)}
                    </dd>
                  </div>
                )}
                {(u.employment_type === "full_time" ||
                  u.employment_type === "casual") && (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-neutral-500">TFN</dt>
                    <dd className="min-w-0 truncate">
                      {nonEmpty(u.tfn_number)}
                    </dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Qleave</dt>
                  <dd className="min-w-0 truncate">
                    {nonEmpty(u.qleave_number)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-neutral-500">Sizes</dt>
                  <dd className="min-w-0">
                    {u.shirt_size || u.shorts_size || u.jacket_size ? (
                      <span className="text-neutral-700">
                        Shirt {u.shirt_size ?? "—"} · Shorts{" "}
                        {u.shorts_size ?? "—"} · Jacket{" "}
                        {u.jacket_size ?? "—"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>

              {u.notes && u.notes.trim() !== "" && (
                <p className="mt-3 whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-700">
                  {u.notes}
                </p>
              )}

              <EmployeeCerts
                userId={u.id}
                certs={certsByUser.get(u.id) ?? []}
              />
              </div>
            </details>
          );
                  })}
                </div>
              </div>
            </details>
          );
        });
      })()}
    </main>
  );
}
