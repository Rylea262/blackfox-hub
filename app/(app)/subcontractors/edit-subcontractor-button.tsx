"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateInput } from "@/lib/format/date";
import { updateSubcontractor } from "./actions";

export type SubForEdit = {
  id: string;
  type: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  abn: string | null;
  public_liability_expiry: string | null;
  workcover_expiry: string | null;
  notes: string | null;
};

export default function EditSubcontractorButton({
  sub,
}: {
  sub: SubForEdit;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(sub.type);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
    setType(sub.type);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSubcontractor(sub.id, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs hover:bg-neutral-50"
      >
        Edit
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Edit subcontractor</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Type *
                <select
                  name="type"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="rounded border p-2"
                  disabled={isPending}
                >
                  <option value="sole_trader">Sole trader</option>
                  <option value="company">Company</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {type === "company" ? "Company name *" : "Name *"}
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={sub.name}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              {type === "company" && (
                <label className="flex flex-col gap-1 text-sm">
                  Contact person
                  <input
                    type="text"
                    name="contact_person"
                    defaultValue={sub.contact_person ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              )}
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={sub.phone ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Email
                  <input
                    type="email"
                    name="email"
                    defaultValue={sub.email ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Address
                <input
                  type="text"
                  name="address"
                  defaultValue={sub.address ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                ABN
                <input
                  type="text"
                  name="abn"
                  defaultValue={sub.abn ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Public liability expiry
                  <input
                    type="text"
                    name="public_liability_expiry"
                    defaultValue={formatDateInput(sub.public_liability_expiry)}
                    inputMode="numeric"
                    placeholder="DD/MM/YYYY"
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Workcover expiry
                  <input
                    type="text"
                    name="workcover_expiry"
                    defaultValue={formatDateInput(sub.workcover_expiry)}
                    inputMode="numeric"
                    placeholder="DD/MM/YYYY"
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Notes
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={sub.notes ?? ""}
                  className="resize-y rounded border p-2"
                  disabled={isPending}
                />
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
                  {isPending ? "Saving…" : "Save"}
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
          </div>
        </div>
      )}
    </>
  );
}
