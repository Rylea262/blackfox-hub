import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import {
  COMPANY_ASSET_CATEGORY_LABELS,
  COMPANY_ASSET_CATEGORY_ORDER,
} from "@/lib/company-assets/constants";
import AddAssetButton from "./add-asset-button";
import EditAssetButton from "./edit-asset-button";
import DeleteAssetButton from "./delete-asset-button";
import ReceiptCell from "./receipt-cell";

type Asset = {
  id: string;
  name: string;
  category: string;
  value: number | string | null;
  purchase_date: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
};

function categoryLabel(value: string): string {
  return COMPANY_ASSET_CATEGORY_LABELS[value] ?? value;
}

function compareCategories(a: string, b: string): number {
  const aIdx = COMPANY_ASSET_CATEGORY_ORDER.indexOf(a);
  const bIdx = COMPANY_ASSET_CATEGORY_ORDER.indexOf(b);
  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
  if (aIdx !== -1) return -1;
  if (bIdx !== -1) return 1;
  return categoryLabel(a).localeCompare(categoryLabel(b));
}

function numericValue(v: number | string | null): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export default async function AssetsPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: assets, error } = await supabase
    .from("company_assets")
    .select(
      "id, name, category, value, purchase_date, notes, receipt_url, created_at",
    )
    .order("name", { ascending: true });

  const all = (assets ?? []) as Asset[];

  const totalValue = all.reduce((sum, a) => sum + numericValue(a.value), 0);

  const grouped = new Map<string, Asset[]>();
  for (const a of all) {
    const arr = grouped.get(a.category);
    if (arr) arr.push(a);
    else grouped.set(a.category, [a]);
  }
  const categoryKeys = Array.from(grouped.keys()).sort(compareCategories);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Register of company assets, grouped by category.
          </p>
          <p className="mt-1 text-sm">
            <span className="text-neutral-500">Total value: </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(totalValue)}
            </span>
            <span className="ml-2 text-xs text-neutral-500">
              ({all.length} {all.length === 1 ? "asset" : "assets"})
            </span>
          </p>
        </div>
        <AddAssetButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && all.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No assets yet. Add the first one.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {categoryKeys.map((cat) => {
          const items = grouped.get(cat)!;
          const categoryTotal = items.reduce(
            (sum, a) => sum + numericValue(a.value),
            0,
          );
          return (
            <details
              key={cat}
              className="rounded border border-neutral-200 bg-white"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3">
                <span className="font-semibold">{categoryLabel(cat)}</span>
                <span className="flex items-baseline gap-3 text-xs text-neutral-500">
                  <span className="tabular-nums">
                    {formatCurrency(categoryTotal)}
                  </span>
                  <span>
                    {items.length} {items.length === 1 ? "asset" : "assets"}
                  </span>
                </span>
              </summary>
              <div className="border-t border-neutral-200 p-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-neutral-500">
                      <th className="py-1.5">Name</th>
                      <th className="py-1.5 text-right">Value</th>
                      <th className="py-1.5">Purchased</th>
                      <th className="py-1.5">Receipt</th>
                      <th className="py-1.5">Notes</th>
                      <th className="py-1.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a.id} className="border-b align-top">
                        <td className="py-2">{a.name}</td>
                        <td className="py-2 text-right tabular-nums">
                          {formatCurrency(a.value)}
                        </td>
                        <td className="py-2">{formatDate(a.purchase_date)}</td>
                        <td className="py-2">
                          <ReceiptCell
                            assetId={a.id}
                            receiptUrl={a.receipt_url}
                          />
                        </td>
                        <td className="py-2 whitespace-pre-wrap">
                          {a.notes ?? "—"}
                        </td>
                        <td className="py-2">
                          <div className="flex flex-col items-start gap-1">
                            <EditAssetButton
                              asset={{
                                id: a.id,
                                name: a.name,
                                category: a.category,
                                value: a.value,
                                purchase_date: a.purchase_date,
                                notes: a.notes,
                              }}
                            />
                            <DeleteAssetButton
                              assetId={a.id}
                              assetName={a.name}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
