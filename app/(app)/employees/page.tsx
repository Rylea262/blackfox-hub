import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { POSITION_LABELS } from "@/lib/employees/constants";
import AddEmployeeButton from "./add-employee-button";
import EditEmployeeButton from "./edit-employee-button";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  office: "Office",
  leading_hand: "Leading hand",
};

type Employee = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  position: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  start_date: string | null;
  notes: string | null;
  created_at: string;
};

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

  const { data: users, error } = await supabase
    .from("users")
    .select(
      "id, name, email, role, position, phone, emergency_contact_name, emergency_contact_phone, start_date, notes, created_at",
    )
    .order("name", { ascending: true, nullsFirst: false });

  const employees = (users ?? []) as Employee[];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Company employee register. Edit a record to update contact and
            role details.
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
          const positionLabel = u.position
            ? POSITION_LABELS[u.position] ?? u.position
            : "—";
          const roleLabel = ROLE_LABELS[u.role] ?? u.role;
          return (
            <article
              key={u.id}
              className="rounded border border-neutral-200 bg-white p-4"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {u.name?.trim() || u.email}
                    {isSelf && (
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        (you)
                      </span>
                    )}
                  </h2>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {positionLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                    {roleLabel}
                  </span>
                  <EditEmployeeButton
                    employee={{
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      role: u.role,
                      position: u.position,
                      phone: u.phone,
                      emergency_contact_name: u.emergency_contact_name,
                      emergency_contact_phone: u.emergency_contact_phone,
                      start_date: u.start_date,
                      notes: u.notes,
                    }}
                    isSelf={isSelf}
                  />
                </div>
              </header>

              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
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
              </dl>

              {u.notes && u.notes.trim() !== "" && (
                <p className="mt-3 whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-700">
                  {u.notes}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
