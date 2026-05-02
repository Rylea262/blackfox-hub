"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { attachCert, deleteCert, getCertDownloadUrl } from "./cert-actions";

export type EmployeeCert = {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
};

export default function EmployeeCerts({
  userId,
  certs,
}: {
  userId: string;
  certs: EmployeeCert[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyDownloadId, setBusyDownloadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("employee-certificates")
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
      const result = await attachCert(userId, file.name, path);
      setIsUploading(false);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDownload(cert: EmployeeCert) {
    setBusyDownloadId(cert.id);
    setError(null);
    try {
      const url = await getCertDownloadUrl(cert.file_url);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyDownloadId(null);
    }
  }

  function handleDelete(cert: EmployeeCert) {
    const ok = window.confirm(
      `Delete certificate "${cert.file_name}"? This cannot be undone.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCert(cert.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const busy = isUploading || isPending;

  return (
    <div className="mt-3 border-t border-neutral-200 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-neutral-700">Certificates</h3>
        <label
          className={`rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs ${
            busy ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-neutral-50"
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

      {certs.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-500">No certificates yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-200 rounded border border-neutral-200">
          {certs.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 px-2 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                {c.file_name}
                <span className="ml-2 text-xs text-neutral-500">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(c)}
                  disabled={busyDownloadId === c.id}
                  className="rounded border px-2 py-0.5 text-xs disabled:opacity-50"
                >
                  {busyDownloadId === c.id ? "…" : "Download"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  disabled={busy}
                  className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
