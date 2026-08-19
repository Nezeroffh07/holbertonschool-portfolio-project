"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Save,
  UserRound,
  Users,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API_URL, getAuthHeaders } from "@/lib/api";

type User = {
  id: number;
  username: string;
  email: string;
};

type Skill = {
  id: number;
  name: string;
};

type Profile = {
  full_name: string | null;
  faculty: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: Skill[];
};

type Project = {
  id: number;
  title: string;
  description: string;
  owner_id: number;
  status: string;
};

type TeamMember = {
  application_id: number;
  user_id: number;
  username: string;
  email: string;
  role: string | null;
  joined_at: string;
  profile: Profile | null;
};

export default function TeamMembersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [roles, setRoles] = useState<Record<number, string>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [savingUserId, setSavingUserId] = useState<
    number | null
  >(null);

  useEffect(() => {
    async function loadTeam() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          userResponse,
          projectResponse,
          teamResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/me`, {
            headers: getAuthHeaders(),
          }),

          fetch(`${API_URL}/projects/${projectId}`, {
            headers: getAuthHeaders(),
          }),

          fetch(`${API_URL}/projects/${projectId}/team`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (
          userResponse.status === 401 ||
          projectResponse.status === 401 ||
          teamResponse.status === 401
        ) {
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");

          router.replace("/login");
          return;
        }

        if (!userResponse.ok) {
          throw new Error(
            "Your account could not be loaded."
          );
        }

        if (!projectResponse.ok) {
          throw new Error(
            "Project could not be loaded."
          );
        }

        if (!teamResponse.ok) {
          const errorData = await teamResponse
            .json()
            .catch(() => null);

          throw new Error(
            typeof errorData?.detail === "string"
              ? errorData.detail
              : "Team members could not be loaded."
          );
        }

        const userData: User =
          await userResponse.json();

        const projectData: Project =
          await projectResponse.json();

        const teamData: Omit<
          TeamMember,
          "profile"
        >[] = await teamResponse.json();

        const membersWithProfiles =
          await Promise.all(
            teamData.map(async (member) => {
              try {
                const profileResponse = await fetch(
                  `${API_URL}/users/${member.user_id}/profile`,
                  {
                    headers: getAuthHeaders(),
                  }
                );

                if (!profileResponse.ok) {
                  return {
                    ...member,
                    profile: null,
                  };
                }

                const profile: Profile =
                  await profileResponse.json();

                return {
                  ...member,
                  profile,
                };
              } catch {
                return {
                  ...member,
                  profile: null,
                };
              }
            })
          );

        const initialRoles: Record<number, string> = {};

        membersWithProfiles.forEach((member) => {
          initialRoles[member.user_id] =
            member.role || "";
        });

        setCurrentUser(userData);
        setProject(projectData);
        setMembers(membersWithProfiles);
        setRoles(initialRoles);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Team members could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [projectId, router]);

  async function saveRole(member: TeamMember) {
    const role = roles[member.user_id]?.trim();

    setError("");
    setSuccessMessage("");

    if (!role) {
      setError("Please enter a role.");
      return;
    }

    setSavingUserId(member.user_id);

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/team/${member.user_id}/role`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            role,
          }),
        }
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");

        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof responseData?.detail === "string"
            ? responseData.detail
            : "Role could not be updated."
        );
      }

      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.user_id === member.user_id
            ? {
                ...currentMember,
                role: responseData.role || role,
              }
            : currentMember
        )
      );

      setSuccessMessage(
        `${member.username}'s role was updated.`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Role could not be updated."
      );
    } finally {
      setSavingUserId(null);
    }
  }

  const isProjectOwner =
    currentUser !== null &&
    project !== null &&
    currentUser.id === project.owner_id;

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>

            {loading && (
              <p className="mt-8 text-muted-foreground">
                Loading team members...
              </p>
            )}

            {error && (
              <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="mt-8 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
                {successMessage}
              </p>
            )}

            {!loading && project && (
              <>
                <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm font-medium text-primary">
                    {project.title}
                  </p>

                  <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        Team Members
                      </h1>

                      <p className="mt-3 max-w-3xl text-muted-foreground">
                        View accepted team members and
                        their roles.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-secondary px-3 py-1 text-sm font-medium capitalize text-secondary-foreground">
                      {project.status}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
                    <Users className="h-5 w-5" />

                    <p className="text-sm font-medium">
                      {members.length} accepted member
                      {members.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </section>

                {members.length === 0 && (
                  <section className="mt-8 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
                    <Users className="mx-auto h-8 w-8 text-primary" />

                    <h2 className="mt-4 text-xl font-semibold text-foreground">
                      No accepted members yet
                    </h2>

                    <p className="mt-2 text-muted-foreground">
                      Accepted applicants will appear here.
                    </p>
                  </section>
                )}

                {members.length > 0 && (
                  <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-foreground">
                      Accepted Members
                    </h2>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      {members.map((member) => {
                        const displayName =
                          member.profile?.full_name ||
                          member.username;

                        return (
                          <article
                            key={member.application_id}
                            className="rounded-xl border border-border bg-card p-5 shadow-sm"
                          >
                            <div className="flex items-start gap-4">
                              {member.profile?.avatar_url ? (
                                <img
                                  src={
                                    member.profile.avatar_url
                                  }
                                  alt={displayName}
                                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                  <UserRound className="h-6 w-6" />
                                </div>
                              )}

                              <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {displayName}
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                  @{member.username}
                                </p>

                                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-4 w-4 shrink-0" />

                                  <span className="truncate">
                                    {member.email}
                                  </span>
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                  {member.profile?.faculty ||
                                    "Faculty not provided"}
                                </p>
                              </div>
                            </div>

                            {member.profile?.bio && (
                              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                {member.profile.bio}
                              </p>
                            )}

                            {member.profile &&
                              member.profile.skills.length >
                                0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {member.profile.skills.map(
                                    (skill) => (
                                      <span
                                        key={skill.id}
                                        className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
                                      >
                                        {skill.name}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}

                            <div className="mt-5 rounded-lg bg-background p-3">
                              <p className="text-xs text-muted-foreground">
                                Team Role
                              </p>

                              <p className="mt-1 font-medium text-foreground">
                                {member.role ||
                                  "Role not assigned"}
                              </p>
                            </div>

                            {isProjectOwner && (
                              <div className="mt-5 border-t border-border pt-5">
                                <label
                                  htmlFor={`role-${member.user_id}`}
                                  className="text-sm font-medium text-foreground"
                                >
                                  Change Role
                                </label>

                                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                  <input
                                    id={`role-${member.user_id}`}
                                    type="text"
                                    value={
                                      roles[member.user_id] ||
                                      ""
                                    }
                                    onChange={(event) =>
                                      setRoles(
                                        (currentRoles) => ({
                                          ...currentRoles,
                                          [member.user_id]:
                                            event.target
                                              .value,
                                        })
                                      )
                                    }
                                    placeholder="Frontend Developer"
                                    className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      saveRole(member)
                                    }
                                    disabled={
                                      savingUserId ===
                                      member.user_id
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Save className="h-4 w-4" />

                                    {savingUserId ===
                                    member.user_id
                                      ? "Saving..."
                                      : "Save"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}