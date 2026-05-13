"use client";

import { useMemo, useState } from "react";
import EditContactButton, { type ContactForEdit } from "./edit-contact-button";
import DeleteContactButton from "./delete-contact-button";

export type Contact = {
  id: string;
  bf_company: string;
  name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

function nonEmpty(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

function mailtoBcc(emails: string[]): string {
  if (emails.length === 0) return "";
  // Plain mailto with bcc — leave to the user's mail client.
  return `mailto:?bcc=${encodeURIComponent(emails.join(","))}`;
}

export default function ContactsSection({
  contacts,
}: {
  contacts: Contact[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  if (contacts.length === 0) {
    return (
      <p className="text-sm text-neutral-500">No contacts here yet.</p>
    );
  }

  const allChecked = contacts.every((c) => selectedIds.has(c.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={mailtoBcc(selectedEmails)}
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
          href={mailtoBcc(emails)}
          aria-disabled={emails.length === 0}
          className={`rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50 ${
            emails.length === 0 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Email all ({emails.length})
        </a>
        <span className="ml-auto text-xs text-neutral-500">
          BCC opens in your mail app
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
            <th className="py-1.5">Name</th>
            <th className="py-1.5">Company</th>
            <th className="py-1.5">Position</th>
            <th className="py-1.5">Email</th>
            <th className="py-1.5">Phone</th>
            <th className="py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
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
