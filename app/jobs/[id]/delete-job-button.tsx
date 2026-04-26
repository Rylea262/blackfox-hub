"use client";

import { useState, useTransition } from "react";
import { deleteJob } from "./job-actions";

export default function DeleteJobButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const ok = window.confirm(
      "Delete this job? All attached documents will also be removed. This cannot be undone.",
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteJob(jobId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="self-start rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Delete job"}
      </button>
    </div>
  );
}
