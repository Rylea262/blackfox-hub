import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import ChatView, { type ChatNote } from "./chat-view";
import {
  dayBoundsUtc,
  isValidYmd,
  todayInBrisbane,
} from "./date-helpers";

export default async function OfficeNotesPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const { user, role } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const today = todayInBrisbane();
  const requested = searchParams.date;
  const selectedDate =
    requested && isValidYmd(requested) ? requested : today;

  const { start, end } = dayBoundsUtc(selectedDate);

  const { data: notes } = await supabase
    .from("office_notes")
    .select(
      "id, user_id, subject, body, created_at, updated_at, users(name, email)",
    )
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });

  const rows = (notes ?? []) as unknown as ChatNote[];

  return (
    <ChatView
      notes={rows}
      currentUserId={user.id}
      currentRole={role}
      selectedDate={selectedDate}
      today={today}
    />
  );
}
