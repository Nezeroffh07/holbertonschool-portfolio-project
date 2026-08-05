"use client";

import { Search, Users } from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function FindTeamPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background px-4 py-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Find Team Members
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Discover students whose skills and interests
                match your project.
              </p>
            </div>

            <section className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="search"
                    placeholder="Search by name"
                    disabled
                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <select
                  disabled
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option>All skills</option>
                </select>

                <select
                  disabled
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option>All faculties</option>
                </select>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Search and filters will be available when
                profile data is connected.
              </p>
            </section>

            <section className="mt-8 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Users className="h-7 w-7 text-secondary-foreground" />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-foreground">
                No team members available
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Student profiles will appear here after the
                profiles endpoint is connected.
              </p>
            </section>
          </div>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}