"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInsurance } from "./edit-actions";

export default function DeleteInsuranceButton({
  insuranceId,
  insuranceName,
}: {
  insuranceId: string;
  insuranceName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const ok = window.confirm(
      `Delete the insurance "${insuranceName}"? The certificate file will also be removed. This cannot be undone.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteInsurance(insuranceId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
