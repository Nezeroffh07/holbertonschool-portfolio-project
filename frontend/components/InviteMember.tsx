"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  Send,
  X,
} from "lucide-react";

import {
  API_URL,
  getAuthHeaders,
} from "@/lib/api";

type User = {
  id: number;
  username: string;
  email: string;
};

type Project = {
  id: number;
  title: string;
  owner_id: number;
  status: string;
};

type TeamMember = {
  user_id: number;
};

type InviteMemberProps = {
  invitedUserId: number;
  invitedUserName: string;
};

export default function InviteMember({
  invitedUserId,
  invitedUserName,
}: InviteMemberProps) {
  const [isOwnProfile, setIsOwnProfile] =
    useState(false);

  const [checkingUser, setCheckingUser] =
    useState(true);

  const [formOpen, setFormOpen] =
    useState(false);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState("");

  const [role, setRole] = useState("");
  const [message, setMessage] =
    useState("");

  const [
    loadingProjects,
    setLoadingProjects,
  ] = useState(false);

  const [sending, setSending] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    async function checkCurrentUser() {
      try {
        const response = await fetch(
          `${API_URL}/me`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) {
          return;
        }

        const user: User =
          await response.json();

        setIsOwnProfile(
          user.id === invitedUserId
        );
      } finally {
        setCheckingUser(false);
      }
    }

    checkCurrentUser();
  }, [invitedUserId]);

  async function openInvitationForm() {
    setError("");
    setSuccess("");
    setLoadingProjects(true);

    try {
      const [
        userResponse,
        projectsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/me`, {
          headers: getAuthHeaders(),
        }),

        fetch(`${API_URL}/projects`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!userResponse.ok) {
        throw new Error(
          "Your account could not be loaded."
        );
      }

      if (!projectsResponse.ok) {
        throw new Error(
          "Projects could not be loaded."
        );
      }

      const user: User =
        await userResponse.json();

      if (user.id === invitedUserId) {
        setIsOwnProfile(true);

        throw new Error(
          "You cannot invite yourself."
        );
      }

      const allProjects: Project[] =
        await projectsResponse.json();

      const ownedOpenProjects =
        allProjects.filter(
          (project) =>
            project.owner_id === user.id &&
            project.status.toLowerCase() ===
              "open"
        );

      const availableProjects =
        await Promise.all(
          ownedOpenProjects.map(
            async (project) => {
              try {
                const teamResponse =
                  await fetch(
                    `${API_URL}/projects/${project.id}/team`,
                    {
                      headers:
                        getAuthHeaders(),
                    }
                  );

                if (!teamResponse.ok) {
                  return project;
                }

                const team: TeamMember[] =
                  await teamResponse.json();

                const alreadyMember =
                  team.some(
                    (member) =>
                      member.user_id ===
                      invitedUserId
                  );

                return alreadyMember
                  ? null
                  : project;
              } catch {
                return project;
              }
            }
          )
        );

      const validProjects =
        availableProjects.filter(
          (
            project
          ): project is Project =>
            project !== null
        );

      setProjects(validProjects);

      setSelectedProjectId(
        validProjects.length > 0
          ? String(validProjects[0].id)
          : ""
      );

      setFormOpen(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Invitation form could not be opened."
      );
    } finally {
      setLoadingProjects(false);
    }
  }

  async function sendInvitation(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedProjectId) {
      setError(
        "Please select a project."
      );
      return;
    }

    if (!role.trim()) {
      setError("Please enter a role.");
      return;
    }

    if (message.trim().length < 5) {
      setError(
        "Invitation message must contain at least 5 characters."
      );
      return;
    }

    setSending(true);

    try {
      const teamResponse = await fetch(
        `${API_URL}/projects/${selectedProjectId}/team`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (teamResponse.ok) {
        const team: TeamMember[] =
          await teamResponse.json();

        const alreadyMember = team.some(
          (member) =>
            member.user_id ===
            invitedUserId
        );

        if (alreadyMember) {
          throw new Error(
            "This user is already a member of the selected project."
          );
        }
      }

      const response = await fetch(
        `${API_URL}/projects/${selectedProjectId}/invitations`,
        {
          method: "POST",
          headers: getAuthHeaders(),

          body: JSON.stringify({
            invited_user_id:
              invitedUserId,
            role: role.trim(),
            message: message.trim(),
          }),
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
            : "Invitation could not be sent."
        );
      }

      setSuccess(
        `Invitation sent to ${invitedUserName}.`
      );

      setRole("");
      setMessage("");
      setFormOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Invitation could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  if (checkingUser || isOwnProfile) {
    return null;
  }

  return (
    <div className="mt-auto pt-5">
      {success && (
        <p className="mb-3 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          {success}
        </p>
      )}

      {error && (
        <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!formOpen && (
        <button
          type="button"
          onClick={openInvitationForm}
          disabled={loadingProjects}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />

          {loadingProjects
            ? "Loading..."
            : "Invite to Project"}
        </button>
      )}

      {formOpen && (
        <form
          onSubmit={sendInvitation}
          className="rounded-lg border border-border bg-background p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-foreground">
              Invite {invitedUserName}
            </p>

            <button
              type="button"
              onClick={() =>
                setFormOpen(false)
              }
              aria-label="Close invitation form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              You have no available open
              projects for this user.
            </p>
          ) : (
            <>
              <select
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(
                    event.target.value
                  )
                }
                className="mt-4 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
              >
                {projects.map(
                  (project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.title}
                    </option>
                  )
                )}
              </select>

              <input
                type="text"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value
                  )
                }
                placeholder="Team role"
                className="mt-3 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
              />

              <textarea
                rows={4}
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder="Invitation message"
                className="mt-3 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={sending}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                <Send className="h-4 w-4" />

                {sending
                  ? "Sending..."
                  : "Send Invitation"}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}