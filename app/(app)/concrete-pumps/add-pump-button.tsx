"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPump } from "./actions";

export default function AddPumpButton({
  knownCompanies,
  defaultCompany,
}: {
  knownCompanies: string[];
  defaultCompany?: string;
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
      const result = await addPump(fd);
      if ("error" in result) {
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
        className="rounded bg-black px-3 py-1.5 text-sm text-white"
      >
        {defaultCompany ? "+ Add pump" : "+ Add pump"}
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
            <h2 className="text-lg font-semibold">Add concrete pump</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Company *
                <input
                  type="text"
                  name="company"
                  required
                  defaultValue={defaultCompany ?? ""}
                  list="pump-company-suggestions"
                  className="rounded border p-2"
                  disabled={isPending}
                />
                <datalist id="pump-company-suggestions">
                  {knownCompanies.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Pump name *
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. 32m Boom #1"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Model
                  <input
                    type="text"
                    name="model"
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Serial number
                  <input
                    type="text"
                    name="serial_number"
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Registration
                  <input
                    type="text"
                    name="registration"
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Capacity
                  <input
                    type="text"
                    name="capacity"
                    placeholder="e.g. 32m boom"
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
                  {isPending ? "Adding…" : "Add pump"}
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
