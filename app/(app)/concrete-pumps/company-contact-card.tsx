"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format/currency";
import { upsertPumpCompany } from "./actions";

export type PumpCompanyContact = {
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  account_number: string | null;
  credit_limit: number | string | null;
  payment_terms: string | null;
};

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

export default function CompanyContactCard({
  company,
  contact,
}: {
  company: string;
  contact: PumpCompanyContact | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await upsertPumpCompany(company, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mb-3 rounded border border-neutral-200 bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          <div className="flex gap-2">
            <span className="w-20 shrink-0 text-neutral-500">Contact</span>
            <span className="min-w-0 truncate">
              {nonEmpty(contact?.contact_name ?? null)}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-20 shrink-0 text-neutral-500">Phone</span>
            <span className="min-w-0 truncate">
              {nonEmpty(contact?.contact_phone ?? null)}
            </span>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <span className="w-20 shrink-0 text-neutral-500">Email</span>
            <span className="min-w-0 truncate">
              {nonEmpty(contact?.contact_email ?? null)}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-20 shrink-0 text-neutral-500">Account</span>
            <span className="min-w-0 truncate">
              {nonEmpty(contact?.account_number ?? null)}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-20 shrink-0 text-neutral-500">Limit</span>
            <span className="tabular-nums">
              {contact?.credit_limit != null && contact.credit_limit !== ""
                ? formatCurrency(contact.credit_limit)
                : "—"}
            </span>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <span className="w-20 shrink-0 text-neutral-500">Terms</span>
            <span className="min-w-0 truncate">
              {nonEmpty(contact?.payment_terms ?? null)}
            </span>
          </div>
          {contact?.notes && contact.notes.trim() !== "" && (
            <div className="flex gap-2 sm:col-span-2">
              <span className="w-20 shrink-0 text-neutral-500">Notes</span>
              <span className="min-w-0 whitespace-pre-wrap">
                {contact.notes}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="shrink-0 rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs hover:bg-neutral-50"
        >
          Edit contact
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Contact for {company}</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Contact name
                <input
                  type="text"
                  name="contact_name"
                  defaultValue={contact?.contact_name ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Phone
                  <input
                    type="tel"
                    name="contact_phone"
                    defaultValue={contact?.contact_phone ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Email
                  <input
                    type="email"
                    name="contact_email"
                    defaultValue={contact?.contact_email ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Account number
                  <input
                    type="text"
                    name="account_number"
                    defaultValue={contact?.account_number ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Credit limit (AUD)
                  <input
                    type="number"
                    name="credit_limit"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={contact?.credit_limit ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Payment terms
                <input
                  type="text"
                  name="payment_terms"
                  defaultValue={contact?.payment_terms ?? ""}
                  placeholder="e.g. 30 days EOM"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Notes
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={contact?.notes ?? ""}
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
    </div>
  );
}
