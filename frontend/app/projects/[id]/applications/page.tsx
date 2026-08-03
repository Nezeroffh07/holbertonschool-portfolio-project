"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  X,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

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
  created_at: string;
};

export default function ProjectApplicationsPage() {
  const params = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(
    null
  );

  useEffect(() => {
    async function getApplications() {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        setError("User information could not be found.");
        setLoading(false);
        return;
      }

      try {
        const user: User = JSON.parse(savedUser);

        const projectResponse = await fetch(
          `http://127.0.0.1:8000/projects/${params.id}`
        );

        if (!projectResponse.ok) {
          throw new Error("Project could not be loaded.");
        }

        const projectData: Project =
          await projectResponse.json();

        if (projectData.owner_id !== user.id) {
          setError(
            "Only the project owner can view these applications."
          );
          setLoading(false);
          return;
        }

        setProject(projectData);

        const applicationsResponse = await fetch(
          `http://127.0.0.1:8000/projects/${params.id}/applications`
        );

        if (!applicationsResponse.ok) {
          throw new Error(
            "Applications could not be loaded."
          );
        }

        const applicationsData: Application[] =
          await applicationsResponse.json();

        setApplications(applicationsData);
      } catch {
        setError("Applications could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    getApplications();
  }, [params.id]);

  async function updateApplication(
    applicationId: number,
    newStatus: "accepted" | "rejected"
  ) {
    setError("");
    setUpdatingId(applicationId);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Application status could not be updated."
        );
      }

      const updatedApplication: Application =
        await response.json();

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application
        )
      );
    } catch {
      setError("Application status could not be updated.");
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
              <p className="mt-8 text-destructive">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              applications.length === 0 && (
                <section className="mt-8 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                  <FileText className="mx-auto h-8 w-8 text-primary" />

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
                          Applicant #{application.applicant_id}
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Applied on{" "}
                          {new Date(
                            application.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {application.status}
                      </span>
                    </div>

                    <div className="mt-5 rounded-lg bg-background p-4">
                      <p className="text-sm leading-6 text-muted-foreground">
                        {application.message ||
                          "No application message was provided."}
                      </p>
                    </div>

                    {application.status === "pending" && (
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            updateApplication(
                              application.id,
                              "rejected"
                            )
                          }
                          disabled={updatingId === application.id}
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
                          disabled={updatingId === application.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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