"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ASSET_TYPE_LABELS } from "@/lib/servicing/constants";

export type PdfAsset = {
  id: string;
  name: string;
  type: string;
  current_hours: number | null;
  next_service_hours: number | null;
  rego: string | null;
  rego_due: string | null;
  vin: string | null;
  next_service_due: string | null;
};

export type PdfService = {
  id: string;
  asset_id: string;
  service_date: string | null;
  next_service_date: string | null;
  serviced_by: string | null;
  notes: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PdfHistoryButton({
  assets,
  services,
}: {
  assets: PdfAsset[];
  services: PdfService[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const servicesByAsset = new Map<string, PdfService[]>();
  for (const s of services) {
    const arr = servicesByAsset.get(s.asset_id);
    if (arr) arr.push(s);
    else servicesByAsset.set(s.asset_id, [s]);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(assets.map((a) => a.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function close() {
    setOpen(false);
    setSelected(new Set());
  }

  function generate() {
    if (selected.size === 0) return;
    setIsGenerating(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      const today = new Date().toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Black Fox Industries", marginX, 50);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Servicing history", marginX, 70);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Generated ${today}`, marginX, 86);
      doc.setTextColor(0);

      let cursorY = 110;

      const selectedAssets = assets.filter((a) => selected.has(a.id));

      selectedAssets.forEach((asset, idx) => {
        const assetServices = (servicesByAsset.get(asset.id) ?? [])
          .slice()
          .sort((a, b) => (b.service_date ?? "").localeCompare(a.service_date ?? ""));

        if (idx > 0) {
          doc.addPage();
          cursorY = 50;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(asset.name, marginX, cursorY);
        cursorY += 18;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        const typeLabel = ASSET_TYPE_LABELS[asset.type] ?? asset.type;
        const meta: string[] = [typeLabel];
        if (asset.type === "plant" && asset.current_hours != null) {
          meta.push(
            `Hours: ${asset.current_hours}` +
              (asset.next_service_hours != null
                ? ` / next at ${asset.next_service_hours}`
                : ""),
          );
        }
        if (asset.type === "vehicle" || asset.type === "trailer") {
          if (asset.rego) meta.push(`Rego: ${asset.rego}`);
          if (asset.rego_due) meta.push(`Rego due: ${formatDate(asset.rego_due)}`);
          if (asset.vin) meta.push(`VIN: ${asset.vin}`);
          if (asset.next_service_due)
            meta.push(`Next service: ${formatDate(asset.next_service_due)}`);
        }
        doc.text(meta.join("  ·  "), marginX, cursorY, {
          maxWidth: pageWidth - marginX * 2,
        });
        doc.setTextColor(0);
        cursorY += 16;

        if (assetServices.length === 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(120);
          doc.text("No service records on file.", marginX, cursorY + 6);
          doc.setTextColor(0);
          doc.setFont("helvetica", "normal");
        } else {
          autoTable(doc, {
            startY: cursorY,
            margin: { left: marginX, right: marginX },
            head: [["Service date", "Next service", "Serviced by", "Notes"]],
            body: assetServices.map((s) => [
              formatDate(s.service_date),
              formatDate(s.next_service_date),
              s.serviced_by ?? "—",
              s.notes ?? "—",
            ]),
            styles: { fontSize: 9, cellPadding: 4, valign: "top" },
            headStyles: { fillColor: [30, 30, 30], textColor: 255 },
            columnStyles: {
              0: { cellWidth: 75 },
              1: { cellWidth: 75 },
              2: { cellWidth: 110 },
              3: { cellWidth: "auto" },
            },
          });
        }
      });

      const fname = `servicing-history-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fname);
      close();
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
      >
        Create servicing history PDF
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-base font-semibold">
                Select assets for the PDF
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Tick the assets whose service history should be included. One
                section per asset in a single PDF.
              </p>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs">
              <span className="text-neutral-600">
                {selected.size} of {assets.length} selected
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded border border-neutral-300 px-2 py-0.5 hover:bg-white"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded border border-neutral-300 px-2 py-0.5 hover:bg-white"
                >
                  Clear
                </button>
              </span>
            </div>

            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
              {assets.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-neutral-500">
                  No assets to include.
                </li>
              ) : (
                assets.map((a) => {
                  const count = servicesByAsset.get(a.id)?.length ?? 0;
                  const checked = selected.has(a.id);
                  return (
                    <li key={a.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(a.id)}
                          className="h-4 w-4"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{a.name}</span>
                          <span className="ml-2 text-xs text-neutral-500">
                            {ASSET_TYPE_LABELS[a.type] ?? a.type}
                          </span>
                        </span>
                        <span className="text-xs text-neutral-500">
                          {count} {count === 1 ? "service" : "services"}
                        </span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-3">
              <button
                type="button"
                onClick={close}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={selected.size === 0 || isGenerating}
                className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {isGenerating ? "Generating…" : "Generate PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
