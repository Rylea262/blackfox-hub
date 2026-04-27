"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEmployee } from "./add-actions";
import { POSITIONS } from "@/lib/employees/constants";

const ROLES = [
  { value: "leading_hand", label: "Leading hand" },
  { value: "office", label: "Office" },
  { value: "owner", label: "Owner" },
];

export default function AddEmployeeButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
    setInviteLink(null);
    setCopied(false);
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addEmployee(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.inviteLink) {
        setInviteLink(result.inviteLink);
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can still select and copy manually
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded bg-black px-3 py-1.5 text-sm text-white"
      >
        + Add new employee
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">
              {inviteLink ? "Invite link ready" : "Add new employee"}
            </h2>
            {inviteLink ? (
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-sm text-neutral-700">
                  Send this one-time link to the new user. Opening it lets
                  them set a password and log in.
                </p>
                <textarea
                  readOnly
                  value={inviteLink}
                  rows={4}
                  className="w-full resize-none break-all rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="rounded bg-black px-3 py-1.5 text-sm text-white"
                  >
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
            <>
            <p className="mt-1 text-xs text-neutral-500">
              Adds the employee record. Tick &ldquo;Send login invite&rdquo; to
              also generate a one-time link they can use to log in.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Email *
                <input
                  type="email"
                  name="email"
                  required
                  autoFocus
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Name
                <input
                  type="text"
                  name="name"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Role
                <select
                  name="role"
                  defaultValue="leading_hand"
                  className="rounded border p-2"
                  disabled={isPending}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Position
                <select
                  name="position"
                  defaultValue=""
                  className="rounded border p-2"
                  disabled={isPending}
                >
                  <option value="">—</option>
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="send_invite"
                  className="mt-0.5"
                  disabled={isPending}
                />
                <span>
                  Send login invite
                  <span className="block text-xs text-neutral-500">
                    Generates a one-time link to share with them so they can
                    set a password and log in.
                  </span>
                </span>
              </label>
              {error && (
                <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {isPending ? "Adding…" : "Add employee"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={isPending}
                  className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </form>
            </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
