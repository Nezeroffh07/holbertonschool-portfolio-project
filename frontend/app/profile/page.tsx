"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  GraduationCap,
  Mail,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  API_URL,
  getAuthHeaders,
} from "@/lib/api";

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
  avatar_url: string | null;
  interests: string | null;
  previous_projects: string | null;
  is_public: boolean;
  skills: Skill[];
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

type Project = {
  id: number;
  title: string;
  status: string;
};

type TeamProject = {
  projectId: number;
  projectTitle: string;
  projectStatus: string;
  role: string | null;
};

export default function ProfilePage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [teamProjects, setTeamProjects] =
    useState<TeamProject[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    profileNotFound,
    setProfileNotFound,
  ] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        setError(
          "Please log in to view your profile."
        );

        setLoading(false);
        return;
      }

      try {
        const userResponse = await fetch(
          `${API_URL}/me`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!userResponse.ok) {
          throw new Error(
            "User information could not be loaded."
          );
        }

        const currentUser: User =
          await userResponse.json();

        setUser(currentUser);

        const [
          profileResponse,
          applicationsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/users/${currentUser.id}/profile`,
            {
              headers: getAuthHeaders(),
            }
          ),

          fetch(
            `${API_URL}/users/${currentUser.id}/applications`,
            {
              headers: getAuthHeaders(),
            }
          ),
        ]);

        if (
          profileResponse.status === 404
        ) {
          setProfileNotFound(true);
        } else if (!profileResponse.ok) {
          throw new Error(
            "Profile could not be loaded."
          );
        } else {
          const profileData: Profile =
            await profileResponse.json();

          setProfile(profileData);
        }

        if (applicationsResponse.ok) {
          const applications: Application[] =
            await applicationsResponse.json();

          const acceptedApplications =
            applications.filter(
              (application) =>
                application.status ===
                "accepted"
            );

          const acceptedTeamProjects =
            await Promise.all(
              acceptedApplications.map(
                async (application) => {
                  try {
                    const projectResponse =
                      await fetch(
                        `${API_URL}/projects/${application.project_id}`,
                        {
                          headers:
                            getAuthHeaders(),
                        }
                      );

                    if (
                      !projectResponse.ok
                    ) {
                      throw new Error();
                    }

                    const project: Project =
                      await projectResponse.json();

                    return {
                      projectId: project.id,
                      projectTitle:
                        project.title,
                      projectStatus:
                        project.status,
                      role:
                        application.role,
                    };
                  } catch {
                    return {
                      projectId:
                        application.project_id,
                      projectTitle: `Project #${application.project_id}`,
                      projectStatus:
                        "Unknown",
                      role:
                        application.role,
                    };
                  }
                }
              )
            );

          setTeamProjects(
            acceptedTeamProjects
          );
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Profile could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const visibleSkills =
    profile?.skills.filter(
      (skill) =>
        skill.name
          .trim()
          .toLowerCase() !== "string"
    ) || [];

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  My Profile
                </h1>

                <p className="mt-2 text-muted-foreground">
                  View your personal information,
                  interests, skills and team projects.
                </p>
              </div>

              <Link
                href="/profile/edit"
                className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Link>
            </div>

            {loading && (
              <div className="mt-8 flex items-center gap-3 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />

                <p>Loading profile...</p>
              </div>
            )}

            {error && (
              <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              profileNotFound && (
                <section className="mt-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <UserIcon className="h-8 w-8 text-secondary-foreground" />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    Your profile is empty
                  </h2>

                  <p className="mt-2 text-muted-foreground">
                    Add information about yourself
                    and your skills.
                  </p>

                  <Link
                    href="/profile/edit"
                    className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Create Profile
                  </Link>
                </section>
              )}

            {!loading &&
              !error &&
              profile &&
              user && (
                <>
                  <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="bg-[#16423C] p-6 md:p-8">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {profile.avatar_url ? (
                          <img
                            src={
                              profile.avatar_url
                            }
                            alt={
                              profile.full_name ||
                              user.username
                            }
                            className="h-20 w-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-3xl font-bold text-secondary-foreground">
                            {(
                              profile.full_name ||
                              user.username
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div>
                          <h2 className="text-2xl font-bold text-white">
                            {profile.full_name ||
                              user.username}
                          </h2>

                          <p className="mt-1 text-sm text-white/70">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Personal Information
                        </h3>

                        <div className="mt-5 space-y-4">
                          <div className="flex items-start gap-3">
                            <Mail className="mt-0.5 h-5 w-5 text-primary" />

                            <div>
                              <p className="text-sm text-muted-foreground">
                                Email
                              </p>

                              <p className="break-all text-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <GraduationCap className="mt-0.5 h-5 w-5 text-primary" />

                            <div>
                              <p className="text-sm text-muted-foreground">
                                University
                              </p>

                              <p className="text-foreground">
                                {profile.university ||
                                  "Karabakh University"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <UserIcon className="mt-0.5 h-5 w-5 text-primary" />

                            <div>
                              <p className="text-sm text-muted-foreground">
                                Faculty
                              </p>

                              <p className="text-foreground">
                                {profile.faculty ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>

                          {profile.portfolio_url && (
                            <div className="flex items-start gap-3">
                              <ExternalLink className="mt-0.5 h-5 w-5 text-primary" />

                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Portfolio
                                </p>

                                <a
                                  href={
                                    profile.portfolio_url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="break-all text-primary hover:underline"
                                >
                                  {
                                    profile.portfolio_url
                                  }
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          About Me
                        </h3>

                        <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                          {profile.bio ||
                            "No information provided yet."}
                        </p>

                        <div className="mt-8">
                          <h3 className="text-lg font-semibold text-foreground">
                            Skills
                          </h3>

                          {visibleSkills.length >
                          0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {visibleSkills.map(
                                (skill) => (
                                  <span
                                    key={
                                      skill.id
                                    }
                                    className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                                  >
                                    {skill.name}
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="mt-3 text-muted-foreground">
                              No skills added yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
                    <div className="grid gap-8 md:grid-cols-2">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          Interests
                        </h2>

                        <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                          {profile.interests ||
                            "No interests provided yet."}
                        </p>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          Previous Projects
                        </h2>

                        <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                          {profile.previous_projects ||
                            "No previous projects provided yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-border pt-5">
                      <p className="text-sm text-muted-foreground">
                        Community Visibility
                      </p>

                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                          profile.is_public
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {profile.is_public
                          ? "Public profile"
                          : "Private profile"}
                      </span>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {profile.is_public
                          ? "Your profile is visible in TUP Community."
                          : "Your profile is hidden from TUP Community."}
                      </p>
                    </div>
                  </section>

                  <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <BriefcaseBusiness className="h-5 w-5 text-secondary-foreground" />
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          Team Projects
                        </h2>

                        <p className="text-sm text-muted-foreground">
                          Projects where you are an
                          accepted team member.
                        </p>
                      </div>
                    </div>

                    {teamProjects.length ===
                    0 ? (
                      <div className="mt-6 rounded-lg bg-background p-6 text-center">
                        <p className="text-muted-foreground">
                          You have not joined a
                          project team yet.
                        </p>

                        <Link
                          href="/projects"
                          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                        >
                          Explore Projects
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {teamProjects.map(
                          (teamProject) => (
                            <article
                              key={
                                teamProject.projectId
                              }
                              className="rounded-lg border border-border bg-background p-5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <Link
                                  href={`/projects/${teamProject.projectId}`}
                                  className="font-semibold text-foreground hover:text-primary"
                                >
                                  {
                                    teamProject.projectTitle
                                  }
                                </Link>

                                <span className="rounded-full bg-secondary px-2 py-1 text-xs capitalize text-secondary-foreground">
                                  {
                                    teamProject.projectStatus
                                  }
                                </span>
                              </div>

                              <div className="mt-4">
                                <p className="text-xs text-muted-foreground">
                                  Team Role
                                </p>

                                <p className="mt-1 font-medium text-foreground">
                                  {teamProject.role ||
                                    "Role not assigned yet"}
                                </p>
                              </div>

                              <Link
                                href={`/projects/${teamProject.projectId}`}
                                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                              >
                                View Project
                              </Link>
                            </article>
                          )
                        )}
                      </div>
                    )}
                  </section>
                </>
              )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}