"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCertDownloadUrl, updateCertPath } from "./cert-actions";

export default function CertCell({
  insuranceId,
  certUrl,
}: {
  insuranceId: string;
  certUrl: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const path = `${insuranceId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("insurance-certificates")
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
      const result = await updateCertPath(insuranceId, path);
      setIsUploading(false);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDownload() {
    if (!certUrl) return;
    setIsDownloading(true);
    setError(null);
    try {
      const url = await getCertDownloadUrl(certUrl);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  }

  const busy = isUploading || isPending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {certUrl ? (
        <>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="rounded border border-neutral-300 px-2 py-0.5 text-xs disabled:opacity-50"
          >
            {isDownloading ? "…" : "Download"}
          </button>
          <label
            className={`text-xs underline ${
              busy ? "pointer-events-none opacity-50" : "cursor-pointer"
            }`}
          >
            replace
            <input
              type="file"
              className="hidden"
              disabled={busy}
              onChange={handleFile}
            />
          </label>
        </>
      ) : (
        <label
          className={`rounded border border-neutral-300 px-2 py-0.5 text-xs ${
            busy ? "pointer-events-none opacity-50" : "cursor-pointer"
          }`}
        >
          Upload
          <input
            type="file"
            className="hidden"
            disabled={busy}
            onChange={handleFile}
          />
        </label>
      )}
      {busy && (
        <span className="text-xs text-neutral-500">saving…</span>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
