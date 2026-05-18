"use client";

import { useState } from "react";
import { getPlantPackDownloadLinks } from "./doc-actions";

export default function EmailPlantPackButton({
  pumpId,
  pumpName,
  docCount,
}: {
  pumpId: string;
  pumpName: string;
  docCount: number;
}) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (docCount === 0) {
      setError("No documents to send.");
      return;
    }
    setIsBuilding(true);
    setError(null);
    try {
      const links = await getPlantPackDownloadLinks(pumpId);
      if (links.length === 0) {
        setError("No documents to send.");
        return;
      }

      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const folder = zip.folder(`Plant Pack - ${pumpName}`) ?? zip;

      const usedNames = new Map<string, number>();
      await Promise.all(
        links.map(async (link) => {
          const res = await fetch(link.url);
          if (!res.ok) {
            throw new Error(
              `Failed to fetch ${link.file_name}: ${res.status} ${res.statusText}`,
            );
          }
          const blob = await res.blob();
          let name = link.file_name;
          const count = usedNames.get(name) ?? 0;
          if (count > 0) {
            const dot = name.lastIndexOf(".");
            const base = dot > 0 ? name.slice(0, dot) : name;
            const ext = dot > 0 ? name.slice(dot) : "";
            name = `${base} (${count})${ext}`;
          }
          usedNames.set(link.file_name, count + 1);
          folder.file(name, blob);
        }),
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = `Plant Pack - ${pumpName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 60_000);

      const subject = `Plant Pack — ${pumpName}`;
      const lines = [
        `Plant pack for ${pumpName}.`,
        "",
        "Files included in the attached zip:",
        ...links.map((l) => `- ${l.file_name}`),
        "",
        `(Attach "Plant Pack - ${pumpName}.zip" from your Downloads folder before sending.)`,
      ];
      const href = `mailto:?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(lines.join("\n"))}`;
      window.location.href = href;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build plant pack");
    } finally {
      setIsBuilding(false);
    }
  }

  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBuilding || docCount === 0}
        title={
          docCount === 0
            ? "No documents to send"
            : `Zip and email ${docCount} document${docCount === 1 ? "" : "s"}`
        }
        className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBuilding ? "Preparing…" : "Email Plant Pack"}
      </button>
      {error && (
        <span className="mt-1 text-[10px] text-red-700">{error}</span>
      )}
    </span>
  );
}
