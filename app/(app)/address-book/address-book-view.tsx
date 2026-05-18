"use client";

import { useMemo, useState } from "react";
import ContactsSection, { type Contact } from "./contacts-section";
import { categoryLabel } from "@/lib/address-book/categories";

const BF_GROUPS = [
  { value: "black_fox_industries", label: "Black Fox Industries" },
  { value: "black_fox_concrete_pumping", label: "Black Fox Concrete Pumping" },
] as const;

function contactMatches(c: Contact, query: string): boolean {
  if (!query) return true;
  const haystack = [
    c.name,
    c.company,
    c.position,
    c.email,
    c.phone,
    categoryLabel(c.category),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function AddressBookView({
  contactsByCompany,
}: {
  contactsByCompany: Record<string, Contact[]>;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const filteredByCompany = useMemo(() => {
    const out: Record<string, Contact[]> = {};
    for (const [company, list] of Object.entries(contactsByCompany)) {
      out[company] = trimmed
        ? list.filter((c) => contactMatches(c, trimmed))
        : list;
    }
    return out;
  }, [contactsByCompany, trimmed]);

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company, position, email, phone, category…"
          className="w-full rounded border border-neutral-300 bg-white p-2 text-sm"
        />
        {trimmed && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded border border-neutral-300 px-2 py-1.5 text-xs hover:bg-neutral-50"
          >
            Clear
          </button>
        )}
      </div>

      {BF_GROUPS.map((group) => {
        const list = filteredByCompany[group.value] ?? [];
        return (
          <details
            key={group.value}
            open
            className="mt-4 rounded border border-neutral-200 bg-white"
          >
            <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3">
              <span className="text-base font-semibold">{group.label}</span>
              <span className="text-xs text-neutral-500">
                {list.length} {list.length === 1 ? "contact" : "contacts"}
              </span>
            </summary>
            <div className="border-t border-neutral-200 p-4">
              {list.length === 0 && trimmed ? (
                <p className="text-sm text-neutral-500">
                  No matches in this section.
                </p>
              ) : (
                <ContactsSection contacts={list} />
              )}
            </div>
          </details>
        );
      })}
    </>
  );
}
