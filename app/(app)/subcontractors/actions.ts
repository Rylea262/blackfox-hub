"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { parseDateInput } from "@/lib/format/date";

const VALID_TYPES = ["sole_trader", "company"] as const;
type SubType = (typeof VALID_TYPES)[number];

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

function readFields(formData: FormData) {
  const type = String(formData.get("type") ?? "").trim() as SubType | "";
  const name = String(formData.get("name") ?? "").trim();
  const contact_person =
    String(formData.get("contact_person") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const abn = String(formData.get("abn") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { type, name, contact_person, phone, email, address, abn, notes };
}

export async function addSubcontractor(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const { user } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readFields(formData);
  if (!fields.name) return { error: "Name is required" };
  if (!VALID_TYPES.includes(fields.type as SubType)) {
    return { error: "Pick a type" };
  }

  const pl = parseDateField(
    String(formData.get("public_liability_expiry") ?? ""),
    "Public liability expiry",
  );
  if ("error" in pl) return { error: pl.error };

  const wc = parseDateField(
    String(formData.get("workcover_expiry") ?? ""),
    "Workcover expiry",
  );
  if ("error" in wc) return { error: wc.error };

  const { data, error } = await supabase
    .from("subcontractors")
    .insert({
      ...fields,
      public_liability_expiry: pl.value,
      workcover_expiry: wc.value,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Insert returned no row" };

  revalidatePath("/subcontractors");
  return { id: data.id };
}

export async function updateSubcontractor(
  subId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const fields = readFields(formData);
  if (!fields.name) return { error: "Name is required" };
  if (!VALID_TYPES.includes(fields.type as SubType)) {
    return { error: "Pick a type" };
  }

  const pl = parseDateField(
    String(formData.get("public_liability_expiry") ?? ""),
    "Public liability expiry",
  );
  if ("error" in pl) return { error: pl.error };

  const wc = parseDateField(
    String(formData.get("workcover_expiry") ?? ""),
    "Workcover expiry",
  );
  if ("error" in wc) return { error: wc.error };

  const { error } = await supabase
    .from("subcontractors")
    .update({
      ...fields,
      public_liability_expiry: pl.value,
      workcover_expiry: wc.value,
    })
    .eq("id", subId);

  if (error) return { error: error.message };

  revalidatePath("/subcontractors");
}

export async function deleteSubcontractor(
  subId: string,
): Promise<{ error?: string } | void> {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: docs } = await supabase
    .from("subcontractor_documents")
    .select("file_url")
    .eq("subcontractor_id", subId);

  const { error } = await supabase
    .from("subcontractors")
    .delete()
    .eq("id", subId);
  if (error) return { error: error.message };

  const paths = (docs ?? [])
    .map((d) => d.file_url)
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    const { error: removeErr } = await supabase.storage
      .from("subcontractor-documents")
      .remove(paths);
    if (removeErr) {
      console.error(
        `Storage cleanup failed for subcontractor ${subId}: ${removeErr.message}`,
      );
    }
  }

  revalidatePath("/subcontractors");
}
