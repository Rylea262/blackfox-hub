"use client";

import { useEffect, useState, useTransition } from "react";
import { getWeeklySummary } from "./summary-actions";

export default function SummaryDrawer({
  anchorDate,
}: {
  anchorDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    setError(null);
    startTransition(async () => {
      const result = await getWeeklySummary(anchorDate);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSummary(result.summary ?? "");
    });
  }

  // Auto-load the first time the drawer is opened.
  useEffect(() => {
    if (open && summary === null && !isPending && !error) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="border-b border-neutral-200 bg-neutral-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        aria-expanded={open}
      >
        <span>📋 Weekly summary</span>
        <span className="text-xs text-neutral-500">
          {open ? "Close" : "Past 7 days"}
        </span>
      </button>

      {open && (
        <div className="border-t border-neutral-200 bg-white p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              AI-generated · past 7 days to {anchorDate}
            </p>
            <button
              type="button"
              onClick={load}
              disabled={isPending}
              className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
            >
              {isPending ? "Thinking…" : summary ? "Regenerate" : "Generate"}
            </button>
          </div>

          {error && (
            <p className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </p>
          )}

          {!error && summary === null && !isPending && (
            <p className="text-xs text-neutral-500">
              Click Generate to summarise the week.
            </p>
          )}

          {isPending && summary === null && (
            <p className="text-xs text-neutral-500">Summarising…</p>
          )}

          {summary !== null && (
            <div className="whitespace-pre-wrap text-sm text-neutral-800">
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
