"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setToolLost } from "./edit-actions";

export default function LostToolButton({
  toolId,
  toolName,
  isLost,
}: {
  toolId: string;
  toolName: string;
  isLost: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isLost) {
      const ok = window.confirm(
        `Mark "${toolName}" as lost or stolen? It will move to the Lost and Stolen section and its value will come off the total.`,
      );
      if (!ok) return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setToolLost(toolId, !isLost);
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
        className={
          isLost
            ? "rounded border border-green-300 bg-white px-2 py-0.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
            : "rounded border border-orange-300 bg-white px-2 py-0.5 text-xs text-orange-700 hover:bg-orange-50 disabled:opacity-50"
        }
      >
        {isPending
          ? "…"
          : isLost
            ? "Restore"
            : "Lost / Stolen"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
