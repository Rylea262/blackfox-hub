import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import {
  TOOL_CATEGORY_LABELS,
  TOOL_CATEGORY_ORDER,
} from "@/lib/tools/constants";
import AddToolButton from "./add-tool-button";
import EditToolButton from "./edit-tool-button";
import DeleteToolButton from "./delete-tool-button";

type Tool = {
  id: string;
  name: string;
  category: string;
  serial_number: string | null;
  location: string | null;
  notes: string | null;
  next_service_due: string | null;
  created_at: string;
};

type DueStatus = "overdue" | "soon" | "ok" | "none";

function categoryLabel(value: string): string {
  return TOOL_CATEGORY_LABELS[value] ?? value;
}

function compareCategories(a: string, b: string): number {
  const aIdx = TOOL_CATEGORY_ORDER.indexOf(a);
  const bIdx = TOOL_CATEGORY_ORDER.indexOf(b);
  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
  if (aIdx !== -1) return -1;
  if (bIdx !== -1) return 1;
  return categoryLabel(a).localeCompare(categoryLabel(b));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function dueStatus(iso: string | null): DueStatus {
  if (!iso) return "none";
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return "none";
  const days = Math.floor(
    (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "overdue";
  if (days < 30) return "soon";
  return "ok";
}

function dueClass(status: DueStatus): string {
  switch (status) {
    case "overdue":
      return "text-red-700 font-semibold";
    case "soon":
      return "text-orange-700 font-medium";
    case "ok":
      return "text-green-700";
    default:
      return "";
  }
}

export default async function ToolsPage() {
  await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: tools, error } = await supabase
    .from("tools")
    .select(
      "id, name, category, serial_number, location, notes, next_service_due, created_at",
    )
    .order("name", { ascending: true });

  const all = (tools ?? []) as Tool[];

  const grouped = new Map<string, Tool[]>();
  for (const t of all) {
    const arr = grouped.get(t.category);
    if (arr) arr.push(t);
    else grouped.set(t.category, [t]);
  }
  const categoryKeys = Array.from(grouped.keys()).sort(compareCategories);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tools and Equipment</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Register of company tools, grouped by category.
          </p>
        </div>
        <AddToolButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && all.length === 0 && (
        <p className="mt-6 rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No tools yet. Add the first one.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {categoryKeys.map((cat) => {
          const items = grouped.get(cat)!;
          const showService = cat === "lasers";
          return (
            <details
              key={cat}
              className="rounded border border-neutral-200 bg-white"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3">
                <span className="font-semibold">{categoryLabel(cat)}</span>
                <span className="text-xs text-neutral-500">
                  {items.length} {items.length === 1 ? "tool" : "tools"}
                </span>
              </summary>
              <div className="border-t border-neutral-200 p-4">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-neutral-500">
                      <th className="py-1.5">Name</th>
                      <th className="py-1.5">Serial</th>
                      <th className="py-1.5">Location</th>
                      {showService && (
                        <th className="py-1.5">Next service</th>
                      )}
                      <th className="py-1.5">Notes</th>
                      <th className="py-1.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => {
                      const status = dueStatus(t.next_service_due);
                      return (
                        <tr key={t.id} className="border-b align-top">
                          <td className="py-2">{t.name}</td>
                          <td className="py-2">{t.serial_number ?? "—"}</td>
                          <td className="py-2">{t.location ?? "—"}</td>
                          {showService && (
                            <td className={`py-2 ${dueClass(status)}`}>
                              {formatDate(t.next_service_due)}
                            </td>
                          )}
                          <td className="py-2 whitespace-pre-wrap">
                            {t.notes ?? "—"}
                          </td>
                          <td className="py-2">
                            <div className="flex flex-col items-start gap-1">
                              <EditToolButton
                                tool={{
                                  id: t.id,
                                  name: t.name,
                                  category: t.category,
                                  serial_number: t.serial_number,
                                  location: t.location,
                                  notes: t.notes,
                                  next_service_due: t.next_service_due,
                                }}
                              />
                              <DeleteToolButton
                                toolId={t.id}
                                toolName={t.name}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
