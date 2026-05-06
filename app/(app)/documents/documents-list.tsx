"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format/date";
import {
  attachCompanyDoc,
  deleteCompanyDoc,
  getCompanyDocUrl,
  renameCompanyDoc,
  updateCompanyDocDescription,
} from "./actions";

export type CompanyDoc = {
  id: string;
  file_name: string;
  file_url: string;
  description: string | null;
  created_at: string;
};

export default function DocumentsList({ docs }: { docs: CompanyDoc[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyDownloadId, setBusyDownloadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState("");
  const [pendingDescription, setPendingDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const path = `${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("company-documents")
      .upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (upErr) {
      setError(upErr.message);
      setIsUploading(false);
      return;
    }

    const description = pendingDescription.trim() || null;
    startTransition(async () => {
      const result = await attachCompanyDoc(file.name, path, description);
      setIsUploading(false);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setPendingDescription("");
      router.refresh();
    });
  }

  async function handleDownload(doc: CompanyDoc) {
    setBusyDownloadId(doc.id);
    setError(null);
    try {
      const url = await getCompanyDocUrl(doc.file_url);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyDownloadId(null);
    }
  }

  function handleDelete(doc: CompanyDoc) {
    const ok = window.confirm(
      `Delete "${doc.file_name}"? This cannot be undone.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCompanyDoc(doc.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function startRename(doc: CompanyDoc) {
    setEditingId(doc.id);
    setEditingName(doc.file_name);
    setError(null);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
  }

  function saveRename(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError("Name cannot be empty");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await renameCompanyDoc(id, trimmed);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      setEditingName("");
      router.refresh();
    });
  }

  function startEditDesc(doc: CompanyDoc) {
    setEditingDescId(doc.id);
    setEditingDesc(doc.description ?? "");
    setError(null);
  }

  function cancelEditDesc() {
    setEditingDescId(null);
    setEditingDesc("");
  }

  function saveEditDesc(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateCompanyDocDescription(id, editingDesc);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditingDescId(null);
      setEditingDesc("");
      router.refresh();
    });
  }

  const busy = isUploading || isPending;

  return (
    <div>
      <div className="rounded border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-700">Upload</h2>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Description (optional)
            <input
              type="text"
              value={pendingDescription}
              onChange={(e) => setPendingDescription(e.target.value)}
              placeholder="What is this file?"
              disabled={busy}
              className="rounded border border-neutral-300 p-2"
            />
          </label>
          <label
            className={`rounded bg-black px-3 py-2 text-sm text-white ${
              busy
                ? "pointer-events-none opacity-50"
                : "cursor-pointer hover:bg-neutral-800"
            }`}
          >
            {isUploading ? "Uploading…" : "Choose file"}
            <input
              type="file"
              className="hidden"
              disabled={busy}
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {docs.length === 0 ? (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No documents yet. Upload the first one above.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
          {docs.map((d) => {
            const isEditing = editingId === d.id;
            const isEditingDesc = editingDescId === d.id;
            return (
              <li key={d.id} className="flex flex-col gap-2 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveRename(d.id);
                        } else if (e.key === "Escape") {
                          cancelRename();
                        }
                      }}
                      autoFocus
                      disabled={busy}
                      className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1"
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {d.file_name}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">
                    {formatDate(d.created_at)}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveRename(d.id)}
                          disabled={busy}
                          className="rounded bg-black px-2 py-0.5 text-xs text-white disabled:opacity-50"
                        >
                          {isPending ? "…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          disabled={busy}
                          className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startRename(d)}
                          className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(d)}
                          disabled={busyDownloadId === d.id}
                          className="rounded border px-2 py-0.5 text-xs disabled:opacity-50"
                        >
                          {busyDownloadId === d.id ? "…" : "Download"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d)}
                          disabled={busy}
                          className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isEditingDesc ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingDesc}
                      onChange={(e) => setEditingDesc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEditDesc(d.id);
                        } else if (e.key === "Escape") {
                          cancelEditDesc();
                        }
                      }}
                      autoFocus
                      disabled={busy}
                      className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => saveEditDesc(d.id)}
                      disabled={busy}
                      className="rounded bg-black px-2 py-0.5 text-xs text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditDesc}
                      disabled={busy}
                      className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditDesc(d)}
                    className="self-start text-left text-xs italic text-neutral-500 hover:text-neutral-800"
                  >
                    {d.description?.trim() || "+ add description"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
