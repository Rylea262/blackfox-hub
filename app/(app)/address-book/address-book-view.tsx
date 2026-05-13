"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ContactsSection, { type Contact } from "./contacts-section";
import { addSender, deleteSender, updateSender } from "./sender-actions";

export type Sender = { id: string; email: string };

const BF_GROUPS = [
  { value: "black_fox_industries", label: "Black Fox Industries" },
  { value: "black_fox_concrete_pumping", label: "Black Fox Concrete Pumping" },
] as const;

export default function AddressBookView({
  contactsByCompany,
  senders,
}: {
  contactsByCompany: Record<string, Contact[]>;
  senders: Sender[];
}) {
  const router = useRouter();
  const [sender, setSender] = useState(senders[0]?.email ?? "");
  const [mode, setMode] = useState<"bcc" | "cc">("bcc");
  const [manageOpen, setManageOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const value = newEmail.trim();
    if (!value) return;
    const fd = new FormData();
    fd.set("email", value);
    startTransition(async () => {
      const result = await addSender(fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setNewEmail("");
      refresh();
    });
  }

  function startEdit(s: Sender) {
    setEditingId(s.id);
    setEditingEmail(s.email);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingEmail("");
  }

  function saveEdit(id: string) {
    const value = editingEmail.trim();
    if (!value) return;
    const fd = new FormData();
    fd.set("email", value);
    startTransition(async () => {
      const result = await updateSender(id, fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      cancelEdit();
      refresh();
    });
  }

  function remove(s: Sender) {
    if (!confirm(`Delete sender "${s.email}"?`)) return;
    startTransition(async () => {
      const result = await deleteSender(s.id);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (sender === s.email) {
        const next = senders.find((x) => x.id !== s.id);
        setSender(next?.email ?? "");
      }
      refresh();
    });
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded border border-neutral-200 bg-white p-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-neutral-500">From</span>
          <select
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="rounded border border-neutral-300 p-1.5 text-sm"
            disabled={senders.length === 0}
          >
            {senders.length === 0 && (
              <option value="">No senders — add one</option>
            )}
            {senders.map((s) => (
              <option key={s.id} value={s.email}>
                {s.email}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setManageOpen((v) => !v)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50"
          >
            {manageOpen ? "Done" : "Manage"}
          </button>
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
          <span className="font-mono">{sender || "—"}</span> in your mail app
        </span>
      </div>

      {manageOpen && (
        <div className="mt-2 rounded border border-neutral-200 bg-neutral-50 p-3 text-sm">
          <div className="font-semibold">Manage sender emails</div>
          <p className="mt-1 text-xs text-neutral-500">
            These appear in the From dropdown above. Most mail apps ignore the
            sender hint in mailto links, so this list is a reminder to switch
            From in your mail app.
          </p>

          <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new-sender@example.com"
              className="flex-1 rounded border border-neutral-300 p-1.5 text-sm"
              disabled={isPending}
              required
            />
            <button
              type="submit"
              disabled={isPending || !newEmail.trim()}
              className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              Add sender
            </button>
          </form>

          {error && (
            <p className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <ul className="mt-3 flex flex-col divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
            {senders.length === 0 && (
              <li className="px-3 py-2 text-xs text-neutral-500">
                No sender emails yet.
              </li>
            )}
            {senders.map((s) => {
              const isEditing = editingId === s.id;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2"
                >
                  {isEditing ? (
                    <>
                      <input
                        type="email"
                        value={editingEmail}
                        onChange={(e) => setEditingEmail(e.target.value)}
                        className="flex-1 rounded border border-neutral-300 p-1 text-sm"
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(s.id)}
                        disabled={isPending || !editingEmail.trim()}
                        className="rounded bg-black px-2 py-1 text-xs text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-mono text-sm">
                        {s.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        disabled={isPending}
                        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(s)}
                        disabled={isPending}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
