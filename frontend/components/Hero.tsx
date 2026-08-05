import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center bg-background px-4 py-16 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <h1 className="text-[32px] font-bold leading-tight text-foreground md:text-[40px]">
            Build Your Perfect Team
          </h1>

          <p className="mt-6 text-base leading-normal text-muted-foreground">
            Find the right people for your next project,
            startup, research, or hackathon.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/find-team"
              className="rounded-lg bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Find a Team
            </Link>

            <Link
              href="/projects"
              className="rounded-lg border border-primary px-6 py-3 text-center text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Explore Projects
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}