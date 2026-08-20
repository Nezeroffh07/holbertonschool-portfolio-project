"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FolderKanban,
  ShieldCheck,
  Ban,
  Trash2,
  Wrench,
  Search,
} from "lucide-react";
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

type AdminProject = {
  id: number;
  title: string;
  owner_id: number;
  open_positions: number;
  status: string;
};

type Skill = {
  id: number;
  name: string;
};

type Tab = "users" | "projects" | "skills";

export default function AdminPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("users");

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState("");

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

    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnız brauzerdə mövcuddur (SSR-də yoxdur)
    setIsAdmin(true);
    setChecking(false);
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadStats() {
      try {
        const response = await fetch(`${API_URL}/admin/stats`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error();
        setStats(await response.json());
      } catch {
        setStatsError("Statistics could not be loaded.");
      }
    }

    loadStats();
  }, [isAdmin]);

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
              Platform statistics and moderation.
            </p>

            {statsError && (
              <p className="mt-8 text-destructive">{statsError}</p>
            )}

            {stats && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Users} label="Total Users" value={stats.total_users} />
                <StatCard icon={Ban} label="Blocked Users" value={stats.blocked_users} />
                <StatCard icon={FolderKanban} label="Total Projects" value={stats.total_projects} />
                <StatCard icon={ShieldCheck} label="Open Projects" value={stats.open_projects} />
              </div>
            )}

            <div className="mt-10 flex gap-2 border-b border-border">
              {(
                [
                  ["users", "Users"],
                  ["projects", "Projects"],
                  ["skills", "Skills"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
                    tab === value
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {tab === "users" && <UsersTab />}
              {tab === "projects" && <ProjectsTab />}
              {tab === "skills" && <SkillsTab onChanged={() => setStats((s) => s)} />}
            </div>
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/* ---------------- Users ---------------- */

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (query: string) => {
    setError("");
    try {
      const qs = query ? `?search=${encodeURIComponent(query)}` : "";
      const response = await fetch(`${API_URL}/admin/users${qs}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error();
      setUsers(await response.json());
    } catch {
      setError("Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Yazarkən hər hərfə serverə sorğu getməsin — kiçik gecikmə ilə
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  async function toggleBlock(userId: number, block: boolean) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_blocked: block }),
      });
      if (!response.ok) return;

      const updated: AdminUser = await response.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      // uğursuz olarsa, siyahı köhnə vəziyyətdə qalır
    }
  }

  return (
    <div>
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Search by username or email…"
      />

      {loading && <p className="mt-4 text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-destructive">{error}</p>}

      {!loading && !error && (
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">
                    {u.username}
                    {u.is_admin && (
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
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
                        onClick={() => toggleBlock(u.id, !u.is_blocked)}
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
      )}
    </div>
  );
}

/* ---------------- Projects ---------------- */

function ProjectsTab() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (query: string) => {
    setError("");
    try {
      const qs = query ? `?search=${encodeURIComponent(query)}` : "";
      const response = await fetch(`${API_URL}/admin/projects${qs}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error();
      setProjects(await response.json());
    } catch {
      setError("Projects could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  async function deleteProject(projectId: number, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_URL}/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch {
      // uğursuz olarsa, siyahı köhnə vəziyyətdə qalır
    }
  }

  return (
    <div>
      <SearchBox value={search} onChange={setSearch} placeholder="Search by title…" />

      {loading && <p className="mt-4 text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Positions</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No projects found.
                  </td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">#{p.owner_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === "open" ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.open_positions}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteProject(p.id, p.title)}
                      className="inline-flex items-center gap-1 rounded-lg border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Skills ---------------- */

function SkillsTab({ onChanged }: { onChanged: () => void }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [skillError, setSkillError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/skills`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error();
      setSkills(await response.json());
    } catch {
      setError("Skills could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load asyncdır, ilkin data fetch
    load();
  }, [load]);

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    setSkillError("");
    const name = newSkillName.trim();
    if (!name) return;

    try {
      const response = await fetch(`${API_URL}/skills`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setSkillError(data?.detail || "Skill could not be added.");
        return;
      }

      const created: Skill = await response.json();
      setSkills((prev) => [...prev, created]);
      setNewSkillName("");
      onChanged();
    } catch {
      setSkillError("Skill could not be added.");
    }
  }

  async function deleteSkill(skillId: number, name: string) {
    if (
      !window.confirm(
        `Delete "${name}"? It will be removed from all profiles and projects.`,
      )
    )
      return;

    try {
      const response = await fetch(`${API_URL}/admin/skills/${skillId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      onChanged();
    } catch {
      // uğursuz olarsa, siyahı köhnə vəziyyətdə qalır
    }
  }

  return (
    <div>
      <form onSubmit={addSkill} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          placeholder="e.g. Python"
          maxLength={50}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Wrench className="h-3.5 w-3.5" />
          Add skill
        </button>
        {skillError && <span className="text-xs text-destructive">{skillError}</span>}
      </form>

      {loading && <p className="mt-4 text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.length === 0 && (
            <p className="text-sm text-muted-foreground">No skills yet.</p>
          )}
          {skills.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-1.5 text-sm text-foreground"
            >
              {s.name}
              <button
                type="button"
                aria-label={`Delete ${s.name}`}
                onClick={() => deleteSkill(s.id, s.name)}
                className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Ortaq ---------------- */

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground"
      />
    </div>
  );
}