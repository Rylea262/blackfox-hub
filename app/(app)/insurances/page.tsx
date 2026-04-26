import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import AddInsuranceButton from "./add-insurance-button";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export default async function InsurancesPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: insurances, error } = await supabase
    .from("insurances")
    .select("id, name, provider, policy_number, start_date, expiry_date, created_at")
    .order("expiry_date", { ascending: true, nullsFirst: false });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Insurances</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Insurance policies the business holds.
          </p>
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
              <th className="py-2">Provider</th>
              <th className="py-2">Policy #</th>
              <th className="py-2">Start</th>
              <th className="py-2">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {insurances.map((ins) => (
              <tr key={ins.id} className="border-b">
                <td className="py-2">{ins.name}</td>
                <td className="py-2">{ins.provider ?? "—"}</td>
                <td className="py-2">{ins.policy_number ?? "—"}</td>
                <td className="py-2">{formatDate(ins.start_date)}</td>
                <td className="py-2">{formatDate(ins.expiry_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
