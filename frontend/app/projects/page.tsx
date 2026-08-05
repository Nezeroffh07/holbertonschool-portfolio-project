"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderOpen, Search } from "lucide-react";
import { API_URL } from "@/lib/api";

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
  required_skills: Skill[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");

  useEffect(() => {
    async function loadPageData() {
      try {
        const [projectsResponse, skillsResponse] =
          await Promise.all([
            fetch("http://127.0.0.1:8000/projects"),
            fetch("http://127.0.0.1:8000/skills"),
          ]);

        if (!projectsResponse.ok) {
          throw new Error("Projects could not be loaded.");
        }

        if (!skillsResponse.ok) {
          throw new Error("Skills could not be loaded.");
        }

        const projectsData: Project[] =
          await projectsResponse.json();

        const skillsData: Skill[] =
          await skillsResponse.json();

        const sortedSkills = [...skillsData].sort(
          (firstSkill, secondSkill) =>
            firstSkill.name.localeCompare(secondSkill.name)
        );

        setProjects(projectsData);
        setSkills(sortedSkills);
      } catch {
        setError("Projects and skills could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const searchValue = searchText.toLowerCase().trim();

    const matchesSearch =
      project.title.toLowerCase().includes(searchValue) ||
      project.description.toLowerCase().includes(searchValue);

    const matchesStatus =
      selectedStatus === "all" ||
      project.status === selectedStatus;

    const matchesSkill =
      selectedSkill === "all" ||
      project.required_skills.some(
        (skill) => String(skill.id) === selectedSkill
      );

    return matchesSearch && matchesStatus && matchesSkill;
  });

  function clearFilters() {
    setSearchText("");
    setSelectedStatus("all");
    setSelectedSkill("all");
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Projects
                </h1>

                <p className="mt-2 text-muted-foreground">
                  Explore projects and find a team that matches
                  your skills.
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

            {!loading && !error && projects.length > 0 && (
              <section className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="search"
                      value={searchText}
                      onChange={(event) =>
                        setSearchText(event.target.value)
                      }
                      placeholder="Search projects"
                      className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value)
                    }
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="all">All statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">
                      In Progress
                    </option>
                    <option value="completed">
                      Completed
                    </option>
                    <option value="closed">Closed</option>
                  </select>

                  <select
                    value={selectedSkill}
                    onChange={(event) =>
                      setSelectedSkill(event.target.value)
                    }
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="all">All skills</option>

                    {skills.map((skill) => (
                      <option
                        key={skill.id}
                        value={String(skill.id)}
                      >
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredProjects.length} project
                    {filteredProjects.length === 1 ? "" : "s"}{" "}
                    found
                  </p>

                  {(searchText ||
                    selectedStatus !== "all" ||
                    selectedSkill !== "all") && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </section>
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

            {!loading &&
              !error &&
              projects.length > 0 &&
              filteredProjects.length === 0 && (
                <section className="mt-8 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <Search className="h-6 w-6 text-secondary-foreground" />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    No matching projects
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Try changing your search or filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-sm font-medium text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </section>
              )}

            {!loading &&
              !error &&
              filteredProjects.length > 0 && (
                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <article
                      key={project.id}
                      className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-semibold text-foreground">
                          {project.title}
                        </h2>

                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
                          {project.status.replace("_", " ")}
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

                      <div className="mt-4">
                        <p className="text-sm text-foreground">
                          Open positions:{" "}
                          {project.open_positions}
                        </p>

                        {project.application_deadline && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Deadline:{" "}
                            {project.application_deadline}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/projects/${project.id}`}
                        className="mt-auto block pt-6"
                      >
                        <span className="block rounded-lg border border-primary px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
                          View Details
                        </span>
                      </Link>
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
