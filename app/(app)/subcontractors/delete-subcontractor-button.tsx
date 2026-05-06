"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSubcontractor } from "./actions";

export default function DeleteSubcontractorButton({
  subId,
  subName,
  docCount,
}: {
  subId: string;
  subName: string;
  docCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const docNote =
      docCount > 0
        ? ` and ${docCount} attached ${docCount === 1 ? "document" : "documents"}`
        : "";
    const ok = window.confirm(
      `Delete "${subName}"${docNote}? This cannot be undone.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSubcontractor(subId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded border border-red-300 bg-white px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
