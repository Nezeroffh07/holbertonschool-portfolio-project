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
    async function getApplications() {
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
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          router.replace("/login");
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
          setError(
            "Only the project owner can view these applications."
          );
          return;
        }

        setProject(projectData);

        const applicationsResponse = await fetch(
          `${API_URL}/projects/${params.id}/applications`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (applicationsResponse.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          router.replace("/login");
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

        const applicationsData: Application[] =
          responseData;

        setApplications(applicationsData);
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

    getApplications();
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

      const updatedApplication: Application =
        responseData;

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
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

            <div className="mt-6">
              <h1 className="text-3xl font-bold text-foreground">
                Project Applications
              </h1>

              {project && (
                <p className="mt-2 text-muted-foreground">
                  Applications for {project.title}
                </p>
              )}
            </div>

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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <FileText className="h-7 w-7 text-secondary-foreground" />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    No applications yet
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Applications will appear here when users
                    apply to your project.
                  </p>
                </section>
              )}

            {!loading && applications.length > 0 && (
              <div className="mt-8 space-y-4">
                {applications.map((application) => (
                  <article
                    key={application.id}
                    className="rounded-xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-semibold text-foreground">
                          Applicant #
                          {application.applicant_id}
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Applied on{" "}
                          {new Date(
                            application.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
                        {application.status}
                      </span>
                    </div>

                    <div className="mt-5 rounded-lg bg-background p-4">
                      <p className="text-sm leading-6 text-muted-foreground">
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
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}