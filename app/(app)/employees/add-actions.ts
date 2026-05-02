"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addEmployee(
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
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
  const address = String(formData.get("address") ?? "").trim() || null;
  const payTypeRaw = String(formData.get("pay_type") ?? "").trim();
  const pay_type = payTypeRaw === "" ? null : payTypeRaw;
  const payAmountRaw = String(formData.get("pay_amount") ?? "").trim();
  let pay_amount: number | null = null;
  if (payAmountRaw) {
    const parsed = Number(payAmountRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Pay amount must be a non-negative number" };
    }
    pay_amount = parsed;
  }

  if (!email) return { error: "Email is required" };
  if (!EMAIL_RE.test(email)) return { error: "Email looks invalid" };
  if (pay_type !== null && pay_type !== "hourly" && pay_type !== "salary") {
    return { error: "Invalid pay type" };
  }

  // Data-only employee record. No auth.users row is created here, so
  // the new user can't log in. If they ever sign up via Supabase Auth
  // with this same email, the handle_new_user trigger will link their
  // auth record to this row by updating its id.
  // role is intentionally omitted — the public.users.role column has a
  // default of 'leading_hand', and access level is no longer part of
  // this register's UI.
  const insert: Record<string, string | number | null> = {
    id: randomUUID(),
    email,
  };
  if (name) insert.name = name;
  if (position !== null) insert.position = position;
  if (phone) insert.phone = phone;
  if (emergency_contact_name) insert.emergency_contact_name = emergency_contact_name;
  if (emergency_contact_phone) insert.emergency_contact_phone = emergency_contact_phone;
  if (start_date) insert.start_date = start_date;
  if (notes) insert.notes = notes;
  if (address) insert.address = address;
  if (pay_type !== null) insert.pay_type = pay_type;
  if (pay_amount !== null) insert.pay_amount = pay_amount;

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
