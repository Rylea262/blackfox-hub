import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import AddContactButton from "./add-contact-button";
import ContactsSection, { type Contact } from "./contacts-section";

const BF_GROUPS = [
  { value: "black_fox_industries", label: "Black Fox Industries" },
  { value: "black_fox_concrete_pumping", label: "Black Fox Concrete Pumping" },
] as const;

export default async function AddressBookPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("address_book_contacts")
    .select(
      "id, bf_company, name, company, position, email, phone, notes",
    )
    .order("name", { ascending: true });

  const contacts = (data ?? []) as Contact[];

  const byCompany = new Map<string, Contact[]>();
  for (const c of contacts) {
    const arr = byCompany.get(c.bf_company);
    if (arr) arr.push(c);
    else byCompany.set(c.bf_company, [c]);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Address book</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Client and partner contacts grouped by Black Fox company.
            Use the checkboxes to BCC a group.
          </p>
        </div>
        <AddContactButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {BF_GROUPS.map((group) => (
        <details
          key={group.value}
          open
          className="mt-4 rounded border border-neutral-200 bg-white"
        >
          <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3">
            <span className="text-base font-semibold">{group.label}</span>
            <span className="text-xs text-neutral-500">
              {(byCompany.get(group.value) ?? []).length}{" "}
              {(byCompany.get(group.value) ?? []).length === 1
                ? "contact"
                : "contacts"}
            </span>
          </summary>
          <div className="border-t border-neutral-200 p-4">
            <ContactsSection contacts={byCompany.get(group.value) ?? []} />
          </div>
        </details>
      ))}
    </main>
  );
}
