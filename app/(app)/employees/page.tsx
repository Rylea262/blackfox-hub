import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import RoleSelect from "./role-select";
import AddEmployeeButton from "./add-employee-button";

export default async function EmployeesPage() {
  const { user: currentUser } = await requireRole(["owner", "office"]);
  const supabase = createClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage user roles. New signups default to &ldquo;leading_hand&rdquo;
            until promoted.
          </p>
        </div>
        <AddEmployeeButton />
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {users && users.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.name?.trim() || "—"}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">
                  <RoleSelect
                    userId={u.id}
                    currentRole={u.role}
                    isSelf={u.id === currentUser.id}
                  />
                </td>
                <td className="py-2">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
