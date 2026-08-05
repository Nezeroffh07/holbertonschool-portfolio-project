"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  GraduationCap,
  Mail,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API_URL } from "@/lib/api";

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileNotFound, setProfileNotFound] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        setError("User information could not be found.");
        setLoading(false);
        return;
      }

      try {
        const currentUser: User = JSON.parse(savedUser);
        setUser(currentUser);

        const response = await fetch(
          `${API_URL}/users/${currentUser.id}/profile`
        );

        if (response.status === 404) {
          setProfileNotFound(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Profile could not be loaded.");
        }

        const profileData: Profile = await response.json();
        setProfile(profileData);
      } catch {
        setError("Profile could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  My Profile
                </h1>

                <p className="mt-2 text-muted-foreground">
                  View your personal information and skills.
                </p>
              </div>

              <Link
                href="/profile/edit"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Link>
            </div>

            {loading && (
              <p className="mt-8 text-muted-foreground">
                Loading profile...
              </p>
            )}

            {error && (
              <p className="mt-8 text-destructive">
                {error}
              </p>
            )}

            {!loading && !error && profileNotFound && (
              <section className="mt-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <UserIcon className="h-8 w-8 text-secondary-foreground" />
                </div>

                <h2 className="mt-4 text-xl font-semibold text-foreground">
                  Your profile is empty
                </h2>

                <p className="mt-2 text-muted-foreground">
                  Add information about yourself and your skills.
                </p>

                <Link
                  href="/profile/edit"
                  className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create Profile
                </Link>
              </section>
            )}

            {!loading && !error && profile && user && (
              <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="bg-[#16423C] p-6 md:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-3xl font-bold text-secondary-foreground">
                      {(profile.full_name || user.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {profile.full_name || user.username}
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

                          <p className="text-foreground">
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
                            {profile.faculty || "Not provided"}
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
                              href={profile.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-primary hover:underline"
                            >
                              {profile.portfolio_url}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        About Me
                      </h3>

                      <p className="mt-3 leading-7 text-muted-foreground">
                        {profile.bio || "No information provided yet."}
                      </p>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-foreground">
                        Skills
                      </h3>

                      {profile.skills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {profile.skills.map((skill) => (
                            <span
                              key={skill.id}
                              className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                            >
                              {skill.name}
                            </span>
                          ))}
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
            )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
