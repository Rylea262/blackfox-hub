"use client";

import { useState, useTransition } from "react";
import { updateRole } from "./actions";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "office", label: "Office" },
  { value: "leading_hand", label: "Leading hand" },
];

export default function RoleSelect({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [savedRecently, setSavedRecently] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    const previous = role;
    setRole(newRole);
    setError(null);
    setSavedRecently(false);
    startTransition(async () => {
      const result = await updateRole(userId, newRole);
      if (result?.error) {
        setRole(previous);
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
        value={role}
        onChange={handleChange}
        disabled={isSelf || isPending}
        className="rounded border border-neutral-300 p-1 text-sm disabled:opacity-50"
        title={isSelf ? "You can't change your own role" : undefined}
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {isSelf && (
        <span className="text-xs text-neutral-500">(you)</span>
      )}
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
