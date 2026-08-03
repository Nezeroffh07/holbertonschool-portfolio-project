"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FileText,
  FolderOpen,
  Pencil,
  Trash2,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

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

type User = {
  id: number;
  username: string;
  email: string;
};

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(
    null
  );

  useEffect(() => {
    async function getMyProjects() {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        setError("User information could not be found.");
        setLoading(false);
        return;
      }

      try {
        const user: User = JSON.parse(savedUser);

        const response = await fetch(
          "http://127.0.0.1:8000/projects"
        );

        if (!response.ok) {
          throw new Error("Projects could not be loaded.");
        }

        const data: Project[] = await response.json();

        const userProjects = data.filter(
          (project) => project.owner_id === user.id
        );

        setProjects(userProjects);
      } catch {
        setError("Projects could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    getMyProjects();
  }, []);

  async function deleteProject(projectId: number) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!shouldDelete) {
      return;
    }

    setError("");
    setDeletingId(projectId);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/projects/${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Project could not be deleted.");
      }

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectId
        )
      );
    } catch {
      setError("Project could not be deleted.");
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
                className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create Project
              </Link>
            </div>

            {loading && (
              <p className="mt-8 text-muted-foreground">
                Loading your projects...
              </p>
            )}

            {error && (
              <p className="mt-8 text-destructive">
                {error}
              </p>
            )}

            {!loading && projects.length === 0 && !error && (
              <section className="mt-8 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <FolderOpen className="h-6 w-6 text-secondary-foreground" />
                </div>

                <h2 className="mt-4 text-xl font-semibold text-foreground">
                  You have not created any projects
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first project and start building a team.
                </p>
              </section>
            )}

            {!loading && projects.length > 0 && (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-xl font-semibold text-foreground">
                        {project.title}
                      </h2>

                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {project.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {project.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.required_skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 text-sm">
                      <p className="text-foreground">
                        Open positions: {project.open_positions}
                      </p>

                      {project.application_deadline && (
                        <p className="mt-1 text-muted-foreground">
                          Deadline: {project.application_deadline}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <Link
                        href={`/projects/${project.id}/applications`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <FileText className="h-4 w-4" />
                        Applications
                      </Link>

                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          deleteProject(project.id)
                        }
                        disabled={deletingId === project.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />

                        {deletingId === project.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
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