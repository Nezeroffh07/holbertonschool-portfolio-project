"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  API_URL,
  getAuthHeaders,
} from "../lib/api";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        const user = await response.json();

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        setCheckingUser(false);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    }

    checkUser();
  }, [router]);

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Checking account...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}