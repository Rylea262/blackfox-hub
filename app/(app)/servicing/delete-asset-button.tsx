"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAsset } from "./asset-actions";

export default function DeleteAssetButton({
  assetId,
  assetName,
  serviceCount,
}: {
  assetId: string;
  assetName: string;
  serviceCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const extra =
      serviceCount > 0
        ? ` and ${serviceCount} service record${serviceCount === 1 ? "" : "s"}`
        : "";
    const ok = window.confirm(
      `Delete "${assetName}"${extra}? This cannot be undone.`,
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAsset(assetId);
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
