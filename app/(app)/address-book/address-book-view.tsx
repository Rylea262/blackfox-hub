"use client";

import { useState } from "react";
import ContactsSection, { type Contact } from "./contacts-section";
import { SENDER_EMAILS } from "@/lib/address-book/senders";

const BF_GROUPS = [
  { value: "black_fox_industries", label: "Black Fox Industries" },
  { value: "black_fox_concrete_pumping", label: "Black Fox Concrete Pumping" },
] as const;

export default function AddressBookView({
  contactsByCompany,
}: {
  contactsByCompany: Record<string, Contact[]>;
}) {
  const [sender, setSender] = useState(SENDER_EMAILS[0]);
  const [mode, setMode] = useState<"bcc" | "cc">("bcc");

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded border border-neutral-200 bg-white p-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-neutral-500">From</span>
          <select
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="rounded border border-neutral-300 p-1.5 text-sm"
          >
            {SENDER_EMAILS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex items-center gap-3">
          <span className="text-neutral-500">Recipients</span>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="send-mode"
              value="bcc"
              checked={mode === "bcc"}
              onChange={() => setMode("bcc")}
            />
            BCC
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="send-mode"
              value="cc"
              checked={mode === "cc"}
              onChange={() => setMode("cc")}
            />
            CC
          </label>
        </fieldset>
        <span className="ml-auto text-xs text-neutral-500">
          Switch the From to{" "}
          <span className="font-mono">{sender}</span> in your mail app
        </span>
      </div>

      {BF_GROUPS.map((group) => {
        const list = contactsByCompany[group.value] ?? [];
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
              <ContactsSection contacts={list} sendMode={mode} />
            </div>
          </details>
        );
      })}
    </>
  );
}
