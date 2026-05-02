"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { POSITIONS } from "@/lib/employees/constants";

const VALID_ROLES = ["owner", "office", "leading_hand"] as const;
const VALID_POSITIONS: string[] = POSITIONS.map((p) => p.value);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addEmployee(
  formData: FormData,
): Promise<{ error?: string; inviteLink?: string } | void> {
  await requireRole(["owner", "office"]);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "leading_hand");
  const positionRaw = String(formData.get("position") ?? "").trim();
  const position = positionRaw === "" ? null : positionRaw;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const emergency_contact_name =
    String(formData.get("emergency_contact_name") ?? "").trim() || null;
  const emergency_contact_phone =
    String(formData.get("emergency_contact_phone") ?? "").trim() || null;
  const startDateRaw = String(formData.get("start_date") ?? "").trim();
  const start_date = startDateRaw || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const sendInvite = formData.get("send_invite") === "on";

  if (!email) return { error: "Email is required" };
  if (!EMAIL_RE.test(email)) return { error: "Email looks invalid" };
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: "Invalid role" };
  }
  if (position !== null && !VALID_POSITIONS.includes(position)) {
    return { error: "Invalid position" };
  }

  // Insert the public.users row first (data-only). If an invite is also
  // requested, the auth.users insert below fires the handle_new_user
  // trigger which upserts by email and links this row's id to the new
  // auth record — role/name/position are preserved.
  const insert: Record<string, string | null> = {
    id: randomUUID(),
    email,
    role,
  };
  if (name) insert.name = name;
  if (position !== null) insert.position = position;
  if (phone) insert.phone = phone;
  if (emergency_contact_name) insert.emergency_contact_name = emergency_contact_name;
  if (emergency_contact_phone) insert.emergency_contact_phone = emergency_contact_phone;
  if (start_date) insert.start_date = start_date;
  if (notes) insert.notes = notes;

  const admin = createAdminClient();
  const { error } = await admin.from("users").insert(insert);

  if (error) {
    if (error.code === "23505") {
      return { error: "An employee with this email already exists" };
    }
    return { error: error.message };
  }

  if (sendInvite) {
    // generateLink creates the auth.users row and returns a link the
    // admin can copy and share manually. This avoids dependency on SMTP
    // configuration for the invite email to actually deliver.
    const { data: linkData, error: inviteError } =
      await admin.auth.admin.generateLink({ type: "invite", email });
    if (inviteError) {
      return {
        error: `Employee added, but invite failed: ${inviteError.message}`,
      };
    }
    revalidatePath("/employees");
    return { inviteLink: linkData.properties?.action_link };
  }

  revalidatePath("/employees");
}
