"use client";

import { useState } from "react";
import Link from "next/link";

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Returns the dates to display in a month grid: leading days from prev
// month, the month itself, and trailing days to fill the last row.
function monthDays(viewMonth: Date): Date[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1);
  // 0 = Sunday in JS; we want weeks to start Monday for an AU office.
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - offset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

const WEEKDAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarDrawer({
  selectedDate,
  today,
}: {
  selectedDate: string;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  function prevMonth() {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
    );
  }

  function nextMonth() {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
    );
  }

  const days = monthDays(viewMonth);
  const heading = viewMonth.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border-b border-neutral-200 bg-neutral-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        aria-expanded={open}
      >
        <span>📅 Calendar</span>
        <span className="text-xs text-neutral-500">
          {open ? "Close" : selectedDate === today ? "Today" : selectedDate}
        </span>
      </button>

      {open && (
        <div className="border-t border-neutral-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded px-2 py-1 text-sm hover:bg-neutral-100"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-medium">{heading}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded px-2 py-1 text-sm hover:bg-neutral-100"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {WEEKDAY_HEADERS.map((d, i) => (
              <div key={i} className="font-medium text-neutral-500">
                {d}
              </div>
            ))}
            {days.map((d) => {
              const key = ymd(d);
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const isToday = key === today;
              const isSelected = key === selectedDate;
              const isFuture = key > today;
              const classes = [
                "rounded p-1 text-xs",
                inMonth ? "" : "text-neutral-300",
                isFuture ? "cursor-not-allowed text-neutral-300" : "",
                isSelected
                  ? "bg-black text-white"
                  : isToday
                    ? "bg-neutral-200 font-semibold"
                    : !isFuture
                      ? "hover:bg-neutral-100"
                      : "",
              ].join(" ");

              if (isFuture) {
                return (
                  <span key={key} className={classes}>
                    {d.getDate()}
                  </span>
                );
              }
              return (
                <Link
                  key={key}
                  href={`/notes?date=${key}`}
                  className={classes}
                  onClick={() => setOpen(false)}
                >
                  {d.getDate()}
                </Link>
              );
            })}
          </div>

          {selectedDate !== today && (
            <Link
              href={`/notes?date=${today}`}
              onClick={() => setOpen(false)}
              className="mt-3 block rounded bg-black px-3 py-1.5 text-center text-xs text-white hover:bg-neutral-800"
            >
              Jump to today
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
