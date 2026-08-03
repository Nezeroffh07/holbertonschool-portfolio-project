"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";

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
  required_skills: Skill[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getProjects() {
      try {
        const response = await fetch("http://127.0.0.1:8000/projects");

        if (!response.ok) {
          throw new Error("Projects could not be loaded.");
        }

        const data: Project[] = await response.json();
        setProjects(data);
      } catch {
        setError("Projects could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    getProjects();
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Projects
            </h1>

            <p className="mt-2 text-muted-foreground">
              Explore projects and find a team that matches your skills.
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
          <p className="mt-8 text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && projects.length === 0 && (
          <section className="mt-8 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <FolderOpen className="h-6 w-6 text-secondary-foreground" />
            </div>

            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No projects available
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Be the first person to create a project.
            </p>
          </section>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

                <p className="mt-3 text-sm text-muted-foreground">
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

                <p className="mt-4 text-sm text-foreground">
                  Open positions: {project.open_positions}
                </p>

                {project.application_deadline && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Deadline: {project.application_deadline}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}