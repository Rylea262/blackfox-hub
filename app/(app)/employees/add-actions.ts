"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { parseDateInput } from "@/lib/format/date";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;
type Size = (typeof VALID_SIZES)[number];

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
  const qleave_number =
    String(formData.get("qleave_number") ?? "").trim() || null;
  const shirtRaw = String(formData.get("shirt_size") ?? "").trim();
  const shirt_size = shirtRaw === "" ? null : (shirtRaw as Size);
  const shortsRaw = String(formData.get("shorts_size") ?? "").trim();
  const shorts_size = shortsRaw === "" ? null : (shortsRaw as Size);
  const jacketRaw = String(formData.get("jacket_size") ?? "").trim();
  const jacket_size = jacketRaw === "" ? null : (jacketRaw as Size);
  if (shirt_size !== null && !VALID_SIZES.includes(shirt_size)) {
    return { error: "Invalid shirt size" };
  }
  if (shorts_size !== null && !VALID_SIZES.includes(shorts_size)) {
    return { error: "Invalid shorts size" };
  }
  if (jacket_size !== null && !VALID_SIZES.includes(jacket_size)) {
    return { error: "Invalid jacket size" };
  }
  const companyRaw = String(formData.get("company") ?? "").trim();
  const company = companyRaw === "" ? null : companyRaw;
  const VALID_COMPANIES = [
    "black_fox_industries",
    "black_fox_concrete_pumping",
    "black_fox_barbers",
  ];
  if (company !== null && !VALID_COMPANIES.includes(company)) {
    return { error: "Invalid company" };
  }
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

  if (email && !EMAIL_RE.test(email)) {
    return { error: "Email looks invalid" };
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

  // Data-only employee record. No auth.users row is created here, so
  // the new user can't log in. If they ever sign up via Supabase Auth
  // with this same email, the handle_new_user trigger will link their
  // auth record to this row by updating its id.
  // role is no longer captured in the register UI but the DB column
  // is NOT NULL — default new rows to 'leading_hand' so the insert
  // succeeds. Access level can be changed elsewhere if needed.
  const insert: Record<string, string | number | null> = {
    id: randomUUID(),
    role: "leading_hand",
  };
  if (email) insert.email = email;
  if (name) insert.name = name;
  if (position !== null) insert.position = position;
  if (phone) insert.phone = phone;
  if (emergency_contact_name) insert.emergency_contact_name = emergency_contact_name;
  if (emergency_contact_phone) insert.emergency_contact_phone = emergency_contact_phone;
  if (start_date) insert.start_date = start_date;
  if (date_of_birth) insert.date_of_birth = date_of_birth;
  if (notes) insert.notes = notes;
  if (address) insert.address = address;
  if (licence_number) insert.licence_number = licence_number;
  if (white_card_number) insert.white_card_number = white_card_number;
  if (licence_expiry) insert.licence_expiry = licence_expiry;
  if (employment_type !== null) insert.employment_type = employment_type;
  if (abn_number) insert.abn_number = abn_number;
  if (tfn_number) insert.tfn_number = tfn_number;
  if (pay_type !== null) insert.pay_type = pay_type;
  if (pay_amount !== null) insert.pay_amount = pay_amount;
  if (qleave_number) insert.qleave_number = qleave_number;
  if (shirt_size) insert.shirt_size = shirt_size;
  if (shorts_size) insert.shorts_size = shorts_size;
  if (jacket_size) insert.jacket_size = jacket_size;
  if (company) insert.company = company;

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
