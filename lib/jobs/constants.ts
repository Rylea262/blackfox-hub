export const DOC_TYPES = [
  { value: "contract", label: "Contract" },
  { value: "plan", label: "Plan" },
  { value: "qbcc_cert", label: "QBCC Cert" },
  { value: "insurance", label: "Insurance" },
  { value: "supplier_invoice", label: "Supplier Invoice" },
  { value: "signed_quote", label: "Signed Quote" },
  { value: "other", label: "Other" },
] as const;

export const JOB_STATUSES = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
] as const;
