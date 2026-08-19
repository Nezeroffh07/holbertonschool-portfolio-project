"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const today =
  new Date().toISOString().split("T")[0];

const projectSchema = z.object({
  title: z
    .string()
    .min(
      3,
      "Project title must contain at least 3 characters."
    )
    .max(
      150,
      "Project title is too long."
    ),

  description: z
    .string()
    .min(
      10,
      "Description must contain at least 10 characters."
    )
    .max(
      2000,
      "Description cannot exceed 2000 characters."
    ),

  requiredSkillIds: z
    .array(z.string())
    .min(
      1,
      "Select at least one required skill."
    ),

  openPositions: z
    .string()
    .min(
      1,
      "Open positions is required."
    )
    .refine(
      (value) =>
        Number(value) >= 1 &&
        Number(value) <= 10,
      "Open positions must be between 1 and 10."
    ),

  deadline: z
    .string()
    .min(
      1,
      "Application deadline is required."
    )
    .refine(
      (value) => value >= today,
      "Application deadline cannot be in the past."
    ),
});

type ProjectFormData =
  z.infer<typeof projectSchema>;

export default function CreateProjectPage() {
  const router = useRouter();

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [
    skillsLoading,
    setSkillsLoading,
  ] = useState(true);

  const [
    skillsError,
    setSkillsError,
  ] = useState("");

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),

    defaultValues: {
      title: "",
      description: "",
      requiredSkillIds: [],
      openPositions: "",
      deadline: "",
    },
  });

  useEffect(() => {
    async function loadSkills() {
      try {
        const response = await fetch(
          `${API_URL}/skills`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Skills could not be loaded."
          );
        }

        const skillsData: Skill[] =
          await response.json();

        const validSkills =
          skillsData.filter(
            (skill) =>
              skill.name
                .trim()
                .toLowerCase() !==
              "string"
          );

        setSkills(validSkills);
      } catch {
        setSkillsError(
          "Skills could not be loaded."
        );
      } finally {
        setSkillsLoading(false);
      }
    }

    loadSkills();
  }, []);

  async function submitProject(
    formData: ProjectFormData
  ) {
    setSubmitError("");
    setSuccessMessage("");

    try {
      const userResponse = await fetch(
        `${API_URL}/me`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!userResponse.ok) {
        localStorage.removeItem("user");
        localStorage.removeItem(
          "access_token"
        );

        router.replace("/login");
        return;
      }

      const user: User =
        await userResponse.json();

      const projectData = {
        title: formData.title.trim(),
        description:
          formData.description.trim(),
        open_positions: Number(
          formData.openPositions
        ),
        application_deadline:
          formData.deadline,
        required_skill_ids:
          formData.requiredSkillIds.map(
            Number
          ),
        owner_id: user.id,
      };

      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(
            projectData
          ),
        }
      );

      const responseData =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof responseData?.detail ===
            "string"
            ? responseData.detail
            : "Project could not be created."
        );
      }

      setSuccessMessage(
        "Project created successfully."
      );

      router.push(
        `/projects/${responseData.id}`
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Project could not be created."
      );
    }
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/projects"
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to Projects
            </Link>

            <h1 className="mt-6 text-3xl font-bold text-foreground">
              Create Project
            </h1>

            <p className="mt-2 text-muted-foreground">
              Share your project idea and
              find the right team members.
            </p>

            <form
              onSubmit={handleSubmit(
                submitProject
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
                  type="text"
                  placeholder="Enter the project title"
                  aria-invalid={Boolean(
                    errors.title
                  )}
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
                  Project Description
                </Label>

                <textarea
                  id="description"
                  rows={5}
                  placeholder="Describe your project idea"
                  aria-invalid={Boolean(
                    errors.description
                  )}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 aria-invalid:border-destructive"
                  {...register(
                    "description"
                  )}
                />

                {errors.description && (
                  <p className="text-sm text-destructive">
                    {
                      errors.description
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <Label>
                  Required Skills
                </Label>

                {skillsLoading && (
                  <p className="text-sm text-muted-foreground">
                    Loading skills...
                  </p>
                )}

                {skillsError && (
                  <p className="text-sm text-destructive">
                    {skillsError}
                  </p>
                )}

                {!skillsLoading &&
                  !skillsError && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {skills.map(
                        (skill) => (
                          <label
                            key={skill.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary"
                          >
                            <input
                              type="checkbox"
                              value={String(
                                skill.id
                              )}
                              className="h-4 w-4 accent-primary"
                              {...register(
                                "requiredSkillIds"
                              )}
                            />

                            <span className="text-sm text-foreground">
                              {skill.name}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  )}

                {errors.requiredSkillIds && (
                  <p className="text-sm text-destructive">
                    {
                      errors
                        .requiredSkillIds
                        .message
                    }
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
                    max="10"
                    placeholder="For example: 3"
                    aria-invalid={Boolean(
                      errors.openPositions
                    )}
                    {...register(
                      "openPositions"
                    )}
                  />

                  {errors.openPositions && (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .openPositions
                          .message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">
                    Application Deadline
                  </Label>

                  <Input
                    id="deadline"
                    type="date"
                    min={today}
                    aria-invalid={Boolean(
                      errors.deadline
                    )}
                    {...register(
                      "deadline"
                    )}
                  />

                  {errors.deadline && (
                    <p className="text-sm text-destructive">
                      {
                        errors.deadline
                          .message
                      }
                    </p>
                  )}
                </div>
              </div>

              {submitError && (
                <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </p>
              )}

              {successMessage && (
                <p className="mt-6 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
                  {successMessage}
                </p>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/projects"
                  className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </Link>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Creating project..."
                    : "Create Project"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}