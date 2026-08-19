"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  ExternalLink,
  GraduationCap,
  Mail,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import InviteMember from "@/components/InviteMember";
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

type CommunityMember = {
  user_id: number;
  username: string;
  email: string;
  full_name: string | null;
  university: string | null;
  faculty: string | null;
  bio: string | null;
  portfolio_url: string | null;
  avatar_url: string | null;
  interests: string | null;
  previous_projects: string | null;
  skills: Skill[];
};

export default function CommunityPage() {
  const [members, setMembers] = useState<
    CommunityMember[]
  >([]);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedSkill, setSelectedSkill] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadCommunity(
    search = "",
    skillId = ""
  ) {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();

      if (search.trim()) {
        query.set("search", search.trim());
      }

      if (skillId) {
        query.set("skill_id", skillId);
      }

      query.set("limit", "100");
      query.set("offset", "0");

      const response = await fetch(
        `${API_URL}/community?${query.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof responseData?.detail === "string"
            ? responseData.detail
            : "Community members could not be loaded."
        );
      }

      setMembers(responseData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Community members could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadPage() {
      try {
        const skillsResponse = await fetch(
          `${API_URL}/skills`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!skillsResponse.ok) {
          throw new Error(
            "Skills could not be loaded."
          );
        }

        const skillsData: Skill[] =
          await skillsResponse.json();

        const validSkills = skillsData.filter(
          (skill) =>
            skill.name.trim().toLowerCase() !==
            "string"
        );

        setSkills(validSkills);
      } catch {
        setError("Skills could not be loaded.");
      } finally {
        setSkillsLoading(false);
      }

      await loadCommunity();
    }

    loadPage();
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    loadCommunity(searchText, selectedSkill);
  }

  function clearFilters() {
    setSearchText("");
    setSelectedSkill("");
    loadCommunity();
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                TUP Community
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Discover TUP users, explore their skills, and
                connect with people from different faculties.
              </p>
            </div>

            <form
              onSubmit={submitSearch}
              className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="search"
                    value={searchText}
                    onChange={(event) =>
                      setSearchText(event.target.value)
                    }
                    placeholder="Search by name or faculty"
                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <select
                  value={selectedSkill}
                  onChange={(event) =>
                    setSelectedSkill(
                      event.target.value
                    )
                  }
                  disabled={skillsLoading}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {skillsLoading
                      ? "Loading skills..."
                      : "All skills"}
                  </option>

                  {skills.map((skill) => (
                    <option
                      key={skill.id}
                      value={String(skill.id)}
                    >
                      {skill.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>

              {(searchText || selectedSkill) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </form>

            {loading && (
              <section className="mt-8 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
                <p className="text-muted-foreground">
                  Loading community members...
                </p>
              </section>
            )}

            {!loading && error && (
              <section className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-5">
                <p className="text-destructive">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadCommunity(
                      searchText,
                      selectedSkill
                    )
                  }
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Try again
                </button>
              </section>
            )}

            {!loading &&
              !error &&
              members.length === 0 && (
                <section className="mt-8 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <Users className="h-7 w-7 text-secondary-foreground" />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    No community members found
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Try changing your search or skill
                    filter.
                  </p>
                </section>
              )}

            {!loading &&
              !error &&
              members.length > 0 && (
                <>
                  <p className="mt-8 text-sm text-muted-foreground">
                    {members.length} member
                    {members.length === 1 ? "" : "s"} found
                  </p>

                  <section className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => {
                      const displayName =
                        member.full_name ||
                        member.username;

                      return (
                        <article
                          key={member.user_id}
                          className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
                        >
                          <div className="flex items-start gap-4">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={displayName}
                                className="h-14 w-14 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                <UserRound className="h-6 w-6" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <h2 className="text-lg font-semibold text-foreground">
                                {displayName}
                              </h2>

                              <p className="mt-1 text-sm text-muted-foreground">
                                @{member.username}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 space-y-2">
                            <p className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Mail className="mt-0.5 h-4 w-4 shrink-0" />

                              <span className="break-all">
                                {member.email}
                              </span>
                            </p>

                            <p className="flex items-start gap-2 text-sm text-muted-foreground">
                              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" />

                              <span>
                                {member.faculty ||
                                  "Faculty not provided"}
                              </span>
                            </p>
                          </div>

                          {member.bio && (
                            <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                              {member.bio}
                            </p>
                          )}

                          {member.interests && (
                            <div className="mt-4 rounded-lg bg-background p-3">
                              <p className="text-xs font-medium text-foreground">
                                Interests
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {member.interests}
                              </p>
                            </div>
                          )}

                          {member.skills.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {member.skills.map(
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
                          )}

                          {member.portfolio_url && (
                            <a
                              href={member.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Portfolio
                            </a>
                          )}
                          <InviteMember
                            invitedUserId={member.user_id}
                            invitedUserName={displayName}
                          />
                        </article>
                      );
                    })}
                  </section>
                </>
              )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}