"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  UserRound,
  X,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import {
  API_URL,
  getAuthHeaders,
} from "../../../../lib/api";

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
  user_id: number;
  full_name: string | null;
  faculty: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: Skill[];
};

type Project = {
  id: number;
  title: string;
  owner_id: number;
};

type Application = {
  id: number;
  project_id: number;
  applicant_id: number;
  message: string | null;
  status: string;
  role: string | null;
  created_at: string;
  profile: Profile | null;
};

export default function ProjectApplicationsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] =
    useState<Project | null>(null);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  useEffect(() => {
    async function loadApplications() {
      const savedUser =
        localStorage.getItem("user");

      const token =
        localStorage.getItem("access_token");

      if (!savedUser || !token) {
        router.replace("/login");
        return;
      }

      try {
        const user: User = JSON.parse(savedUser);

        const projectResponse = await fetch(
          `${API_URL}/projects/${params.id}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (projectResponse.status === 401) {
          logout();
          return;
        }

        if (!projectResponse.ok) {
          throw new Error(
            "Project could not be loaded."
          );
        }

        const projectData: Project =
          await projectResponse.json();

        if (projectData.owner_id !== user.id) {
          throw new Error(
            "Only the project owner can view these applications."
          );
        }

        setProject(projectData);

        const applicationsResponse = await fetch(
          `${API_URL}/projects/${params.id}/applications`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (applicationsResponse.status === 401) {
          logout();
          return;
        }

        const responseData =
          await applicationsResponse
            .json()
            .catch(() => null);

        if (!applicationsResponse.ok) {
          throw new Error(
            typeof responseData?.detail === "string"
              ? responseData.detail
              : "Applications could not be loaded."
          );
        }

        const applicationData =
          responseData as Omit<
            Application,
            "profile"
          >[];

        const applicationsWithProfiles =
          await Promise.all(
            applicationData.map(
              async (application) => {
                try {
                  const profileResponse = await fetch(
                    `${API_URL}/users/${application.applicant_id}/profile`,
                    {
                      headers: getAuthHeaders(),
                    }
                  );

                  if (!profileResponse.ok) {
                    return {
                      ...application,
                      profile: null,
                    };
                  }

                  const profile: Profile =
                    await profileResponse.json();

                  return {
                    ...application,
                    profile,
                  };
                } catch {
                  return {
                    ...application,
                    profile: null,
                  };
                }
              }
            )
          );

        setApplications(
          applicationsWithProfiles
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Applications could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    function logout() {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      router.replace("/login");
    }

    loadApplications();
  }, [params.id, router]);

  async function updateApplication(
    applicationId: number,
    newStatus: "accepted" | "rejected"
  ) {
    setError("");
    setUpdatingId(applicationId);

    try {
      const response = await fetch(
        `${API_URL}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: newStatus,
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
            : "Application status could not be updated."
        );
      }

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: responseData.status,
              }
            : application
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Application status could not be updated."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusStyle(status: string) {
    if (status === "accepted") {
      return "bg-secondary text-secondary-foreground";
    }

    if (status === "rejected") {
      return "bg-destructive/10 text-destructive";
    }

    return "bg-accent text-accent-foreground";
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/my-projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Projects
            </Link>

            <h1 className="mt-6 text-3xl font-bold text-foreground">
              Project Applications
            </h1>

            {project && (
              <p className="mt-2 text-muted-foreground">
                Applications for {project.title}
              </p>
            )}

            {loading && (
              <p className="mt-8 text-muted-foreground">
                Loading applications...
              </p>
            )}

            {error && (
              <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              applications.length === 0 && (
                <section className="mt-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                  <FileText className="mx-auto h-8 w-8 text-primary" />

                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    No applications yet
                  </h2>

                  <p className="mt-2 text-muted-foreground">
                    Applications will appear here when
                    users apply to your project.
                  </p>
                </section>
              )}

            {!loading && applications.length > 0 && (
              <div className="mt-8 space-y-5">
                {applications.map((application) => {
                  const profile =
                    application.profile;

                  const displayName =
                    profile?.full_name ||
                    `Applicant #${application.applicant_id}`;

                  return (
                    <article
                      key={application.id}
                      className="rounded-xl border border-border bg-card p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          {profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={displayName}
                              className="h-14 w-14 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                              <UserRound className="h-6 w-6" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-foreground">
                              {displayName}
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {profile?.faculty ||
                                "Faculty not provided"}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Applicant #
                              {application.applicant_id}
                              {" · "}
                              {new Date(
                                application.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>
                      </div>

                      {profile &&
                        profile.skills.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                              <span
                                key={skill.id}
                                className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        )}

                      {profile?.bio && (
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                          {profile.bio}
                        </p>
                      )}

                      <div className="mt-5 rounded-lg bg-background p-4">
                        <p className="text-sm font-medium text-foreground">
                          Application Message
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {application.message ||
                            "No application message was provided."}
                        </p>
                      </div>

                      {application.status ===
                        "pending" && (
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              updateApplication(
                                application.id,
                                "rejected"
                              )
                            }
                            disabled={
                              updatingId ===
                              application.id
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateApplication(
                                application.id,
                                "accepted"
                              )
                            }
                            disabled={
                              updatingId ===
                              application.id
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}