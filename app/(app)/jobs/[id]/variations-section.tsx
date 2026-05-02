"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format/currency";
import { addVariation, deleteVariation } from "./variation-actions";

export type VariationRow = {
  id: string;
  type: string;
  variation_date: string;
  value: number | string;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function numericValue(v: number | string): number {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export default function VariationsSection({
  jobId,
  variations,
}: {
  jobId: string;
  variations: VariationRow[];
}) {
  const router = useRouter();
  const [type, setType] = useState("");
  const [variationDate, setVariationDate] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = variations.reduce((sum, v) => sum + numericValue(v.value), 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    const fd = new FormData();
    fd.set("type", type);
    fd.set("variation_date", variationDate);
    fd.set("value", value);
    startTransition(async () => {
      const result = await addVariation(jobId, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setType("");
      setVariationDate("");
      setValue("");
      router.refresh();
    });
  }

  function handleDelete(v: VariationRow) {
    const ok = window.confirm(
      `Delete variation "${v.type}" (${formatCurrency(v.value)})? This cannot be undone.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteVariation(v.id, jobId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-2 rounded border border-neutral-200 bg-neutral-50 p-3"
      >
        <label className="flex min-w-0 flex-[2] flex-col gap-1 text-sm">
          Type
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. Extra concrete pour"
            className="rounded border border-neutral-300 bg-white p-2"
            disabled={isPending}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            value={variationDate}
            onChange={(e) => setVariationDate(e.target.value)}
            className="rounded border border-neutral-300 bg-white p-2"
            disabled={isPending}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Value (AUD)
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 1200"
            className="rounded border border-neutral-300 bg-white p-2"
            disabled={isPending}
          />
        </label>
        <button
          type="submit"
          disabled={
            !type.trim() || !variationDate || !value.trim() || isPending
          }
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {isPending ? "…" : "Add"}
        </button>
      </form>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {variations.length === 0 ? (
        <p className="text-sm text-neutral-500">No variations logged yet.</p>
      ) : (
        <>
          <p className="text-sm">
            <span className="text-neutral-500">Total: </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(total)}
            </span>
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-neutral-500">
                <th className="py-1.5">Type</th>
                <th className="py-1.5">Date</th>
                <th className="py-1.5 text-right">Value</th>
                <th className="py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr key={v.id} className="border-b align-top">
                  <td className="py-2 pr-3">{v.type}</td>
                  <td className="py-2 pr-3">{formatDate(v.variation_date)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatCurrency(v.value)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(v)}
                      disabled={isPending}
                      className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
