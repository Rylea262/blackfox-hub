"use client";

import { useState, useTransition } from "react";
import { updatePosition } from "./position-actions";
import { POSITIONS } from "@/lib/employees/constants";

export default function PositionSelect({
  userId,
  currentPosition,
}: {
  userId: string;
  currentPosition: string | null;
}) {
  const [position, setPosition] = useState(currentPosition ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedRecently, setSavedRecently] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const previous = position;
    setPosition(next);
    setError(null);
    setSavedRecently(false);
    startTransition(async () => {
      const result = await updatePosition(userId, next);
      if (result?.error) {
        setPosition(previous);
        setError(result.error);
        return;
      }
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={position}
        onChange={handleChange}
        disabled={isPending}
        className="rounded border border-neutral-300 p-1 text-sm disabled:opacity-50"
      >
        <option value="">—</option>
        {POSITIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="text-xs text-neutral-500">saving…</span>
      )}
      {savedRecently && !isPending && (
        <span className="text-xs text-green-700">saved</span>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
