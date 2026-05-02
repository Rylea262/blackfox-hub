"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { parseDateInput } from "@/lib/format/date";

function parseDateField(
  value: string,
  label: string,
): { value: string | null } | { error: string } {
  const result = parseDateInput(value);
  if (result === "invalid") {
    return { error: `${label} must be DD/MM/YYYY` };
  }
  return { value: result };
}

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
  const startDateParsed = parseDateField(
    String(formData.get("start_date") ?? ""),
    "Start date",
  );
  if ("error" in startDateParsed) return { error: startDateParsed.error };
  const start_date = startDateParsed.value;

  const dobParsed = parseDateField(
    String(formData.get("date_of_birth") ?? ""),
    "Date of birth",
  );
  if ("error" in dobParsed) return { error: dobParsed.error };
  const date_of_birth = dobParsed.value;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const licence_number =
    String(formData.get("licence_number") ?? "").trim() || null;
  const white_card_number =
    String(formData.get("white_card_number") ?? "").trim() || null;
  const licenceExpiryParsed = parseDateField(
    String(formData.get("licence_expiry") ?? ""),
    "Licence expiry",
  );
  if ("error" in licenceExpiryParsed) return { error: licenceExpiryParsed.error };
  const licence_expiry = licenceExpiryParsed.value;
  const employmentTypeRaw = String(
    formData.get("employment_type") ?? "",
  ).trim();
  const employment_type = employmentTypeRaw === "" ? null : employmentTypeRaw;
  const abnRaw = String(formData.get("abn_number") ?? "").trim();
  const tfnRaw = String(formData.get("tfn_number") ?? "").trim();
  const abn_number = employment_type === "abn" && abnRaw ? abnRaw : null;
  const tfn_number =
    (employment_type === "full_time" || employment_type === "casual") && tfnRaw
      ? tfnRaw
      : null;
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
  if (
    employment_type !== null &&
    employment_type !== "full_time" &&
    employment_type !== "casual" &&
    employment_type !== "abn"
  ) {
    return { error: "Invalid employment type" };
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
    date_of_birth,
    notes,
    address,
    licence_number,
    white_card_number,
    licence_expiry,
    employment_type,
    abn_number,
    tfn_number,
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
