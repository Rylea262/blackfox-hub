"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import {
  addDays,
  dayBoundsUtc,
  formatDateLong,
  isValidYmd,
} from "./date-helpers";

const SYSTEM_PROMPT = `You are summarising a week of internal office notes for Black Fox Industries, an Australian construction business. Produce a concise dot-point summary grouped by theme where it makes sense (jobs, suppliers, employees, admin). Use Australian English and keep it brief — aim for 5 to 12 bullets total. If a topic recurs across multiple days, mention that. If there's nothing notable, say "Nothing significant this week."`;

type NoteRow = {
  body: string;
  created_at: string;
  users: { name: string | null; email: string } | { name: string | null; email: string }[] | null;
};

function authorOf(row: NoteRow): string {
  const u = Array.isArray(row.users) ? row.users[0] : row.users;
  if (!u) return "Unknown";
  return u.name?.trim() || u.email;
}

export async function getWeeklySummary(
  anchorDate: string,
): Promise<{ summary?: string; error?: string }> {
  await requireRole(["owner", "office"]);
  if (!isValidYmd(anchorDate)) return { error: "Invalid date" };
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "ANTHROPIC_API_KEY is not set. Add it to Railway (and .env.local) and try again.",
    };
  }

  const weekStart = addDays(anchorDate, -6);
  const { start: startUtc } = dayBoundsUtc(weekStart);
  const { end: endUtc } = dayBoundsUtc(anchorDate);

  const supabase = createClient();
  const { data: rawNotes, error } = await supabase
    .from("office_notes")
    .select("body, created_at, users(name, email)")
    .gte("created_at", startUtc)
    .lte("created_at", endUtc)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  const notes = (rawNotes ?? []) as unknown as NoteRow[];

  if (notes.length === 0) {
    return { summary: "No notes posted this week yet." };
  }

  let notesText = "";
  let lastDay = "";
  for (const n of notes) {
    const dayLabel = new Date(n.created_at).toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    if (dayLabel !== lastDay) {
      notesText += `\n\n## ${dayLabel}`;
      lastDay = dayLabel;
    }
    notesText += `\n- (${authorOf(n)}) ${n.body.trim()}`;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Office notes from ${formatDateLong(weekStart)} through ${formatDateLong(anchorDate)}:\n${notesText}\n\nWrite the dot-point summary now.`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) return { error: "Empty response from Claude." };
    return { summary: text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Claude API call failed";
    return { error: msg };
  }
}
