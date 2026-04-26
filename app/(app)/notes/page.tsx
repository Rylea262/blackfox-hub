import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import ChatView, { type ChatNote } from "./chat-view";

export default async function OfficeNotesPage() {
  const { user, role } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: notes } = await supabase
    .from("office_notes")
    .select(
      "id, user_id, subject, body, created_at, updated_at, users(name, email)",
    )
    .order("created_at", { ascending: true });

  const rows = (notes ?? []) as unknown as ChatNote[];

  return (
    <ChatView
      notes={rows}
      currentUserId={user.id}
      currentRole={role}
    />
  );
}
