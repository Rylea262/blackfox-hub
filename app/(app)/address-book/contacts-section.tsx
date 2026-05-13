"use client";

import { useMemo, useState } from "react";
import EditContactButton, { type ContactForEdit } from "./edit-contact-button";
import DeleteContactButton from "./delete-contact-button";
import { categoryLabel } from "@/lib/address-book/categories";

export type Contact = {
  id: string;
  bf_company: string;
  name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  category: string | null;
};

type SortField =
  | "name"
  | "company"
  | "position"
  | "category"
  | "email"
  | "phone";
type SortDir = "asc" | "desc";

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

function sortKey(c: Contact, field: SortField): string {
  if (field === "category") return categoryLabel(c.category).toLowerCase();
  const raw = c[field];
  return (raw ?? "").toString().trim().toLowerCase();
}

function buildMailto(emails: string[], mode: "bcc" | "cc"): string {
  if (emails.length === 0) return "";
  return `mailto:?${mode}=${encodeURIComponent(emails.join(","))}`;
}

export default function ContactsSection({
  contacts,
  sendMode = "bcc",
}: {
  contacts: Contact[];
  sendMode?: "bcc" | "cc";
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedContacts = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...contacts].sort((a, b) => {
      const ak = sortKey(a, sortField);
      const bk = sortKey(b, sortField);
      // empties last regardless of direction
      if (ak === "" && bk !== "") return 1;
      if (bk === "" && ak !== "") return -1;
      if (ak < bk) return -1 * dir;
      if (ak > bk) return 1 * dir;
      return a.name.localeCompare(b.name);
    });
  }, [contacts, sortField, sortDir]);

  const emails = useMemo(() => {
    return contacts
      .map((c) => c.email?.trim())
      .filter((e): e is string => Boolean(e));
  }, [contacts]);

  const selectedEmails = useMemo(() => {
    return contacts
      .filter((c) => selectedIds.has(c.id) && c.email?.trim())
      .map((c) => c.email!.trim());
  }, [contacts, selectedIds]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  if (contacts.length === 0) {
    return (
      <p className="text-sm text-neutral-500">No contacts here yet.</p>
    );
  }

  const allChecked = contacts.every((c) => selectedIds.has(c.id));

  const headers: {
    field: SortField;
    label: string;
    align?: "left" | "center";
  }[] = [
    { field: "name", label: "Name" },
    { field: "company", label: "Company" },
    { field: "position", label: "Position" },
    { field: "category", label: "Category" },
    { field: "email", label: "Email", align: "center" },
    { field: "phone", label: "Phone" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={buildMailto(selectedEmails, sendMode)}
          aria-disabled={selectedEmails.length === 0}
          className={`rounded bg-black px-3 py-1.5 text-sm text-white ${
            selectedEmails.length === 0
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          Email selected ({selectedEmails.length})
        </a>
        <a
          href={buildMailto(emails, sendMode)}
          aria-disabled={emails.length === 0}
          className={`rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50 ${
            emails.length === 0 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Email all ({emails.length})
        </a>
        <span className="ml-auto text-xs uppercase tracking-wide text-neutral-500">
          {sendMode}
        </span>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-neutral-500">
            <th className="py-1.5">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
                aria-label="Select all"
              />
            </th>
            {headers.map((h) => {
              const isActive = sortField === h.field;
              const indicator = isActive
                ? sortDir === "asc"
                  ? "▲"
                  : "▼"
                : "";
              const align = h.align ?? "left";
              return (
                <th key={h.field} className="py-1.5">
                  <button
                    type="button"
                    onClick={() => handleSort(h.field)}
                    className={`flex w-full items-center gap-1 text-xs uppercase tracking-wide hover:text-neutral-900 ${
                      align === "center"
                        ? "justify-center"
                        : "justify-start text-left"
                    } ${isActive ? "text-neutral-900" : "text-neutral-500"}`}
                  >
                    {h.label}
                    {indicator && <span aria-hidden>{indicator}</span>}
                  </button>
                </th>
              );
            })}
            <th className="py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {sortedContacts.map((c) => (
            <tr key={c.id} className="border-b align-top">
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggle(c.id)}
                  aria-label={`Select ${c.name}`}
                />
              </td>
              <td className="py-2 pr-3 font-medium">{c.name}</td>
              <td className="py-2 pr-3">{nonEmpty(c.company)}</td>
              <td className="py-2 pr-3">{nonEmpty(c.position)}</td>
              <td className="py-2 pr-3">{categoryLabel(c.category)}</td>
              <td className="py-2 pr-3">
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    className="underline hover:no-underline"
                  >
                    {c.email}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2 pr-3">
                {c.phone ? (
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, "")}`}
                    className="underline hover:no-underline"
                  >
                    {c.phone}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2">
                <div className="flex flex-col items-start gap-1">
                  <EditContactButton contact={c satisfies ContactForEdit} />
                  <DeleteContactButton
                    contactId={c.id}
                    contactName={c.name}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
