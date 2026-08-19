"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, FolderKanban, ShieldCheck, Ban } from "lucide-react";
import { API_URL, getAuthHeaders } from "@/lib/api";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

type User = {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
};

type Stats = {
  total_users: number;
  blocked_users: number;
  total_projects: number;
  open_projects: number;
  total_applications: number;
  total_skills: number;
};

type AdminUser = {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_blocked: boolean;
};

export default function AdminPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      router.replace("/login");
      return;
    }

    const user: User = JSON.parse(savedUser);

    if (!user.is_admin) {
      router.replace("/");
      return;
    }

    setIsAdmin(true);
    setChecking(false);
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadAdminData() {
      try {
        const [statsResponse, usersResponse] = await Promise.all([
          fetch(`${API_URL}/admin/stats`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/admin/users`, { headers: getAuthHeaders() }),
        ]);

        if (!statsResponse.ok || !usersResponse.ok) {
          throw new Error("Admin data could not be loaded.");
        }

        setStats(await statsResponse.json());
        setUsers(await usersResponse.json());
      } catch {
        setError("Admin data could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [isAdmin]);

  async function toggleBlock(userId: number, block: boolean) {
    try {
      const response = await fetch(
        `${API_URL}/admin/users/${userId}/block`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ is_blocked: block }),
        }
      );

      if (!response.ok) return;

      const updated: AdminUser = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch {
      // sadəcə uğursuz olarsa, siyahı köhnə vəziyyətdə qalır
    }
  }

  if (checking) {
    return null;
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold text-foreground">
              Admin Panel
            </h1>
            <p className="mt-2 text-muted-foreground">
              Platform statistics and user management.
            </p>

            {loading && (
              <p className="mt-8 text-muted-foreground">Loading...</p>
            )}

            {error && (
              <p className="mt-8 text-destructive">{error}</p>
            )}

            {!loading && !error && stats && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Total Users</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {stats.total_users}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ban className="h-4 w-4" />
                    <span className="text-sm">Blocked Users</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {stats.blocked_users}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FolderKanban className="h-4 w-4" />
                    <span className="text-sm">Total Projects</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {stats.total_projects}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-sm">Open Projects</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {stats.open_projects}
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-foreground">
                  Users
                </h2>

                <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-3 text-foreground">
                            {u.username}
                            {u.is_admin && (
                              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                Admin
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {u.email}
                          </td>
                          <td className="px-4 py-3">
                            {u.is_blocked ? (
                              <span className="text-destructive">Blocked</span>
                            ) : (
                              <span className="text-foreground">Active</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!u.is_admin && (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleBlock(u.id, !u.is_blocked)
                                }
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                  u.is_blocked
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "border border-destructive text-destructive hover:bg-destructive/10"
                                }`}
                              >
                                {u.is_blocked ? "Unblock" : "Block"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
