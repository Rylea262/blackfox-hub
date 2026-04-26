"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addNote } from "./note-actions";

type NoteAuthor = { name: string | null; email: string } | null;

export type NoteRow = {
  id: string;
  body: string;
  created_at: string;
  users: NoteAuthor | NoteAuthor[];
};

function authorOf(note: NoteRow): string {
  const u = Array.isArray(note.users) ? note.users[0] : note.users;
  if (!u) return "Unknown";
  return u.name?.trim() || u.email;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotesSection({
  jobId,
  notes,
}: {
  jobId: string;
  notes: NoteRow[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isPending) return;
    setError(null);
    const fd = new FormData();
    fd.set("body", trimmed);
    startTransition(async () => {
      const result = await addNote(jobId, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about this job..."
          rows={3}
          className="resize-y rounded border border-neutral-300 p-2 text-sm"
          disabled={isPending}
        />
        {error && (
          <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!body.trim() || isPending}
          className="self-start rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add note"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-neutral-500">No notes yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {notes.map((n) => (
            <li key={n.id} className="py-3">
              <div className="flex items-baseline justify-between gap-3 text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">
                  {authorOf(n)}
                </span>
                <span>{formatTimestamp(n.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
