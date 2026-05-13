import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import AddContactButton from "./add-contact-button";
import AddressBookView, { type Sender } from "./address-book-view";
import type { Contact } from "./contacts-section";

export default async function AddressBookPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const [contactsRes, sendersRes] = await Promise.all([
    supabase
      .from("address_book_contacts")
      .select(
        "id, bf_company, name, company, position, email, phone, notes, category",
      )
      .order("name", { ascending: true }),
    supabase
      .from("address_book_senders")
      .select("id, email")
      .order("email", { ascending: true }),
  ]);

  const contacts = (contactsRes.data ?? []) as Contact[];
  const senders = (sendersRes.data ?? []) as Sender[];
  const error = contactsRes.error ?? sendersRes.error;

  const contactsByCompany: Record<string, Contact[]> = {};
  for (const c of contacts) {
    (contactsByCompany[c.bf_company] ??= []).push(c);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Address book</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Client and partner contacts grouped by Black Fox company.
            Use the checkboxes to BCC or CC a group.
          </p>
        </div>
        <AddContactButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <AddressBookView
        contactsByCompany={contactsByCompany}
        senders={senders}
      />
    </main>
  );
}
