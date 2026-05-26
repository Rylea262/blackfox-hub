"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteEmployeeLogin, setUserRole } from "./access-actions";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  office: "Office",
  leading_hand: "Leading hand",
};

const ROLE_OPTIONS = ["owner", "office", "leading_hand"] as const;

export default function AccessControls({
  userId,
  email,
  role,
  hasLogin,
  isSelf,
}: {
  userId: string;
  email: string | null;
  role: string | null;
  hasLogin: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await inviteEmployeeLogin(userId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setInfo(`Invitation sent to ${email}.`);
      router.refresh();
    });
  }

  function handleRoleChange(next: string) {
    if (next === role) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const canInvite = !hasLogin && !!email && !isSelf;

  return (
    <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-3">
      <h3 className="text-sm font-medium text-neutral-700">Access</h3>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-neutral-500">Login:</span>
        <span
          className={
            hasLogin ? "text-green-700" : "text-neutral-700"
          }
        >
          {hasLogin ? "Yes" : "No login yet"}
        </span>

        {hasLogin && (
          <>
            <span className="text-neutral-300">·</span>
            <label className="flex items-center gap-2">
              <span className="text-neutral-500">Role:</span>
              <select
                value={role ?? "leading_hand"}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={isPending || isSelf}
                title={
                  isSelf
                    ? "Use a different owner account to change your own role"
                    : undefined
                }
                className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {canInvite && (
          <button
            type="button"
            onClick={handleInvite}
            disabled={isPending}
            className="rounded bg-black px-3 py-1 text-xs text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Send invite"}
          </button>
        )}

        {!hasLogin && !email && (
          <span className="text-xs italic text-neutral-500">
            Add an email to enable invites.
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {info && (
        <p className="mt-2 rounded border border-green-300 bg-green-50 p-2 text-xs text-green-700">
          {info}
        </p>
      )}
    </div>
  );
}
