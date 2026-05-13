"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { addDefect, deleteDefect } from "./defect-actions";

export type DefectRow = {
  id: string;
  description: string;
  defect_date: string;
  cost: number | string;
  created_at: string;
};

function numericValue(v: number | string): number {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export default function DefectsSection({
  jobId,
  defects,
}: {
  jobId: string;
  defects: DefectRow[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [defectDate, setDefectDate] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = defects.reduce((sum, d) => sum + numericValue(d.cost), 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    const fd = new FormData();
    fd.set("description", description);
    fd.set("defect_date", defectDate);
    fd.set("cost", cost);
    startTransition(async () => {
      const result = await addDefect(jobId, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDescription("");
      setDefectDate("");
      setCost("");
      router.refresh();
    });
  }

  function handleDelete(d: DefectRow) {
    const ok = window.confirm(
      `Delete defect "${d.description}" (${formatCurrency(d.cost)})? This cannot be undone.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteDefect(d.id, jobId);
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
          Description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Cracked surface at grid B3"
            className="rounded border border-neutral-300 bg-white p-2"
            disabled={isPending}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            value={defectDate}
            onChange={(e) => setDefectDate(e.target.value)}
            className="rounded border border-neutral-300 bg-white p-2"
            disabled={isPending}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Cost (AUD)
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="e.g. 850"
            className="rounded border border-neutral-300 bg-white p-2"
            disabled={isPending}
          />
        </label>
        <button
          type="submit"
          disabled={
            !description.trim() || !defectDate || !cost.trim() || isPending
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

      {defects.length === 0 ? (
        <p className="text-sm text-neutral-500">No defects logged yet.</p>
      ) : (
        <>
          <p className="text-sm">
            <span className="text-neutral-500">Total cost: </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(total)}
            </span>
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-neutral-500">
                <th className="py-1.5">Description</th>
                <th className="py-1.5">Date</th>
                <th className="py-1.5 text-right">Cost</th>
                <th className="py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {defects.map((d) => (
                <tr key={d.id} className="border-b align-top">
                  <td className="py-2 pr-3 whitespace-pre-wrap">
                    {d.description}
                  </td>
                  <td className="py-2 pr-3">{formatDate(d.defect_date)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatCurrency(d.cost)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
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
