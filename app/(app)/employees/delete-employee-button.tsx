"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteEmployeePermanently,
  markEmployeeAsPrevious,
  restoreEmployee,
} from "./lifecycle-actions";

export default function DeleteEmployeeButton({
  userId,
  employeeName,
  isPrevious,
}: {
  userId: string;
  employeeName: string;
  isPrevious: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function handleMarkPrevious(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const result = await markEmployeeAsPrevious(userId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function handleRestore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const result = await restoreEmployee(userId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function handleDeletePermanent(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = window.confirm(
      `Permanently delete "${employeeName}"?\n\nThis cannot be undone. Their own notes and certificates will be deleted, audit attribution on jobs/suppliers/etc. will be cleared, and their login (if any) will be removed.\n\nUse "Move to Previous" instead if you want to keep history.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEmployeePermanently(userId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="rounded border border-red-300 bg-white px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1">
      {isPrevious ? (
        <button
          type="button"
          onClick={handleRestore}
          disabled={isPending}
          className="rounded bg-black px-2 py-0.5 text-xs text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "…" : "Restore to current"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleMarkPrevious}
          disabled={isPending}
          className="rounded bg-black px-2 py-0.5 text-xs text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "…" : "Move to Previous"}
        </button>
      )}
      <button
        type="button"
        onClick={handleDeletePermanent}
        disabled={isPending}
        className="rounded border border-red-400 bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        Delete permanently
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          close();
        }}
        disabled={isPending}
        className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
      >
        Cancel
      </button>
      {error && (
        <span className="ml-1 max-w-xs text-xs text-red-700">{error}</span>
      )}
    </span>
  );
}
