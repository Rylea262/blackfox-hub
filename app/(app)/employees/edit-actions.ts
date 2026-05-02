"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function updateEmployee(
  employeeId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim() || null;
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
  const licence_number =
    String(formData.get("licence_number") ?? "").trim() || null;
  const white_card_number =
    String(formData.get("white_card_number") ?? "").trim() || null;
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

  if (pay_type !== null && pay_type !== "hourly" && pay_type !== "salary") {
    return { error: "Invalid pay type" };
  }

  // role is intentionally omitted — access level is managed elsewhere
  // (or, in practice, left at the DB default for now).
  const update: Record<string, string | number | null> = {
    name,
    position,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    start_date,
    notes,
    address,
    licence_number,
    white_card_number,
    pay_type,
    pay_amount,
  };

  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/employees");
}
