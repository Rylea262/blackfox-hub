import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatDate } from "@/lib/format/date";
import { ASSET_TYPE_LABELS } from "@/lib/servicing/constants";
import AddAssetButton from "./add-asset-button";
import AddServicingButton from "./add-servicing-button";
import EditAssetButton from "./edit-asset-button";
import DeleteAssetButton from "./delete-asset-button";

type DueStatus = "overdue" | "soon" | "ok" | "none";

type Asset = {
  id: string;
  name: string;
  type: string;
  current_hours: number | null;
  next_service_hours: number | null;
  rego_due: string | null;
  rego: string | null;
  vin: string | null;
  next_service_due: string | null;
  created_at: string;
};

function worstStatus(...statuses: DueStatus[]): DueStatus {
  if (statuses.includes("overdue")) return "overdue";
  if (statuses.includes("soon")) return "soon";
  if (statuses.includes("ok")) return "ok";
  return "none";
}

const HOURS_WARNING_THRESHOLD = 50;

function hoursStatus(
  current: number | null,
  next: number | null,
): DueStatus {
  if (current == null || next == null) return "none";
  const remaining = next - current;
  if (remaining <= 0) return "overdue";
  if (remaining < HOURS_WARNING_THRESHOLD) return "soon";
  return "ok";
}

type Service = {
  id: string;
  asset_id: string;
  service_date: string | null;
  next_service_date: string | null;
  serviced_by: string | null;
  notes: string | null;
  created_at: string;
};


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

function statusBg(status: DueStatus): string {
  switch (status) {
    case "overdue":
      return "bg-red-50 border-red-200";
    case "soon":
      return "bg-orange-50 border-orange-200";
    case "ok":
      return "bg-green-50 border-green-200";
    default:
      return "bg-white border-neutral-200";
  }
}

function statusText(status: DueStatus): string {
  switch (status) {
    case "overdue":
      return "text-red-700";
    case "soon":
      return "text-orange-700";
    case "ok":
      return "text-green-700";
    default:
      return "text-neutral-500";
  }
}

