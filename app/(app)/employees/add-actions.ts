"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { POSITIONS } from "@/lib/employees/constants";

const VALID_ROLES = ["owner", "office", "leading_hand"] as const;
const VALID_POSITIONS: string[] = POSITIONS.map((p) => p.value);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addEmployee(
  formData: FormData,
): Promise<{ error?: string } | void> {
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

  if (!email) return { error: "Email is required" };
  if (!EMAIL_RE.test(email)) return { error: "Email looks invalid" };
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: "Invalid role" };
  }
  if (position !== null && !VALID_POSITIONS.includes(position)) {
    return { error: "Invalid position" };
  }

  // Data-only employee record. No auth.users row is created here, so
  // the new user can't log in. If they ever sign up via Supabase Auth
  // with this same email, the handle_new_user trigger will link their
  // auth record to this row by updating its id.
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

  const supabase = createClient();
  const { error } = await supabase.from("users").insert(insert);

  if (error) {
    if (error.code === "23505") {
      return { error: "An employee with this email already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/employees");
}
