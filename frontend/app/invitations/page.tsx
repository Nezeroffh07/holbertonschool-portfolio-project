"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  Check,
  Clock,
  Mail,
  UserCheck,
  X,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  API_URL,
  getAuthHeaders,
} from "@/lib/api";

type Invitation = {
  id: number;
  project_id: number;
  project_title: string;
  owner_id: number;
  owner_username: string;
  role: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export default function MyInvitationsPage() {
  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    async function loadInvitations() {
      try {
        const response = await fetch(
          `${API_URL}/invitations/me`,
          {
            headers: getAuthHeaders(),
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
              : "Invitations could not be loaded."
          );
        }

        setInvitations(responseData);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Invitations could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInvitations();
  }, []);

  async function updateInvitation(
    invitationId: number,
    status: "accepted" | "rejected"
  ) {
    setError("");
    setSuccessMessage("");
    setUpdatingId(invitationId);

    try {
      const response = await fetch(
        `${API_URL}/invitations/${invitationId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status,
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
            : "Invitation could not be updated."
        );
      }

      setInvitations(
        (currentInvitations) =>
          currentInvitations.map(
            (invitation) =>
              invitation.id ===
              invitationId
                ? {
                    ...invitation,
                    status:
                      responseData.status ||
                      status,
                  }
                : invitation
          )
      );

      setSuccessMessage(
        status === "accepted"
          ? "Invitation accepted successfully."
          : "Invitation rejected."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Invitation could not be updated."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusStyle(
    status: string
  ) {
    if (status === "accepted") {
      return "bg-secondary text-secondary-foreground";
    }

    if (status === "rejected") {
      return "bg-destructive/10 text-destructive";
    }

    return "bg-muted text-foreground";
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-bold text-foreground">
              My Invitations
            </h1>

            <p className="mt-2 text-muted-foreground">
              Review invitations from project owners.
            </p>

            {loading && (
              <div className="mt-8 flex items-center gap-3 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />

                <p>Loading invitations...</p>
              </div>
            )}

            {error && (
              <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="mt-8 rounded-lg bg-secondary p-4 text-secondary-foreground">
                {successMessage}
              </p>
            )}

            {!loading &&
              !error &&
              invitations.length === 0 && (
                <section className="mt-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                  <Mail className="mx-auto h-9 w-9 text-primary" />

                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    No invitations yet
                  </h2>

                  <p className="mt-2 text-muted-foreground">
                    Invitations from project owners will
                    appear here.
                  </p>

                  <Link
                    href="/find-team"
                    className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Explore TUP Community
                  </Link>
                </section>
              )}

            {!loading &&
              invitations.length > 0 && (
                <section className="mt-8 space-y-5">
                  {invitations.map(
                    (invitation) => (
                      <article
                        key={invitation.id}
                        className="rounded-xl border border-border bg-card p-6 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <Link
                              href={`/projects/${invitation.project_id}`}
                              className="text-xl font-semibold text-foreground hover:text-primary"
                            >
                              {
                                invitation.project_title
                              }
                            </Link>

                            <p className="mt-2 text-sm text-muted-foreground">
                              Invited by{" "}
                              <span className="font-medium text-foreground">
                                @
                                {
                                  invitation.owner_username
                                }
                              </span>
                            </p>

                            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-4 w-4" />

                              {new Date(
                                invitation.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(
                              invitation.status
                            )}`}
                          >
                            {invitation.status}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-lg bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Proposed Role
                            </p>

                            <p className="mt-1 font-medium text-foreground">
                              {invitation.role ||
                                "Role not provided"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Project Owner
                            </p>

                            <p className="mt-1 font-medium text-foreground">
                              @
                              {
                                invitation.owner_username
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-border p-4">
                          <p className="text-xs font-medium text-foreground">
                            Invitation Message
                          </p>

                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {invitation.message ||
                              "No invitation message was provided."}
                          </p>
                        </div>

                        {invitation.status ===
                          "pending" && (
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                updateInvitation(
                                  invitation.id,
                                  "rejected"
                                )
                              }
                              disabled={
                                updatingId ===
                                invitation.id
                              }
                              className="flex items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateInvitation(
                                  invitation.id,
                                  "accepted"
                                )
                              }
                              disabled={
                                updatingId ===
                                invitation.id
                              }
                              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {updatingId ===
                              invitation.id ? (
                                "Updating..."
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  Accept
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {invitation.status ===
                          "accepted" && (
                          <Link
                            href={`/projects/${invitation.project_id}/team`}
                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                          >
                            <UserCheck className="h-4 w-4" />
                            View Team Members
                          </Link>
                        )}
                      </article>
                    )
                  )}
                </section>
              )}
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}