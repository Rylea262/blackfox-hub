"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getContractDownloadUrl,
  removeContract,
  setContractPath,
} from "./contract-actions";

function stop(e: React.MouseEvent | React.ChangeEvent) {
  // Anything that bubbles up to the parent <summary> would toggle the
  // details panel — block that for every interaction inside this widget.
  e.preventDefault();
  e.stopPropagation();
}

export default function EmployeeContractButton({
  userId,
  contractUrl,
}: {
  userId: string;
  contractUrl: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    stop(e);
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("employee-contracts")
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
      const result = await setContractPath(userId, path);
      setIsUploading(false);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDownload(e: React.MouseEvent) {
    stop(e);
    if (!contractUrl) return;
    setIsDownloading(true);
    setError(null);
    try {
      const url = await getContractDownloadUrl(contractUrl);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  }

  function handleRemove(e: React.MouseEvent) {
    stop(e);
    const ok = window.confirm(
      "Remove this employee's contract? The file will be deleted.",
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await removeContract(userId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const busy = isUploading || isPending;

  if (!contractUrl) {
    return (
      <span className="flex items-center gap-2">
        <label
          onClick={stop}
          className={`rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs ${
            busy
              ? "pointer-events-none opacity-50"
              : "cursor-pointer hover:bg-neutral-50"
          }`}
        >
          {isUploading ? "Uploading…" : "+ Contract"}
          <input
            type="file"
            className="hidden"
            disabled={busy}
            onChange={handleFile}
          />
        </label>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
      >
        {isDownloading ? "…" : "Contract"}
      </button>
      <label
        onClick={stop}
        className={`rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs ${
          busy
            ? "pointer-events-none opacity-50"
            : "cursor-pointer hover:bg-neutral-50"
        }`}
        title="Replace contract"
      >
        ↻
        <input
          type="file"
          className="hidden"
          disabled={busy}
          onChange={handleFile}
        />
      </label>
      <button
        type="button"
        onClick={handleRemove}
        disabled={busy}
        className="rounded border border-red-300 bg-white px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
        title="Remove contract"
      >
        ✕
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
