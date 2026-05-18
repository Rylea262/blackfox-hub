"use client";

import ContactsSection, { type Contact } from "./contacts-section";

const BF_GROUPS = [
  { value: "black_fox_industries", label: "Black Fox Industries" },
  { value: "black_fox_concrete_pumping", label: "Black Fox Concrete Pumping" },
] as const;

export default function AddressBookView({
  contactsByCompany,
}: {
  contactsByCompany: Record<string, Contact[]>;
}) {
  return (
    <>
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
              <ContactsSection contacts={list} />
            </div>
          </details>
        );
      })}
    </>
  );
}
