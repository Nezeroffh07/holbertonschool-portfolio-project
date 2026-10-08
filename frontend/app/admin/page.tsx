"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FolderKanban,
  ShieldCheck,
  Ban,
  Trash2,
  Wrench,
  Search,
  Briefcase,
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
  total_roles?: number;
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
  role_id?: number | null;
  role_name?: string | null;
};

type Role = {
  id: number;
  name: string;
  description?: string | null;
  skills?: Skill[];
};

type Tab = "users" | "projects" | "roles" | "skills";

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

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error();
      setStats(await response.json());
    } catch {
      setStatsError("Statistics could not be loaded.");
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
  }, [isAdmin, loadStats]);

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
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard icon={Users} label="Total Users" value={stats.total_users} />
                <StatCard icon={Ban} label="Blocked Users" value={stats.blocked_users} />
                <StatCard icon={FolderKanban} label="Total Projects" value={stats.total_projects} />
                <StatCard icon={ShieldCheck} label="Open Projects" value={stats.open_projects} />
                <StatCard icon={Briefcase} label="Total Roles" value={stats.total_roles ?? 0} />
                <StatCard icon={Wrench} label="Total Skills" value={stats.total_skills} />
              </div>
            )}

            <div className="mt-10 flex gap-2 border-b border-border">
              {(
                [
                  ["users", "Users"],
                  ["projects", "Projects"],
                  ["roles", "Roles"],
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
              {tab === "roles" && <RolesTab onChanged={loadStats} />}
              {tab === "skills" && (
                <SkillsTab
                  onChanged={loadStats}
                  onGoToRoles={() => setTab("roles")}
                />
              )}
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

/* ---------------- Roles ---------------- */

function RolesTab({ onChanged }: { onChanged?: () => void }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [roleError, setRoleError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/roles`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error();
      setRoles(await response.json());
    } catch {
      setError("Roles could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addRole(e: React.FormEvent) {
    e.preventDefault();
    setRoleError("");
    const name = newRoleName.trim();
    if (!name) {
      setRoleError("Please enter a role name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          description: newRoleDesc.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setRoleError(data?.detail || "Role could not be added.");
        return;
      }

      const created: Role = await response.json();
      setRoles((prev) => [...prev, created]);
      setNewRoleName("");
      setNewRoleDesc("");
      onChanged?.();
    } catch {
      setRoleError("Role could not be added.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteRole(roleId: number, name: string) {
    if (
      !window.confirm(
        `Delete "${name}"? It will be removed from all projects and applications.`,
      )
    )
      return;

    try {
      const response = await fetch(`${API_URL}/roles/${roleId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      onChanged?.();
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <form onSubmit={addRole} className="space-y-3 rounded-xl border border-border bg-card p-4 max-w-xl">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Add New Role
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Role name (e.g. Developer, Designer)"
            maxLength={50}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add role"}
          </button>
        </div>
        <input
          type="text"
          value={newRoleDesc}
          onChange={(e) => setNewRoleDesc(e.target.value)}
          placeholder="Role description (optional)"
          maxLength={200}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        {roleError && <p className="text-xs text-destructive">{roleError}</p>}
      </form>

      {loading && <p className="mt-4 text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 space-y-2 max-w-2xl">
          {roles.length === 0 && (
            <p className="text-sm text-muted-foreground">No roles created yet.</p>
          )}
          {roles.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{r.name}</p>
                {r.description && (
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Delete ${r.name}`}
                onClick={() => deleteRole(r.id, r.name)}
                className="rounded-lg border border-destructive/20 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Skills ---------------- */

function SkillsTab({
  onChanged,
  onGoToRoles,
}: {
  onChanged?: () => void;
  onGoToRoles?: () => void;
}) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [skillError, setSkillError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [skillsRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/skills`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/roles`, { headers: getAuthHeaders() }),
      ]);
      if (!skillsRes.ok) throw new Error();
      setSkills(await skillsRes.json());
      if (rolesRes.ok) {
        setRoles(await rolesRes.json());
      }
    } catch {
      setError("Skills could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    setSkillError("");
    const name = newSkillName.trim();
    if (!name) {
      setSkillError("Please enter a skill name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: { name: string; role_id?: number } = { name };
      if (selectedRoleId) {
        payload.role_id = Number(selectedRoleId);
      }

      const response = await fetch(`${API_URL}/skills`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setSkillError(data?.detail || "Skill could not be added.");
        return;
      }

      const created: Skill = await response.json();
      setSkills((prev) => [...prev, created]);
      setNewSkillName("");
      onChanged?.();
    } catch {
      setSkillError("Skill could not be added.");
    } finally {
      setIsSubmitting(false);
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
      onChanged?.();
    } catch {
      // ignore
    }
  }

  const skillsByRole = useMemo(() => {
    const map = new Map<number | "unassigned", Skill[]>();
    for (const s of skills) {
      const key = s.role_id ?? "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [skills]);

  return (
    <div>
      {roles.length === 0 && !loading && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              No roles created yet!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create a role first (e.g. Developer, Designer) to group your skills into roles.
            </p>
          </div>
          {onGoToRoles && (
            <button
              type="button"
              onClick={onGoToRoles}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Go to Roles
            </button>
          )}
        </div>
      )}

      <form onSubmit={addSkill} className="space-y-3 rounded-xl border border-border bg-card p-4 max-w-2xl">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          Add New Skill
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select Role (e.g. Developer)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill name (e.g. Java, Python, C)"
            maxLength={50}
            className="flex-1 min-w-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Wrench className="h-3.5 w-3.5" />
            {isSubmitting ? "Adding..." : "Add skill"}
          </button>
        </div>
        {skillError && <p className="text-xs text-destructive">{skillError}</p>}
      </form>

      {loading && <p className="mt-4 text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 space-y-4">
          {skills.length === 0 && (
            <p className="text-sm text-muted-foreground">No skills yet.</p>
          )}

          {/* Grouped by Role */}
          {roles.map((role) => {
            const roleSkills = skillsByRole.get(role.id) || [];
            return (
              <div key={role.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {role.name}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({roleSkills.length} {roleSkills.length === 1 ? "skill" : "skills"})
                    </span>
                  </h4>
                </div>
                {roleSkills.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No skills in this role yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {roleSkills.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-3 pr-1.5 text-xs text-foreground"
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
          })}

          {/* Unassigned skills */}
          {(skillsByRole.get("unassigned")?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
              <h4 className="font-semibold text-muted-foreground text-sm border-b border-border pb-2 mb-3">
                Unassigned Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillsByRole.get("unassigned")!.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-3 pr-1.5 text-xs text-foreground"
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
            </div>
          )}
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