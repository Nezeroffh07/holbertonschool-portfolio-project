"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Pencil,
  Users,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  API_URL,
  getAuthHeaders,
} from "@/lib/api";

type Skill = {
  id: number;
  name: string;
};

type User = {
  id: number;
  username: string;
  email: string;
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

type Application = {
  id: number;
  project_id: number;
  applicant_id: number;
  message: string | null;
  status: string;
  role: string | null;
  created_at: string;
};

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] =
    useState<Project | null>(null);

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] =
    useState("");

  const [
    showApplicationForm,
    setShowApplicationForm,
  ] = useState(false);

  const [
    applicationMessage,
    setApplicationMessage,
  ] = useState("");

  const [
    applicationStatus,
    setApplicationStatus,
  ] = useState<string | null>(null);

  const [
    applicationError,
    setApplicationError,
  ] = useState("");

  const [
    applicationSuccess,
    setApplicationSuccess,
  ] = useState("");

  const [
    applicationLoading,
    setApplicationLoading,
  ] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [
          projectResponse,
          userResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/projects/${projectId}`,
            {
              headers: getAuthHeaders(),
            }
          ),

          fetch(`${API_URL}/me`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (
          projectResponse.status === 401 ||
          userResponse.status === 401
        ) {
          localStorage.removeItem("user");
          localStorage.removeItem(
            "access_token"
          );

          router.replace("/login");
          return;
        }

        if (!projectResponse.ok) {
          throw new Error(
            "Project could not be loaded."
          );
        }

        if (!userResponse.ok) {
          throw new Error(
            "User information could not be loaded."
          );
        }

        const projectData: Project =
          await projectResponse.json();

        const userData: User =
          await userResponse.json();

        setProject(projectData);
        setCurrentUser(userData);

        const applicationsResponse =
          await fetch(
            `${API_URL}/users/${userData.id}/applications`,
            {
              headers: getAuthHeaders(),
            }
          );

        if (applicationsResponse.ok) {
          const applications: Application[] =
            await applicationsResponse.json();

          const existingApplication =
            applications.find(
              (application) =>
                application.project_id ===
                Number(projectId)
            );

          if (existingApplication) {
            setApplicationStatus(
              existingApplication.status
            );
          }
        }
      } catch (error) {
        setProjectError(
          error instanceof Error
            ? error.message
            : "Project could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [projectId, router]);

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

    if (
      applicationMessage.trim().length < 10
    ) {
      setApplicationError(
        "Application message must contain at least 10 characters."
      );
      return;
    }

    setApplicationLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/projects/${project.id}/apply`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            applicant_id: currentUser.id,
            message:
              applicationMessage.trim(),
          }),
        }
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof responseData?.detail ===
            "string"
            ? responseData.detail
            : "Application could not be submitted."
        );
      }

      setApplicationStatus("pending");

      setApplicationSuccess(
        "Your application was submitted successfully."
      );

      setApplicationMessage("");
      setShowApplicationForm(false);
    } catch (error) {
      setApplicationError(
        error instanceof Error
          ? error.message
          : "Application could not be submitted."
      );
    } finally {
      setApplicationLoading(false);
    }
  }

  const isProjectOwner =
    currentUser?.id === project?.owner_id;

  const projectIsOpen =
    project?.status.toLowerCase() === "open";

  const visibleSkills =
    project?.required_skills.filter(
      (skill) =>
        skill.name.trim().toLowerCase() !==
        "string"
    ) || [];

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
              <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                {projectError}
              </p>
            )}

            {!loading &&
              !projectError &&
              project && (
                <article className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
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

                    <span className="w-fit rounded-full bg-secondary px-3 py-1 text-sm font-medium capitalize text-secondary-foreground">
                      {project.status}
                    </span>
                  </div>

                  <section className="mt-8">
                    <h2 className="text-xl font-semibold text-foreground">
                      About the Project
                    </h2>

                    <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                      {project.description}
                    </p>
                  </section>

                  <section className="mt-8">
                    <h2 className="text-xl font-semibold text-foreground">
                      Required Skills
                    </h2>

                    {visibleSkills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {visibleSkills.map(
                          (skill) => (
                            <span
                              key={skill.id}
                              className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
                            >
                              {skill.name}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No required skills provided.
                      </p>
                    )}
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
                          {project.application_deadline
                            ? new Date(
                                project.application_deadline
                              ).toLocaleDateString()
                            : "No deadline"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {isProjectOwner && (
                    <section className="mt-8">
                      <div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
                        You are the owner of this project.
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Link
                          href={`/projects/${project.id}/edit`}
                          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Project
                        </Link>

                        <Link
                          href={`/projects/${project.id}/applications`}
                          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
                        >
                          <FileText className="h-4 w-4" />
                          Applications
                        </Link>

                        <Link
                          href={`/projects/${project.id}/team`}
                          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
                        >
                          <Users className="h-4 w-4" />
                          Team Members
                        </Link>
                      </div>
                    </section>
                  )}

                  {!isProjectOwner && (
                    <Link
                      href={`/projects/${project.id}/team`}
                      className="mt-6 flex w-fit items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Users className="h-4 w-4" />
                      View Team Members
                    </Link>
                  )}

                  {!isProjectOwner &&
                    !projectIsOpen && (
                      <div className="mt-8 rounded-lg bg-muted p-4 text-sm text-foreground">
                        This project is not accepting
                        applications.
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
                    <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                      {applicationError}
                    </p>
                  )}

                  {!isProjectOwner &&
                    projectIsOpen &&
                    !applicationStatus &&
                    !showApplicationForm && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowApplicationForm(
                            true
                          )
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
                          className="mt-2 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
                        />

                        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setShowApplicationForm(
                                false
                              )
                            }
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={
                              applicationLoading
                            }
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