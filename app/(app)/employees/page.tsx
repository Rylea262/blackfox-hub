import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatCurrency } from "@/lib/format/currency";
import AddEmployeeButton from "./add-employee-button";
import EditEmployeeButton from "./edit-employee-button";
import EmployeeCerts, { type EmployeeCert } from "./employee-certs";

type Employee = {
  id: string;
  name: string | null;
  email: string;
  position: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  start_date: string | null;
  notes: string | null;
  address: string | null;
  licence_number: string | null;
  white_card_number: string | null;
  employment_type: string | null;
  abn_number: string | null;
  tfn_number: string | null;
  pay_type: string | null;
  pay_amount: number | string | null;
  created_at: string;
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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

export default async function EmployeesPage() {
  const { user: currentUser } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const [usersRes, certsRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, name, email, position, phone, emergency_contact_name, emergency_contact_phone, start_date, notes, address, licence_number, white_card_number, employment_type, abn_number, tfn_number, pay_type, pay_amount, created_at",
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

      <div className="mt-4 flex flex-col gap-3">
        {employees.map((u) => {
          const isSelf = u.id === currentUser.id;
          return (
            <details
              key={u.id}
              className="rounded border border-neutral-200 bg-white"
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
                <span className="ml-auto">
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
                      notes: u.notes,
                      address: u.address,
                      licence_number: u.licence_number,
                      white_card_number: u.white_card_number,
                      employment_type: u.employment_type,
                      abn_number: u.abn_number,
                      tfn_number: u.tfn_number,
                      pay_type: u.pay_type,
                      pay_amount: u.pay_amount,
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
    </main>
  );
}
