"use client";

import { useState } from "react";
import { getDownloadUrl } from "./document-actions";
import { DOC_TYPES } from "@/lib/jobs/constants";

type DocumentRow = {
  id: string;
  file_name: string | null;
  doc_type: string | null;
  file_url: string;
  created_at: string;
};

const DOC_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map((d) => [d.value, d.label]),
);
const KNOWN_ORDER: string[] = DOC_TYPES.map((d) => d.value);

function labelFor(docType: string): string {
  if (docType === "") return "Untyped";
  return DOC_TYPE_LABELS[docType] ?? docType;
}

function compareGroups(a: string, b: string): number {
  const aIdx = KNOWN_ORDER.indexOf(a);
  const bIdx = KNOWN_ORDER.indexOf(b);
  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
  if (aIdx !== -1) return -1;
  if (bIdx !== -1) return 1;
  if (a === "" && b !== "") return 1;
  if (b === "" && a !== "") return -1;
  return labelFor(a).localeCompare(labelFor(b));
}

export default function DocumentList({
  documents,
}: {
  documents: DocumentRow[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (documents.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500">No documents yet.</p>;
  }

  const groups = new Map<string, DocumentRow[]>();
  for (const d of documents) {
    const key = d.doc_type ?? "";
    const arr = groups.get(key);
    if (arr) arr.push(d);
    else groups.set(key, [d]);
  }
  const groupKeys = Array.from(groups.keys()).sort(compareGroups);

  async function handleDownload(doc: DocumentRow) {
    setBusyId(doc.id);
    setError(null);
    try {
      const url = await getDownloadUrl(doc.file_url);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <p className="mt-2 text-xs text-neutral-500">
        {documents.length} {documents.length === 1 ? "document" : "documents"}{" "}
        across {groupKeys.length}{" "}
        {groupKeys.length === 1 ? "type" : "types"}.
      </p>
      {error && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-2 space-y-1">
        {groupKeys.map((key) => {
          const docs = groups.get(key)!;
          return (
            <details
              key={key}
              className="rounded border border-neutral-200 open:bg-neutral-50/30"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-sm font-medium hover:bg-neutral-50">
                <span>{labelFor(key)}</span>
                <span className="text-xs text-neutral-500">
                  {docs.length}
                </span>
              </summary>
              <ul className="divide-y divide-neutral-200 border-t border-neutral-200 bg-white">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {d.file_name ?? "—"}
                      <span className="ml-2 text-xs text-neutral-500">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownload(d)}
                      disabled={busyId === d.id}
                      className="shrink-0 rounded border px-2 py-0.5 text-xs disabled:opacity-50"
                    >
                      {busyId === d.id ? "..." : "Download"}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </>
  );
}
