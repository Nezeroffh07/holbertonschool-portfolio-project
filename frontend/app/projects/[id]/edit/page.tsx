"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useForm,
  type Resolver,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const projectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must contain at least 3 characters.")
    .max(150, "Title is too long."),

  description: z
    .string()
    .min(10, "Description must contain at least 10 characters.")
    .max(3000, "Description is too long."),

  openPositions: z
    .string()
    .refine((value) => {
      const numberValue = Number(value);

      return (
        Number.isInteger(numberValue) &&
        numberValue >= 1 &&
        numberValue <= 50
      );
    }, "Open positions must be between 1 and 50."),

  applicationDeadline: z.string(),

  status: z
    .string()
    .refine(
      (value) => value === "open" || value === "closed",
      "Select a valid project status."
    ),

  skillIds: z
    .array(z.string())
    .min(1, "Select at least one skill."),
});

type ProjectFormData = z.infer<
  typeof projectSchema
>;

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.id);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(
      projectSchema
    ) as Resolver<ProjectFormData>,

    defaultValues: {
      title: "",
      description: "",
      openPositions: "1",
      applicationDeadline: "",
      status: "open",
      skillIds: [],
    },
  });

  useEffect(() => {
    async function loadProject() {
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

        const [projectResponse, skillsResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/projects/${projectId}`,
              {
                headers: getAuthHeaders(),
              }
            ),

            fetch(`${API_URL}/skills`, {
              headers: getAuthHeaders(),
            }),
          ]);

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

        if (!skillsResponse.ok) {
          throw new Error(
            "Skills could not be loaded."
          );
        }

        const project: Project =
          await projectResponse.json();

        const skillsData: Skill[] =
          await skillsResponse.json();

        if (project.owner_id !== user.id) {
          setPageError(
            "You are not allowed to edit this project."
          );
          return;
        }

        const sortedSkills = [...skillsData].sort(
          (firstSkill, secondSkill) =>
            firstSkill.name.localeCompare(
              secondSkill.name
            )
        );

        setSkills(sortedSkills);

        reset({
          title: project.title,
          description: project.description,
          openPositions: String(
            project.open_positions
          ),
          applicationDeadline:
            project.application_deadline?.slice(
              0,
              10
            ) || "",
          status:
            project.status === "closed"
              ? "closed"
              : "open",
          skillIds: project.required_skills.map(
            (skill) => String(skill.id)
          ),
        });
      } catch {
        setPageError(
          "Project information could not be loaded."
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadProject();
  }, [projectId, reset, router]);

  async function updateProject(
    formData: ProjectFormData
  ) {
    setSubmitError("");
    setSuccessMessage("");

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const projectData = {
        title: formData.title,
        description: formData.description,
        open_positions: Number(
          formData.openPositions
        ),
        application_deadline:
          formData.applicationDeadline || null,
        status: formData.status,
        required_skill_ids:
          formData.skillIds.map(Number),
      };

      const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(projectData),
        }
      );

      const data = await response
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
          typeof data?.detail === "string"
            ? data.detail
            : "Project could not be updated."
        );
      }

      setSuccessMessage(
        "Project updated successfully."
      );

      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 800);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Project could not be updated."
      );
    }
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-3xl">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/projects/${projectId}`
                )
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to Project
            </button>

            <h1 className="mt-6 text-3xl font-bold text-foreground">
              Edit Project
            </h1>

            <p className="mt-2 text-muted-foreground">
              Update your project information.
            </p>

            {pageLoading && (
              <p className="mt-8 text-muted-foreground">
                Loading project...
              </p>
            )}

            {pageError && (
              <p className="mt-8 text-destructive">
                {pageError}
              </p>
            )}

            {!pageLoading && !pageError && (
              <form
                onSubmit={handleSubmit(
                  updateProject
                )}
                className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Project Title
                  </Label>

                  <Input
                    id="title"
                    {...register("title")}
                  />

                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="description">
                    Description
                  </Label>

                  <textarea
                    id="description"
                    rows={6}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    {...register("description")}
                  />

                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <Label>Required Skills</Label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {skills.map((skill) => (
                      <label
                        key={skill.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary"
                      >
                        <input
                          type="checkbox"
                          value={String(skill.id)}
                          className="h-4 w-4 accent-primary"
                          {...register("skillIds")}
                        />

                        <span>{skill.name}</span>
                      </label>
                    ))}
                  </div>

                  {errors.skillIds && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.skillIds.message}
                    </p>
                  )}
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="openPositions">
                      Open Positions
                    </Label>

                    <Input
                      id="openPositions"
                      type="number"
                      min="1"
                      max="50"
                      {...register(
                        "openPositions"
                      )}
                    />

                    {errors.openPositions && (
                      <p className="text-sm text-destructive">
                        {
                          errors.openPositions
                            .message
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicationDeadline">
                      Application Deadline
                    </Label>

                    <Input
                      id="applicationDeadline"
                      type="date"
                      {...register(
                        "applicationDeadline"
                      )}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="status">
                    Project Status
                  </Label>

                  <select
                    id="status"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
                    {...register("status")}
                  >
                    <option value="open">
                      Open
                    </option>

                    <option value="closed">
                      Closed
                    </option>
                  </select>
                </div>

                {submitError && (
                  <p className="mt-6 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                {successMessage && (
                  <p className="mt-6 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
                    {successMessage}
                  </p>
                )}

                <div className="mt-8 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}`
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
