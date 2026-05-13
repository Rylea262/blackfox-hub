"use client";

import { useEffect, useState } from "react";

type Slot = "jobs" | "documents" | "notes" | "changes";

const DEFAULT_ORDER: Slot[] = ["jobs", "documents", "notes", "changes"];
const STORAGE_KEY = "dashboard.quadrant-order.v1";

function isValidOrder(value: unknown): value is Slot[] {
  if (!Array.isArray(value)) return false;
  if (value.length !== DEFAULT_ORDER.length) return false;
  const seen = new Set<string>();
  for (const v of value) {
    if (typeof v !== "string") return false;
    if (!DEFAULT_ORDER.includes(v as Slot)) return false;
    if (seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}

export default function DashboardGridClient({
  slots,
  centre,
}: {
  slots: Record<Slot, React.ReactNode>;
  centre: React.ReactNode;
}) {
  const [order, setOrder] = useState<Slot[]>(DEFAULT_ORDER);
  const [draggingSlot, setDraggingSlot] = useState<Slot | null>(null);
  const [overSlot, setOverSlot] = useState<Slot | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as unknown;
      if (isValidOrder(parsed)) setOrder(parsed);
    } catch {
      // ignore: fall back to default order
    }
  }, []);

  function persist(next: Slot[]) {
    setOrder(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore: storage may be unavailable
    }
  }

  function swap(a: Slot, b: Slot) {
    if (a === b) return;
    const next = [...order];
    const ai = next.indexOf(a);
    const bi = next.indexOf(b);
    if (ai < 0 || bi < 0) return;
    [next[ai], next[bi]] = [next[bi], next[ai]];
    persist(next);
  }

  function resetOrder() {
    persist(DEFAULT_ORDER);
  }

  function renderCell(slot: Slot) {
    const isDragging = draggingSlot === slot;
    const isOver = overSlot === slot && draggingSlot !== null && draggingSlot !== slot;
    return (
      <div
        key={slot}
        draggable
        onDragStart={(e) => {
          setDraggingSlot(slot);
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", slot);
        }}
        onDragOver={(e) => {
          if (!draggingSlot) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (draggingSlot !== slot && overSlot !== slot) {
            setOverSlot(slot);
          }
        }}
        onDragLeave={() => {
          if (overSlot === slot) setOverSlot(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (draggingSlot) swap(draggingSlot, slot);
          setDraggingSlot(null);
          setOverSlot(null);
        }}
        onDragEnd={() => {
          setDraggingSlot(null);
          setOverSlot(null);
        }}
        className={`cursor-move rounded transition ${
          isDragging ? "opacity-40" : ""
        } ${isOver ? "ring-2 ring-blue-500" : ""}`}
      >
        {slots[slot]}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetOrder}
          className="text-xs text-neutral-500 underline hover:text-neutral-700"
        >
          Reset layout
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderCell(order[0])}
        {renderCell(order[1])}
      </div>

      <div className="mt-4">{centre}</div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderCell(order[2])}
        {renderCell(order[3])}
      </div>
    </>
  );
}
