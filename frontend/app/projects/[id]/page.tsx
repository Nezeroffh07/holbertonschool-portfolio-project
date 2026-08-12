"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  API_URL,
  getAuthHeaders,
} from "../../../lib/api";

type Skill = {
  id: number;
  name: string;
};

type Project = {
  id: number;
  title: string;
  description: string;
  open_positions: number;
  application_deadline: string | null;
  status: string;
  owner_id: number;
  created_at: string;
  required_skills: Skill[];
};

type User = {
  id: number;
  username: string;
  email: string;
};

type Application = {
  project_id: number;
  status: string;
};

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState("");

  const [showApplicationForm, setShowApplicationForm] =
    useState(false);

  const [applicationMessage, setApplicationMessage] =
    useState("");

  const [applicationStatus, setApplicationStatus] =
    useState<string | null>(null);

  const [applicationError, setApplicationError] =
    useState("");

  const [applicationSuccess, setApplicationSuccess] =
    useState("");

  const [applicationLoading, setApplicationLoading] =
    useState(false);

  useEffect(() => {
    async function getProject() {
      try {
        const response = await fetch(
          `${API_URL}/projects/${params.id}`,
          { headers: getAuthHeaders() }
        );

        if (!response.ok) {
          throw new Error("Project could not be loaded.");
        }

        const data: Project = await response.json();
        setProject(data);
      } catch {
        setProjectError("Project could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    getProject();
  }, [params.id]);

  useEffect(() => {
    async function checkUserApplication() {
      const savedUser = localStorage.getItem("user");
      const token = localStorage.getItem("access_token");

      if (!savedUser || !token) {
        router.replace("/login");
        return;
      }

      const user: User = JSON.parse(savedUser);
      setCurrentUser(user);

      try {
        const response = await fetch(
          `${API_URL}/users/${user.id}/applications`,
          { headers: getAuthHeaders() }
        );

        if (response.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          return;
        }

        const applications: Application[] =
          await response.json();

        const existingApplication = applications.find(
          (application) =>
            application.project_id === Number(params.id)
        );

        if (existingApplication) {
          setApplicationStatus(
            existingApplication.status
          );
        }
      } catch {
        setApplicationStatus(null);
      }
    }

    checkUserApplication();
  }, [params.id, router]);

  async function applyToProject(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setApplicationError("");
    setApplicationSuccess("");

    if (!currentUser || !project) {
      setApplicationError(
        "User information could not be found."
      );
      return;
    }

    if (applicationMessage.trim().length < 10) {
      setApplicationError(
        "Application message must contain at least 10 characters."
      );
      return;
    }

    setApplicationLoading(true);

    const applicationData = {
      message: applicationMessage,
    };

    try {
      const response = await fetch(
        `${API_URL}/projects/${project.id}/apply`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(applicationData),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setApplicationError(
          typeof data?.detail === "string"
            ? data.detail
            : "Application could not be submitted."
        );
        return;
      }

      setApplicationSuccess(
        "Your application was submitted successfully."
      );

      setApplicationStatus("pending");
      setApplicationMessage("");
      setShowApplicationForm(false);
    } catch {
      setApplicationError(
        "Could not connect to the server."
      );
    } finally {
      setApplicationLoading(false);
    }
  }

  const isProjectOwner =
    currentUser?.id === project?.owner_id;

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>

            {loading && (
              <p className="mt-8 text-muted-foreground">
                Loading project...
              </p>
            )}

            {projectError && (
              <p className="mt-8 text-destructive">
                {projectError}
              </p>
            )}

            {!loading && !projectError && project && (
              <article className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {project.title}
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Created on{" "}
                      {new Date(
                        project.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                    {project.status}
                  </span>
                </div>

                <section className="mt-8">
                  <h2 className="text-xl font-semibold text-foreground">
                    About the Project
                  </h2>

                  <p className="mt-3 leading-7 text-muted-foreground">
                    {project.description}
                  </p>
                </section>

                <section className="mt-8">
                  <h2 className="text-xl font-semibold text-foreground">
                    Required Skills
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.required_skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                    <Users className="h-5 w-5 text-primary" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Open Positions
                      </p>

                      <p className="font-semibold text-foreground">
                        {project.open_positions}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                    <Calendar className="h-5 w-5 text-primary" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Application Deadline
                      </p>

                      <p className="font-semibold text-foreground">
                        {project.application_deadline ||
                          "No deadline"}
                      </p>
                    </div>
                  </div>
                </section>

                {isProjectOwner && (
                  <div className="mt-8 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
                    You are the owner of this project.
                  </div>
                )}

                {!isProjectOwner &&
                  project.status === "closed" && (
                    <div className="mt-8 rounded-lg bg-muted p-4 text-sm text-foreground">
                      This project is not accepting applications.
                    </div>
                  )}

                {applicationSuccess && (
                  <div className="mt-8 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
                    {applicationSuccess}
                  </div>
                )}

                {applicationStatus && (
                  <div className="mt-8 rounded-lg border border-border bg-background p-4 text-sm text-foreground">
                    Application status:{" "}
                    <span className="font-semibold capitalize">
                      {applicationStatus}
                    </span>
                  </div>
                )}

                {applicationError && (
                  <p className="mt-6 text-sm text-destructive">
                    {applicationError}
                  </p>
                )}

                {!isProjectOwner &&
                  project.status === "open" &&
                  !applicationStatus &&
                  !showApplicationForm && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowApplicationForm(true)
                      }
                      className="mt-8 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Apply to Project
                    </button>
                  )}

                {showApplicationForm &&
                  !applicationStatus && (
                    <form
                      onSubmit={applyToProject}
                      className="mt-8 rounded-xl border border-border bg-background p-5"
                    >
                      <label
                        htmlFor="applicationMessage"
                        className="font-medium text-foreground"
                      >
                        Application Message
                      </label>

                      <textarea
                        id="applicationMessage"
                        value={applicationMessage}
                        onChange={(event) =>
                          setApplicationMessage(
                            event.target.value
                          )
                        }
                        rows={5}
                        placeholder="Explain why you would like to join this project"
                        className="mt-2 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                      />

                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setShowApplicationForm(false)
                          }
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={applicationLoading}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {applicationLoading
                            ? "Submitting..."
                            : "Submit Application"}
                        </button>
                      </div>
                    </form>
                  )}
              </article>
            )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
