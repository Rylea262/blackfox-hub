"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAsset } from "./asset-actions";
import { ASSET_TYPES } from "@/lib/servicing/constants";

export type AssetForEdit = {
  id: string;
  name: string;
  type: string;
  current_hours: number | null;
  next_service_hours: number | null;
  rego_due: string | null;
  rego: string | null;
  vin: string | null;
  next_service_due: string | null;
};

export default function EditAssetButton({ asset }: { asset: AssetForEdit }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(asset.type);
  const [isPending, startTransition] = useTransition();

  function open(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  }

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
    setType(asset.type);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAsset(asset.id, fd);
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
        onClick={open}
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
            className="w-full max-w-sm rounded bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Edit asset</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Name *
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  defaultValue={asset.name}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
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
                  {ASSET_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              {type === "plant" && (
                <div className="flex gap-3">
                  <label className="flex flex-1 flex-col gap-1 text-sm">
                    Current hours
                    <input
                      type="number"
                      name="current_hours"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      defaultValue={asset.current_hours ?? ""}
                      className="rounded border p-2"
                      disabled={isPending}
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-sm">
                    Next service (hrs)
                    <input
                      type="number"
                      name="next_service_hours"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      defaultValue={asset.next_service_hours ?? ""}
                      className="rounded border p-2"
                      disabled={isPending}
                    />
                  </label>
                </div>
              )}
              {type === "vehicle" && (
                <>
                  <div className="flex gap-3">
                    <label className="flex flex-1 flex-col gap-1 text-sm">
                      Rego
                      <input
                        type="text"
                        name="rego"
                        defaultValue={asset.rego ?? ""}
                        className="rounded border p-2"
                        disabled={isPending}
                      />
                    </label>
                    <label className="flex flex-1 flex-col gap-1 text-sm">
                      Rego due
                      <input
                        type="date"
                        name="rego_due"
                        defaultValue={asset.rego_due ?? ""}
                        className="rounded border p-2"
                        disabled={isPending}
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    VIN
                    <input
                      type="text"
                      name="vin"
                      defaultValue={asset.vin ?? ""}
                      className="rounded border p-2"
                      disabled={isPending}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Next service due
                    <input
                      type="date"
                      name="next_service_due"
                      defaultValue={asset.next_service_due ?? ""}
                      className="rounded border p-2"
                      disabled={isPending}
                    />
                  </label>
                </>
              )}
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
