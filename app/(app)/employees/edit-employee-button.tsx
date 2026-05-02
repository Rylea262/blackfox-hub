"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmployee } from "./edit-actions";
import { POSITIONS } from "@/lib/employees/constants";

const ROLES = [
  { value: "leading_hand", label: "Onsite" },
  { value: "office", label: "Office" },
  { value: "owner", label: "Owner" },
];

export type EmployeeForEdit = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  position: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  start_date: string | null;
  notes: string | null;
  address: string | null;
  pay_type: string | null;
  pay_amount: number | string | null;
};

export default function EditEmployeeButton({
  employee,
  isSelf,
}: {
  employee: EmployeeForEdit;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateEmployee(employee.id, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs hover:bg-neutral-50"
      >
        Edit
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Edit employee</h2>
            <p className="mt-1 text-xs text-neutral-500">{employee.email}</p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Name
                <input
                  type="text"
                  name="name"
                  defaultValue={employee.name ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Role
                  <select
                    name="role"
                    defaultValue={employee.role}
                    disabled={isPending || isSelf}
                    title={
                      isSelf ? "You can't change your own role" : undefined
                    }
                    className="rounded border p-2 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Position
                  <select
                    name="position"
                    defaultValue={employee.position ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  >
                    <option value="">—</option>
                    {POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Phone
                <input
                  type="tel"
                  name="phone"
                  defaultValue={employee.phone ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Emergency contact name
                  <input
                    type="text"
                    name="emergency_contact_name"
                    defaultValue={employee.emergency_contact_name ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Emergency contact phone
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    defaultValue={employee.emergency_contact_phone ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Start date
                <input
                  type="date"
                  name="start_date"
                  defaultValue={employee.start_date ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Address
                <input
                  type="text"
                  name="address"
                  defaultValue={employee.address ?? ""}
                  className="rounded border p-2"
                  disabled={isPending}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex w-36 flex-col gap-1 text-sm">
                  Pay type
                  <select
                    name="pay_type"
                    defaultValue={employee.pay_type ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  >
                    <option value="">—</option>
                    <option value="hourly">Hourly rate</option>
                    <option value="salary">Salary</option>
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Amount (AUD)
                  <input
                    type="number"
                    name="pay_amount"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={employee.pay_amount ?? ""}
                    className="rounded border p-2"
                    disabled={isPending}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Notes
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={employee.notes ?? ""}
                  className="resize-y rounded border p-2"
                  disabled={isPending}
                />
              </label>
              {error && (
                <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={isPending}
                  className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
