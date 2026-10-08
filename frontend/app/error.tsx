"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Something went wrong
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this page. Please try again or return to the home page.
      </p>

      {error.message && (
        <p className="mt-3 max-w-lg rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
          {error.message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Home className="h-4 w-4" />
          Projects
        </Link>
      </div>
    </div>
  );
}
