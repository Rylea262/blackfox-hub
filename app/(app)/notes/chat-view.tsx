"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addOfficeNote,
  deleteOfficeNote,
  updateOfficeNote,
} from "./actions";

type NoteAuthor = { name: string | null; email: string } | null;

export type ChatNote = {
  id: string;
  user_id: string;
  subject: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  users: NoteAuthor | NoteAuthor[];
};

function authorOf(note: ChatNote): string {
  const u = Array.isArray(note.users) ? note.users[0] : note.users;
  if (!u) return "Unknown";
  return u.name?.trim() || u.email;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatView({
  notes,
  currentUserId,
  currentRole,
}: {
  notes: ChatNote[];
  currentUserId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(notes.length);

  // Scroll to bottom on mount.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Scroll to bottom when a new message is added.
  useEffect(() => {
    if (notes.length > lastCountRef.current) {
      const el = scrollRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    }
    lastCountRef.current = notes.length;
  }, [notes.length]);

  function send() {
    const trimmed = body.trim();
    if (!trimmed || isPending) return;
    setError(null);
    const fd = new FormData();
    fd.set("body", trimmed);
    startTransition(async () => {
      const result = await addOfficeNote(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing
    ) {
      e.preventDefault();
      send();
    }
  }

  function startEdit(note: ChatNote) {
    setEditingId(note.id);
    setEditingBody(note.body);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingBody("");
    setEditError(null);
  }

  function saveEdit(noteId: string) {
    const trimmed = editingBody.trim();
    if (!trimmed || isPending) return;
    setEditError(null);
    const fd = new FormData();
    fd.set("body", trimmed);
    startTransition(async () => {
      const result = await updateOfficeNote(noteId, fd);
      if (result?.error) {
        setEditError(result.error);
        return;
      }
      setEditingId(null);
      setEditingBody("");
      router.refresh();
    });
  }

  function handleDelete(noteId: string) {
    const ok = window.confirm("Delete this message? This cannot be undone.");
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteOfficeNote(noteId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex h-[calc(100dvh-3.25rem)] flex-col">
      <header className="border-b border-neutral-200 px-6 py-3">
        <h1 className="text-lg font-bold">Notes</h1>
        <p className="text-xs text-neutral-500">
          Shared office log. Anyone in the office can post.
        </p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {notes.length === 0 ? (
          <p className="text-sm text-neutral-500">No messages yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {notes.map((n) => {
              const canEdit =
                currentRole === "owner" || n.user_id === currentUserId;
              const isEditing = editingId === n.id;
              return (
                <li key={n.id} className="group flex flex-col gap-1">
                  <div className="flex items-baseline gap-2 text-xs">
                    <span className="font-medium text-neutral-700">
                      {authorOf(n)}
                    </span>
                    <span className="text-neutral-500">
                      {formatTimestamp(n.created_at)}
                    </span>
                    {n.updated_at !== n.created_at && (
                      <span className="text-neutral-400">(edited)</span>
                    )}
                    {canEdit && !isEditing && (
                      <span className="ml-auto flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(n)}
                          className="text-xs text-neutral-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(n.id)}
                          disabled={isPending}
                          className="text-xs text-red-700 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </div>
                  {n.subject && !isEditing && (
                    <p className="text-sm font-semibold">{n.subject}</p>
                  )}
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingBody}
                        onChange={(e) => setEditingBody(e.target.value)}
                        rows={3}
                        autoFocus
                        className="resize-y rounded border border-neutral-300 p-2 text-sm"
                        disabled={isPending}
                      />
                      {editError && (
                        <p className="text-xs text-red-700">{editError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(n.id)}
                          disabled={!editingBody.trim() || isPending}
                          className="rounded bg-black px-2 py-0.5 text-xs text-white disabled:opacity-50"
                        >
                          {isPending ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isPending}
                          className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-neutral-200 bg-white px-6 py-3">
        {error && (
          <p className="mb-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…  (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="max-h-40 min-h-[2.5rem] flex-1 resize-y rounded border border-neutral-300 p-2 text-sm"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={send}
            disabled={!body.trim() || isPending}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {isPending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
