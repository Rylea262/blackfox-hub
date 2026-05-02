"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { POSITIONS } from "@/lib/employees/constants";

const VALID_ROLES = ["owner", "office", "leading_hand"] as const;
const VALID_POSITIONS: string[] = POSITIONS.map((p) => p.value);

export async function updateEmployee(
  employeeId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim() || null;
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

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: "Invalid role" };
  }
  if (position !== null && !VALID_POSITIONS.includes(position)) {
    return { error: "Invalid position" };
  }
  if (pay_type !== null && pay_type !== "hourly" && pay_type !== "salary") {
    return { error: "Invalid pay type" };
  }

  const update: Record<string, string | number | null> = {
    name,
    position,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    start_date,
    notes,
    address,
    pay_type,
    pay_amount,
  };

  // You can edit anyone's contact details (including your own), but you
  // can't change your own role.
  if (employeeId !== user.id) {
    update.role = role;
  }

  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/employees");
}
