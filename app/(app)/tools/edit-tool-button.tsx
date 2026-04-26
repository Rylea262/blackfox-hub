"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTool } from "./edit-actions";
import { TOOL_CATEGORIES } from "@/lib/tools/constants";

export type ToolForEdit = {
  id: string;
  name: string;
  category: string;
  serial_number: string | null;
  location: string | null;
  notes: string | null;
  next_service_due: string | null;
};

export default function EditToolButton({ tool }: { tool: ToolForEdit }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(tool.category);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
    setCategory(tool.category);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateTool(tool.id, fd);
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
        onClick={() => setIsOpen(true)}
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
            className="w-full max-w-md rounded bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Edit tool</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Name *
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  defaultValue={tool.name}
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
                  defaultValue={tool.serial_number ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Location
                <input
                  type="text"
                  name="location"
                  defaultValue={tool.location ?? ""}
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
                    defaultValue={tool.next_service_due ?? ""}
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
                  defaultValue={tool.notes ?? ""}
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
