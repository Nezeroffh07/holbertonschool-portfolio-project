import Link from "next/link";
import {
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Search,
  Users,
} from "lucide-react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

const features = [
  {
    title: "Create Projects",
    description:
      "Share your project idea, required skills, open positions, and application deadline.",
    icon: FolderKanban,
  },
  {
    title: "Discover Opportunities",
    description:
      "Explore academic, startup, research, and hackathon projects.",
    icon: Search,
  },
  {
    title: "Build Your Team",
    description:
      "Find students with different skills and create stronger project teams.",
    icon: Users,
  },
];

const useCases = [
  "Capstone Projects",
  "Startup Teams",
  "Research Projects",
  "Hackathons",
  "Competitions",
  "Social Projects",
  "Volunteer Initiatives",
];

export default function AboutPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <main className="min-h-[calc(100vh-72px)] bg-background">
          <section className="border-b border-border bg-secondary/30 px-4 py-10 md:px-8 md:py-12">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                About the Platform
              </p>

              <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-tight text-foreground md:text-3xl">
                Connecting Ideas with the Right People
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                TUP helps Karabakh University students find
                suitable team members for academic and
                innovative projects.
              </p>
            </div>
          </section>

          <section className="px-4 py-12 md:px-8 md:py-16">
            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
              <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Lightbulb className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-foreground">
                  The Problem
                </h2>

                <p className="mt-4 leading-7 text-muted-foreground">
                  Many valuable ideas never become real projects
                  because students cannot find people with the
                  right skills and interests.
                </p>

                <p className="mt-3 leading-7 text-muted-foreground">
                  Team formation often depends on personal
                  connections, making collaboration between
                  different faculties more difficult.
                </p>
              </article>

              <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <GraduationCap className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-foreground">
                  Our Purpose
                </h2>

                <p className="mt-4 leading-7 text-muted-foreground">
                  TUP provides one clear and accessible place
                  where students can present their skills,
                  discover projects, apply for positions, and
                  form teams.
                </p>

                <p className="mt-3 leading-7 text-muted-foreground">
                  The platform encourages collaboration between
                  students from different faculties and fields.
                </p>
              </article>
            </div>
          </section>

          <section className="border-y border-border bg-card px-4 py-12 md:px-8 md:py-16">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground">
                  What You Can Do with TUP
                </h2>

                <p className="mt-3 text-muted-foreground">
                  Everything needed to start building a project
                  team.
                </p>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <article
                      key={feature.title}
                      className="rounded-xl border border-border bg-background p-6"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="mt-5 text-xl font-semibold text-foreground">
                        {feature.title}
                      </h3>

                      <p className="mt-3 leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="px-4 py-12 md:px-8 md:py-16">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-8 rounded-xl border border-border bg-card p-6 shadow-sm md:grid-cols-2 md:p-8">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    Where TUP Can Be Used
                  </h2>

                  <p className="mt-3 leading-7 text-muted-foreground">
                    Students can use the platform for academic,
                    innovative, and community projects.
                  </p>
                </div>

                <div className="flex flex-wrap content-start gap-3">
                  {useCases.map((useCase) => (
                    <span
                      key={useCase}
                      className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-border bg-secondary/30 px-4 py-12 text-center md:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold text-foreground">
                Start Building Your Team
              </h2>

              <p className="mt-3 text-muted-foreground">
                Explore available projects or share your own
                idea.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/projects"
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Explore Projects
                </Link>

                <Link
                  href="/projects/create"
                  className="rounded-lg border border-primary px-5 py-3 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Create Project
                </Link>
              </div>
            </div>
          </section>
        </main>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}