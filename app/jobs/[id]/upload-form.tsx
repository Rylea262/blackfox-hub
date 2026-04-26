"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOC_TYPES } from "@/lib/jobs/constants";

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export default function UploadForm({
  jobId,
  userId,
}: {
  jobId: string;
  userId: string;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [docType, setDocType] = useState<string>(DOC_TYPES[0].value);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [, startTransition] = useTransition();

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function upload() {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);
    const supabase = createClient();
    const initial: FileStatus[] = files.map((f) => ({
      name: f.name,
      status: "pending",
    }));
    setStatuses(initial);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setStatuses((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "uploading" } : s,
        ),
      );
      const path = `${jobId}/${Date.now()}_${f.name}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, f, {
          contentType: f.type || undefined,
          upsert: false,
        });

      if (upErr) {
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: "error", error: upErr.message }
              : s,
          ),
        );
        continue;
      }

      const { error: dbErr } = await supabase.from("documents").insert({
        job_id: jobId,
        file_url: path,
        file_name: f.name,
        doc_type: docType,
        uploaded_by: userId,
      });

      if (dbErr) {
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: "error", error: dbErr.message }
              : s,
          ),
        );
        continue;
      }

      setStatuses((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "done" } : s,
        ),
      );
    }

    setFiles([]);
    setIsUploading(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Document type (applies to all files in this batch)
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded border p-2"
          disabled={isUploading}
        >
          {DOC_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!isUploading) addFiles(e.dataTransfer.files);
        }}
        className={`rounded border-2 border-dashed p-8 text-center text-sm ${
          dragOver ? "border-black bg-neutral-100" : "border-neutral-300"
        }`}
      >
        <p>Drop files here, or</p>
        <label className="mt-2 inline-block cursor-pointer rounded border bg-white px-3 py-1">
          Choose files
          <input
            type="file"
            multiple
            className="hidden"
            disabled={isUploading}
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="text-sm">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between border-b py-1">
              <span>
                {f.name}{" "}
                <span className="text-neutral-500">
                  ({Math.round(f.size / 1024)} KB)
                </span>
              </span>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-xs text-neutral-500 underline"
                >
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {statuses.length > 0 && (
        <ul className="text-sm">
          {statuses.map((s, i) => (
            <li
              key={i}
              className={
                s.status === "done"
                  ? "text-green-700"
                  : s.status === "error"
                    ? "text-red-700"
                    : "text-neutral-600"
              }
            >
              {s.name} — {s.status}
              {s.error ? `: ${s.error}` : ""}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={upload}
        disabled={files.length === 0 || isUploading}
        className="self-start rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {isUploading
          ? "Uploading..."
          : `Upload${files.length > 0 ? ` (${files.length})` : ""}`}
      </button>
    </div>
  );
}
