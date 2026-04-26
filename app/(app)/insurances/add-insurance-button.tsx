"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addInsurance } from "./add-actions";
import { updateCertPath } from "./cert-actions";
import { createClient } from "@/lib/supabase/client";
import { COMPANIES } from "@/lib/insurances/constants";

export default function AddInsuranceButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
    setFile(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const fileToUpload = file;

    startTransition(async () => {
      const result = await addInsurance(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      if (fileToUpload) {
        const supabase = createClient();
        const path = `${result.id}/${Date.now()}_${fileToUpload.name}`;
        const { error: upErr } = await supabase.storage
          .from("insurance-certificates")
          .upload(path, fileToUpload, {
            contentType: fileToUpload.type || undefined,
            upsert: false,
          });

        if (upErr) {
          setError(
            `Insurance saved, but cert upload failed: ${upErr.message}. You can retry from the row.`,
          );
          router.refresh();
          return;
        }

        const linkResult = await updateCertPath(result.id, path);
        if (linkResult?.error) {
          setError(
            `Insurance saved and file uploaded, but linking failed: ${linkResult.error}`,
          );
          router.refresh();
          return;
        }
      }

      setFile(null);
      setIsOpen(false);
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
        + Add insurance
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
            <h2 className="text-lg font-semibold">Add insurance</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Name *
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  placeholder="e.g. Public Liability"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Company *
                <select
                  name="company"
                  required
                  defaultValue=""
                  className="rounded border p-2"
                  disabled={isPending}
                >
                  <option value="" disabled>
                    Select a company…
                  </option>
                  {COMPANIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Provider
                <input
                  type="text"
                  name="provider"
                  placeholder="e.g. Allianz"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Policy number
                <input
                  type="text"
                  name="policy_number"
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Start date
                  <input
                    type="date"
                    name="start_date"
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Expiry date
                  <input
                    type="date"
                    name="expiry_date"
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

              <div className="text-sm">
                <span className="block">Certificate (optional)</span>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isPending) setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (isPending) return;
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) setFile(dropped);
                  }}
                  className={`mt-1 rounded border-2 border-dashed p-4 text-center text-xs ${
                    dragOver
                      ? "border-black bg-neutral-100"
                      : "border-neutral-300"
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {file.name}{" "}
                        <span className="text-neutral-500">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        disabled={isPending}
                        className="text-xs text-neutral-500 underline disabled:opacity-50"
                      >
                        remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <p>Drop a PDF here, or</p>
                      <label
                        className={`mt-1 inline-block rounded border bg-white px-2 py-0.5 ${
                          isPending
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        Choose file
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          disabled={isPending}
                          onChange={(e) => {
                            const picked = e.target.files?.[0];
                            if (picked) setFile(picked);
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>

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
                  {isPending ? "Adding…" : "Add insurance"}
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
