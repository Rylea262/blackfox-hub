import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import AddNoteButton from "./add-note-button";
import EditNoteButton from "./edit-note-button";
import DeleteNoteButton from "./delete-note-button";

type NoteAuthor = { name: string | null; email: string } | null;

type NoteRow = {
  id: string;
  user_id: string;
  subject: string | null;
  body: string;
  created_at: string;
  updated_at: string;
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

export default async function OfficeNotesPage() {
  const { user, role } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: notes, error } = await supabase
    .from("office_notes")
    .select(
      "id, user_id, subject, body, created_at, updated_at, users(name, email)",
    )
    .order("created_at", { ascending: false });

  const rows = (notes ?? []) as unknown as NoteRow[];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Shared office log. Anyone in the office can add entries.
          </p>
        </div>
        <AddNoteButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No notes yet. Add the first one.
        </p>
      )}

      {rows.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-neutral-500">
              <th className="py-2">Date</th>
              <th className="py-2">Author</th>
              <th className="py-2">Subject</th>
              <th className="py-2">Body</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => {
              const canEdit = role === "owner" || n.user_id === user.id;
              return (
                <tr key={n.id} className="border-b align-top">
                  <td className="py-2 whitespace-nowrap text-xs text-neutral-600">
                    {formatTimestamp(n.created_at)}
                    {n.updated_at !== n.created_at && (
                      <span
                        className="ml-1 text-neutral-400"
                        title={`Edited ${formatTimestamp(n.updated_at)}`}
                      >
                        (edited)
                      </span>
                    )}
                  </td>
                  <td className="py-2">{authorOf(n)}</td>
                  <td className="py-2 font-medium">
                    {n.subject ?? "—"}
                  </td>
                  <td className="py-2 whitespace-pre-wrap">{n.body}</td>
                  <td className="py-2">
                    {canEdit ? (
                      <div className="flex flex-col items-start gap-1">
                        <EditNoteButton
                          note={{
                            id: n.id,
                            subject: n.subject,
                            body: n.body,
                          }}
                        />
                        <DeleteNoteButton noteId={n.id} />
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
