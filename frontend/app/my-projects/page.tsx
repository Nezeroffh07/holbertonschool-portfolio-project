"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FolderOpen,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import {
  API_URL,
  getAuthHeaders,
} from "../../lib/api";

type User = {
  id: number;
  username: string;
  email: string;
};

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
  required_skills: Skill[];
};

export default function MyProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  useEffect(() => {
    async function loadProjects() {
      const savedUser = localStorage.getItem("user");
      const token =
        localStorage.getItem("access_token");

      if (!savedUser || !token) {
        router.replace("/login");
        return;
      }

      try {
        const user: User = JSON.parse(savedUser);

        const response = await fetch(
          `${API_URL}/projects`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Projects could not be loaded."
          );
        }

        const data: Project[] =
          await response.json();

        const myProjects = data.filter(
          (project) => project.owner_id === user.id
        );

        setProjects(myProjects);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Projects could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [router]);

  async function deleteProject(
    projectId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeletingId(projectId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not allowed to delete this project."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Project could not be deleted."
        );
      }

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectId
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Project could not be deleted."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  My Projects
                </h1>

                <p className="mt-2 text-muted-foreground">
                  Manage the projects you have created.
                </p>
              </div>

              <Link
                href="/projects/create"
                className="rounded-lg bg-primary px-4 py-2 text-center font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create Project
              </Link>
            </div>

            {loading && (
              <p className="mt-8 text-muted-foreground">
                Loading projects...
              </p>
            )}

            {error && (
              <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              projects.length === 0 && (
                <section className="mt-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <FolderOpen className="h-7 w-7 text-secondary-foreground" />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    You have no projects
                  </h2>

                  <p className="mt-2 text-muted-foreground">
                    Create your first project and start
                    building a team.
                  </p>
                </section>
              )}

            {!loading && projects.length > 0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-semibold text-foreground">
                        {project.title}
                      </h2>

                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
                        {project.status}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {project.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.required_skills.map(
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

                    <p className="mt-4 text-sm text-foreground">
                      Open positions:{" "}
                      {project.open_positions}
                    </p>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
                      <Link
                        href={`/projects/${project.id}`}
                        className="rounded-lg border border-border px-3 py-2 text-center text-sm font-medium hover:bg-secondary"
                      >
                        Details
                      </Link>

                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="flex items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>

                      <Link
                        href={`/projects/${project.id}/applications`}
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                      >
                        <FileText className="h-4 w-4" />
                        Applications
                      </Link>

                      <Link
                        href={`/projects/${project.id}/team`}
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                      >
                        <Users className="h-4 w-4" />
                        Team
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        deleteProject(project.id)
                      }
                      disabled={
                        deletingId === project.id
                      }
                      className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />

                      {deletingId === project.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
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