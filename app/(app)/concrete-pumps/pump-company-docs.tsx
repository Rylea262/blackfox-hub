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
} from "./doc-actions";

export type PumpCompanyDoc = {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
};

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export default function PumpCompanyDocs({
  companyName,
  docs,
}: {
  companyName: string;
  docs: PumpCompanyDoc[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyDownloadId, setBusyDownloadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isPending, startTransition] = useTransition();

  function startRename(doc: PumpCompanyDoc) {
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const path = `${safeSegment(companyName)}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("pump-company-documents")
      .upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (upErr) {
      setError(upErr.message);
      setIsUploading(false);
      return;
    }

    startTransition(async () => {
      const result = await attachCompanyDoc(companyName, file.name, path);
      setIsUploading(false);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDownload(doc: PumpCompanyDoc) {
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

  function handleDelete(doc: PumpCompanyDoc) {
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

  const busy = isUploading || isPending;

  return (
    <div className="mb-3 rounded border border-neutral-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-neutral-700">
          Company documents
        </h3>
        <label
          className={`rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs ${
            busy
              ? "pointer-events-none opacity-50"
              : "cursor-pointer hover:bg-neutral-50"
          }`}
        >
          {isUploading ? "Uploading…" : "+ Upload"}
          <input
            type="file"
            className="hidden"
            disabled={busy}
            onChange={handleUpload}
          />
        </label>
      </div>

      {error && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {docs.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-500">No documents yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-200 rounded border border-neutral-200">
          {docs.map((d) => {
            const isEditing = editingId === d.id;
            return (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 px-2 py-1.5 text-sm"
              >
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
                    className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate">
                    {d.file_name}
                    <span className="ml-2 text-xs text-neutral-500">
                      {formatDate(d.created_at)}
                    </span>
                  </span>
                )}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
