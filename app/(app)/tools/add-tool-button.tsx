"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTool } from "./add-actions";
import { TOOL_CATEGORIES } from "@/lib/tools/constants";

export default function AddToolButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
    setCategory("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addTool(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      setCategory("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded bg-black px-3 py-1.5 text-sm text-white"
      >
        + Add tool
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
            <h2 className="text-lg font-semibold">Add tool</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Name *
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  placeholder="e.g. Makita 18V Drill"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Category *
                <select
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded border p-2"
                  disabled={isPending}
                >
                  <option value="" disabled>
                    Select category…
                  </option>
                  {TOOL_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Serial number
                <input
                  type="text"
                  name="serial_number"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Location
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Workshop, Site A, Ute"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              {category === "lasers" && (
                <label className="flex flex-col gap-1 text-sm">
                  Next service due
                  <input
                    type="date"
                    name="next_service_due"
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              )}
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
                  {isPending ? "Adding…" : "Add tool"}
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
