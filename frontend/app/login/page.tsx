"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address.")
    .refine(
      (email) => email.toLowerCase().endsWith("@qu.edu.az"),
      "Enter a valid email address."
    ),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters."),
});

type LoginFormData = z.infer<typeof loginSchema>;

type User = {
  id: number;
  username: string;
  email: string;
};

type LoginResponse = {
  message: string;
  user: User;
};

export default function LoginPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function submitLogin(formData: LoginFormData) {
    setLoginError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError("Email or password is incorrect.");
        return;
      }

      const loginData: LoginResponse = data;

      localStorage.setItem(
        "user",
        JSON.stringify(loginData.user)
      );

      router.push("/");
    } catch {
      setLoginError("Could not connect to the server.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Login
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Login to create projects and join a team.
        </p>

        <form
          onSubmit={handleSubmit(submitLogin)}
          className="mt-6 space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">
              University Email
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="student@qu.edu.az"
              aria-invalid={errors.email ? true : false}
              {...register("email")}
            />

            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password
            </Label>

            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              aria-invalid={errors.password ? true : false}
              {...register("password")}
            />

            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {loginError && (
            <p className="text-sm text-destructive">
              {loginError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}