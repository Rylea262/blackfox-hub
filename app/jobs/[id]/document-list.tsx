"use client";

import { useState } from "react";
import { getDownloadUrl } from "./document-actions";

type DocumentRow = {
  id: string;
  file_name: string | null;
  doc_type: string | null;
  file_url: string;
  created_at: string;
};

export default function DocumentList({
  documents,
}: {
  documents: DocumentRow[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <p className="mt-2 text-sm text-neutral-500">No documents yet.</p>
    );
  }

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
      {error && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Filename</th>
            <th className="py-2">Type</th>
            <th className="py-2">Uploaded</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-b">
              <td className="py-2">{d.file_name ?? "—"}</td>
              <td className="py-2">{d.doc_type ?? "—"}</td>
              <td className="py-2">
                {new Date(d.created_at).toLocaleDateString()}
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => handleDownload(d)}
                  disabled={busyId === d.id}
                  className="rounded border px-2 py-0.5 disabled:opacity-50"
                >
                  {busyId === d.id ? "..." : "Download"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