export default async function ServicingPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const [assetsRes, servicesRes] = await Promise.all([
    supabase
      .from("assets")
      .select(
        "id, name, type, current_hours, next_service_hours, rego_due, rego, vin, next_service_due, created_at",
      ),
    supabase
      .from("servicing")
      .select(
        "id, asset_id, service_date, next_service_date, serviced_by, notes, created_at",
      )
      .order("service_date", { ascending: false, nullsFirst: false }),
  ]);

  const assets = (assetsRes.data ?? []) as Asset[];
  const services = (servicesRes.data ?? []) as Service[];

  const servicesByAsset = new Map<string, Service[]>();
  for (const s of services) {
    const arr = servicesByAsset.get(s.asset_id);
    if (arr) arr.push(s);
    else servicesByAsset.set(s.asset_id, [s]);
  }

  function soonestNext(assetId: string): string | null {
    const list = servicesByAsset.get(assetId) ?? [];
    const dates = list
      .map((s) => s.next_service_date)
      .filter((d): d is string => Boolean(d));
    if (dates.length === 0) return null;
    return dates.sort()[0];
  }

  const sortedAssets = [...assets].sort((a, b) => {
    const aNext = soonestNext(a.id);
    const bNext = soonestNext(b.id);
    if (!aNext && !bNext) return a.name.localeCompare(b.name);
    if (!aNext) return 1;
    if (!bNext) return -1;
    return aNext.localeCompare(bNext);
  });

  const overdueCount = sortedAssets.filter(
    (a) => dueStatus(soonestNext(a.id)) === "overdue",
  ).length;
  const soonCount = sortedAssets.filter(
    (a) => dueStatus(soonestNext(a.id)) === "soon",
  ).length;

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
                <span className="font-medium text-orange-700">
                  {soonCount} due within 30 days
                </span>
              )}
            </p>
          )}
        </div>
        <AddAssetButton />
      </div>

      {assetsRes.error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {assetsRes.error.message}
        </p>
      )}

      {!assetsRes.error && sortedAssets.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No plant or vehicles yet. Add the first one.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {sortedAssets.map((asset) => {
          const assetServices = servicesByAsset.get(asset.id) ?? [];
          const next = soonestNext(asset.id);
          const status = dueStatus(next);
          // Banner colour: combine the soonest service date with the
          // vehicle-specific rego_due and next_service_due statuses so
          // any expired/soon item drives the row red/orange.
          const bannerStatus =
            asset.type === "vehicle"
              ? worstStatus(
                  status,
                  dueStatus(asset.rego_due),
                  dueStatus(asset.next_service_due),
                )
              : status;
          return (
            <details
              key={asset.id}
              className={`rounded border ${statusBg(bannerStatus)}`}
            >
              <summary className="flex cursor-pointer select-none flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-semibold">{asset.name}</span>
                <span className="text-xs text-neutral-500">
                  {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
                </span>
                {asset.type === "plant" &&
                  asset.current_hours != null &&
                  asset.next_service_hours != null && (
                    <span
                      className={`text-xs tabular-nums ${statusText(
                        hoursStatus(
                          asset.current_hours,
                          asset.next_service_hours,
                        ),
                      )}`}
                    >
                      {asset.current_hours} / {asset.next_service_hours} hrs
                    </span>
                  )}
                {asset.type === "vehicle" && (
                  <>
                    <span className="text-xs text-neutral-700">
                      Rego: {asset.rego ?? "—"}
                    </span>
                    <span className="text-xs text-neutral-700">
                      {asset.rego_due
                        ? `Rego due: ${formatDate(asset.rego_due)}`
                        : "Rego due: —"}
                    </span>
                    {asset.vin && (
                      <span className="text-xs text-neutral-700">
                        VIN: {asset.vin}
                      </span>
                    )}
                    {asset.next_service_due && (
                      <span className="text-xs text-neutral-700">
                        Next service: {formatDate(asset.next_service_due)}
                      </span>
                    )}
                  </>
                )}
                <span className="ml-auto flex items-center gap-3 text-xs">
                  <span className={statusText(status)}>
                    {next
                      ? `Next: ${formatDate(next)}`
                      : "No service scheduled"}
                  </span>
                  <span className="text-neutral-500">
                    {assetServices.length}{" "}
                    {assetServices.length === 1 ? "service" : "services"}
                  </span>
                  <EditAssetButton
                    asset={{
                      id: asset.id,
                      name: asset.name,
                      type: asset.type,
                      current_hours: asset.current_hours,
                      next_service_hours: asset.next_service_hours,
                      rego_due: asset.rego_due,
                      rego: asset.rego,
                      vin: asset.vin,
                      next_service_due: asset.next_service_due,
                    }}
                  />
                  <DeleteAssetButton
                    assetId={asset.id}
                    assetName={asset.name}
                    serviceCount={assetServices.length}
                  />
                </span>
              </summary>
              <div className="border-t border-neutral-200 bg-white p-4">
                {assetServices.length === 0 ? (
                  <p className="mb-3 text-sm text-neutral-500">
                    No service records yet.
                  </p>
                ) : (
                  <table className="mb-3 w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-neutral-500">
                        <th className="py-1.5">Last serviced</th>
                        <th className="py-1.5">Next service</th>
                        <th className="py-1.5">Serviced by</th>
                        <th className="py-1.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetServices.map((s) => {
                        const sStatus = dueStatus(s.next_service_date);
                        return (
                          <tr key={s.id} className="border-b align-top">
                            <td className="py-1.5">
                              {formatDate(s.service_date)}
                            </td>
                            <td className={`py-1.5 ${statusText(sStatus)}`}>
                              {formatDate(s.next_service_date)}
                            </td>
                            <td className="py-1.5">{s.serviced_by ?? "—"}</td>
                            <td className="py-1.5 whitespace-pre-wrap">
                              {s.notes ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                <AddServicingButton assetId={asset.id} />
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
