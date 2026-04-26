import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { COMPANY_LABELS } from "@/lib/insurances/constants";
import AddInsuranceButton from "./add-insurance-button";
import CertCell from "./cert-cell";
import EditInsuranceButton from "./edit-insurance-button";
import DeleteInsuranceButton from "./delete-insurance-button";

type ExpiryStatus = "expired" | "soon" | "ok" | "none";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function expiryStatus(iso: string | null): ExpiryStatus {
  if (!iso) return "none";
  const expiry = new Date(iso);
  if (Number.isNaN(expiry.getTime())) return "none";
  const days = Math.floor(
    (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "expired";
  if (days < 30) return "soon";
  return "ok";
}

function rowClass(status: ExpiryStatus): string {
  switch (status) {
    case "expired":
      return "bg-red-50";
    case "soon":
      return "bg-orange-50";
    case "ok":
      return "bg-green-50";
    default:
      return "";
  }
}

export default async function InsurancesPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: insurances, error } = await supabase
    .from("insurances")
    .select(
      "id, name, company, provider, policy_number, start_date, expiry_date, notes, certificate_url, created_at",
    )
    .order("expiry_date", { ascending: true, nullsFirst: false });

  const expiredCount =
    insurances?.filter((i) => expiryStatus(i.expiry_date) === "expired").length ?? 0;
  const soonCount =
    insurances?.filter((i) => expiryStatus(i.expiry_date) === "soon").length ?? 0;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Insurances</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Insurance policies the business holds.
          </p>
          {(expiredCount > 0 || soonCount > 0) && (
            <p className="mt-1 text-sm">
              {expiredCount > 0 && (
                <span className="text-red-700 font-medium">
                  {expiredCount} expired
                </span>
              )}
              {expiredCount > 0 && soonCount > 0 && (
                <span className="text-neutral-400"> · </span>
              )}
              {soonCount > 0 && (
                <span className="text-orange-700 font-medium">
                  {soonCount} expiring within 30 days
                </span>
              )}
            </p>
          )}
        </div>
        <AddInsuranceButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && (!insurances || insurances.length === 0) && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No insurances yet. Add the first one.
        </p>
      )}

      {insurances && insurances.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th className="py-2">Company</th>
              <th className="py-2">Provider</th>
              <th className="py-2">Policy #</th>
              <th className="py-2">Start</th>
              <th className="py-2">Expiry</th>
              <th className="py-2">Certificate</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {insurances.map((ins) => {
              const status = expiryStatus(ins.expiry_date);
              return (
                <tr
                  key={ins.id}
                  className={`border-b align-top ${rowClass(status)}`}
                >
                  <td className="py-2">{ins.name}</td>
                  <td className="py-2">
                    {ins.company ? COMPANY_LABELS[ins.company] ?? ins.company : "—"}
                  </td>
                  <td className="py-2">{ins.provider ?? "—"}</td>
                  <td className="py-2">{ins.policy_number ?? "—"}</td>
                  <td className="py-2">{formatDate(ins.start_date)}</td>
                  <td className="py-2">
                    {formatDate(ins.expiry_date)}
                  </td>
                  <td className="py-2">
                    <CertCell
                      insuranceId={ins.id}
                      certUrl={ins.certificate_url}
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex flex-col items-start gap-1">
                      <EditInsuranceButton
                        insurance={{
                          id: ins.id,
                          name: ins.name,
                          company: ins.company,
                          provider: ins.provider,
                          policy_number: ins.policy_number,
                          start_date: ins.start_date,
                          expiry_date: ins.expiry_date,
                          notes: ins.notes,
                        }}
                      />
                      <DeleteInsuranceButton
                        insuranceId={ins.id}
                        insuranceName={ins.name}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
