"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContact } from "./actions";
import { CONTACT_CATEGORIES } from "@/lib/address-book/categories";

export type ContactForEdit = {
  id: string;
  bf_company: string;
  name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  category: string | null;
};

export default function EditContactButton({
  contact,
}: {
  contact: ContactForEdit;
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
      const result = await updateContact(contact.id, fd);
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
            <h2 className="text-lg font-semibold">Edit contact</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Black Fox company *
                <select
                  name="bf_company"
                  required
                  defaultValue={contact.bf_company}
                  className="rounded border p-2"
                  disabled={isPending}
                >
                  <option value="black_fox_industries">
                    Black Fox Industries
                  </option>
                  <option value="black_fox_concrete_pumping">
                    Black Fox Concrete Pumping
                  </option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Category
                <select
                  name="category"
                  defaultValue={contact.category ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                >
                  <option value="">— None —</option>
                  {CONTACT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Name *
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={contact.name}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Company
                  <input
                    type="text"
                    name="company"
                    defaultValue={contact.company ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Position
                  <input
                    type="text"
                    name="position"
                    defaultValue={contact.position ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Email
                  <input
                    type="email"
                    name="email"
                    defaultValue={contact.email ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={contact.phone ?? ""}
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
                  defaultValue={contact.notes ?? ""}
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
