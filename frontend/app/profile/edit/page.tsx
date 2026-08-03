"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type User = {
  id: number;
  username: string;
  email: string;
};

type Skill = {
  id: number;
  name: string;
};

type Profile = {
  id: number;
  user_id: number;
  full_name: string | null;
  university: string | null;
  faculty: string | null;
  bio: string | null;
  portfolio_url: string | null;
  skills: Skill[];
};

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must contain at least 2 characters.")
    .max(100, "Full name is too long."),

  university: z
    .string()
    .min(2, "University is required."),

  faculty: z
    .string()
    .min(2, "Faculty is required.")
    .max(150, "Faculty name is too long."),

  bio: z
    .string()
    .max(1000, "Bio cannot exceed 1000 characters."),

  portfolioUrl: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("http://") ||
        value.startsWith("https://"),
      "Enter a valid portfolio URL."
    ),

  skillIds: z
    .array(z.string())
    .min(1, "Select at least one skill."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      university: "Karabakh University",
      faculty: "",
      bio: "",
      portfolioUrl: "",
      skillIds: [],
    },
  });

  useEffect(() => {
    async function loadProfile() {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        setPageError("User information could not be found.");
        setPageLoading(false);
        return;
      }

      try {
        const user: User = JSON.parse(savedUser);

        const skillsResponse = await fetch(
          "http://127.0.0.1:8000/skills"
        );

        if (!skillsResponse.ok) {
          throw new Error("Skills could not be loaded.");
        }

        const skillsData: Skill[] =
          await skillsResponse.json();

        setSkills(skillsData);

        const profileResponse = await fetch(
          `http://127.0.0.1:8000/users/${user.id}/profile`
        );

        if (profileResponse.ok) {
          const profile: Profile =
            await profileResponse.json();

          reset({
            fullName: profile.full_name || "",
            university:
              profile.university || "Karabakh University",
            faculty: profile.faculty || "",
            bio: profile.bio || "",
            portfolioUrl: profile.portfolio_url || "",
            skillIds: profile.skills.map((skill) =>
              String(skill.id)
            ),
          });
        } else if (profileResponse.status !== 404) {
          throw new Error("Profile could not be loaded.");
        }
      } catch {
        setPageError("Profile information could not be loaded.");
      } finally {
        setPageLoading(false);
      }
    }

    loadProfile();
  }, [reset]);

  async function saveProfile(formData: ProfileFormData) {
    setSubmitError("");
    setSuccessMessage("");

    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      setSubmitError("User information could not be found.");
      return;
    }

    try {
      const user: User = JSON.parse(savedUser);

      const profileData = {
        full_name: formData.fullName,
        university: formData.university,
        faculty: formData.faculty,
        bio: formData.bio || null,
        portfolio_url: formData.portfolioUrl || null,
        skill_ids: formData.skillIds.map(Number),
      };

      const response = await fetch(
        `http://127.0.0.1:8000/users/${user.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        throw new Error("Profile could not be saved.");
      }

      setSuccessMessage("Profile saved successfully.");
    } catch {
      setSubmitError("Profile could not be saved.");
    }
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-foreground">
              Edit Profile
            </h1>

            <p className="mt-2 text-muted-foreground">
              Add information about yourself and your skills.
            </p>

            {pageLoading && (
              <p className="mt-8 text-muted-foreground">
                Loading profile...
              </p>
            )}

            {pageError && (
              <p className="mt-8 text-destructive">
                {pageError}
              </p>
            )}

            {!pageLoading && !pageError && (
              <form
                onSubmit={handleSubmit(saveProfile)}
                className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name
                  </Label>

                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    aria-invalid={errors.fullName ? true : false}
                    {...register("fullName")}
                  />

                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="university">
                      University
                    </Label>

                    <Input
                      id="university"
                      type="text"
                      readOnly
                      {...register("university")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty">
                      Faculty
                    </Label>

                    <Input
                      id="faculty"
                      type="text"
                      placeholder="Enter your faculty"
                      aria-invalid={
                        errors.faculty ? true : false
                      }
                      {...register("faculty")}
                    />

                    {errors.faculty && (
                      <p className="text-sm text-destructive">
                        {errors.faculty.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="bio">
                    About Me
                  </Label>

                  <textarea
                    id="bio"
                    rows={5}
                    placeholder="Tell others about yourself"
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                    {...register("bio")}
                  />

                  {errors.bio && (
                    <p className="text-sm text-destructive">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="portfolioUrl">
                    Portfolio URL
                  </Label>

                  <Input
                    id="portfolioUrl"
                    type="url"
                    placeholder="https://your-portfolio.com"
                    aria-invalid={
                      errors.portfolioUrl ? true : false
                    }
                    {...register("portfolioUrl")}
                  />

                  {errors.portfolioUrl && (
                    <p className="text-sm text-destructive">
                      {errors.portfolioUrl.message}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <Label>Skills</Label>

                  <div className="grid gap-3 sm:grid-cols-2">
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

                        <span className="text-sm text-foreground">
                          {skill.name}
                        </span>
                      </label>
                    ))}
                  </div>

                  {errors.skillIds && (
                    <p className="text-sm text-destructive">
                      {errors.skillIds.message}
                    </p>
                  )}
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

                <div className="mt-8 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : "Save Profile"}
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