"use client";

import { API_URL } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Clock,
  FileText,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

type User = {
  id: number;
  username: string;
  email: string;
};

type Application = {
  id: number;
  project_id: number;
  applicant_id: number;
  message: string | null;
  status: string;
  created_at: string;
};

type Project = {
  id: number;
  title: string;
};

type ApplicationWithProject = Application & {
  projectTitle: string;
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<
    ApplicationWithProject[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getMyApplications() {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        setError("User information could not be found.");
        setLoading(false);
        return;
      }

      try {
        const user: User = JSON.parse(savedUser);

        const response = await fetch(
          `${API_URL}/users/${user.id}/applications`
        );

        if (!response.ok) {
          throw new Error(
            "Applications could not be loaded."
          );
        }

        const applicationData: Application[] =
          await response.json();

        const applicationsWithProjects =
          await Promise.all(
            applicationData.map(async (application) => {
              try {
                const projectResponse = await fetch(
                  `${API_URL}/projects/${application.project_id}`
                );

                if (!projectResponse.ok) {
                  throw new Error();
                }

                const project: Project =
                  await projectResponse.json();

                return {
                  ...application,
                  projectTitle: project.title,
                };
              } catch {
                return {
                  ...application,
                  projectTitle: `Project #${application.project_id}`,
                };
              }
            })
          );

        setApplications(applicationsWithProjects);
      } catch {
        setError("Applications could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    getMyApplications();
  }, []);

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-bold text-foreground">
              My Applications
            </h1>

            <p className="mt-2 text-muted-foreground">
              Track the status of your project applications.
            </p>

            {loading && (
              <p className="mt-8 text-muted-foreground">
                Loading your applications...
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
                    Apply to a project and track its status here.
                  </p>

                  <Link
                    href="/projects"
                    className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Explore Projects
                  </Link>
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
                        <Link
                          href={`/projects/${application.project_id}`}
                          className="text-xl font-semibold text-foreground hover:text-primary"
                        >
                          {application.projectTitle}
                        </Link>

                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-4 w-4" />

                          {new Date(
                            application.created_at
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                          application.status === "accepted"
                            ? "bg-secondary text-secondary-foreground"
                            : application.status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-foreground"
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>

                    <div className="mt-5 rounded-lg bg-background p-4">
                      <p className="text-sm leading-6 text-muted-foreground">
                        {application.message ||
                          "No application message was provided."}
                      </p>
                    </div>
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
