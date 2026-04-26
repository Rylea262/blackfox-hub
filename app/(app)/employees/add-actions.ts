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
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "leading_hand");
  const positionRaw = String(formData.get("position") ?? "").trim();
  const position = positionRaw === "" ? null : positionRaw;

  if (!email) return { error: "Email is required" };
  if (!EMAIL_RE.test(email)) return { error: "Email looks invalid" };
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: "Invalid role" };
  }
  if (position !== null && !VALID_POSITIONS.includes(position)) {
    return { error: "Invalid position" };
  }

  // Data-only employee: a public.users row with a fresh UUID, no auth.users
  // entry. The user can't log in. If they later sign up via Supabase Auth
  // with this same email, the handle_new_user trigger will link their auth
  // record to this row by updating its id.
  const insert: Record<string, string | null> = {
    id: randomUUID(),
    email,
    role,
  };
  if (name) insert.name = name;
  if (position !== null) insert.position = position;

  const admin = createAdminClient();
  const { error } = await admin.from("users").insert(insert);

  if (error) {
    if (error.code === "23505") {
      return { error: "An employee with this email already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/employees");
}
