import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { ASSET_TYPE_LABELS } from "@/lib/servicing/constants";
import AddServicingButton from "./add-servicing-button";

type DueStatus = "overdue" | "soon" | "ok" | "none";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function dueStatus(iso: string | null): DueStatus {
  if (!iso) return "none";
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return "none";
  const days = Math.floor(
    (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "overdue";
  if (days < 30) return "soon";
  return "ok";
}

function dueClass(status: DueStatus): string {
  switch (status) {
    case "overdue":
      return "text-red-700 font-semibold";
    case "soon":
      return "text-amber-700 font-medium";
    default:
      return "";
  }
}

export default async function ServicingPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: records, error } = await supabase
    .from("servicing")
    .select(
      "id, asset_name, asset_type, service_date, next_service_date, serviced_by, created_at",
    )
    .order("next_service_date", { ascending: true, nullsFirst: false });

  const overdueCount =
    records?.filter((r) => dueStatus(r.next_service_date) === "overdue").length ?? 0;
  const soonCount =
    records?.filter((r) => dueStatus(r.next_service_date) === "soon").length ?? 0;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Servicing</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Plant and vehicle servicing records.
          </p>
          {(overdueCount > 0 || soonCount > 0) && (
            <p className="mt-1 text-sm">
              {overdueCount > 0 && (
                <span className="font-medium text-red-700">
                  {overdueCount} overdue
                </span>
              )}
              {overdueCount > 0 && soonCount > 0 && (
                <span className="text-neutral-400"> · </span>
              )}
              {soonCount > 0 && (
                <span className="font-medium text-amber-700">
                  {soonCount} due within 30 days
                </span>
              )}
            </p>
          )}
        </div>
        <AddServicingButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && (!records || records.length === 0) && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No servicing records yet. Add the first one.
        </p>
      )}

      {records && records.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Asset</th>
              <th className="py-2">Type</th>
              <th className="py-2">Last serviced</th>
              <th className="py-2">Next service</th>
              <th className="py-2">Serviced by</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const status = dueStatus(r.next_service_date);
              return (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-2">{r.asset_name}</td>
                  <td className="py-2">
                    {ASSET_TYPE_LABELS[r.asset_type] ?? r.asset_type}
                  </td>
                  <td className="py-2">{formatDate(r.service_date)}</td>
                  <td className={`py-2 ${dueClass(status)}`}>
                    {formatDate(r.next_service_date)}
                  </td>
                  <td className="py-2">{r.serviced_by ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
