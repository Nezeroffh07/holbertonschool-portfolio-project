"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must contain at least 3 characters."),

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

    confirmPassword: z
      .string()
      .min(1, "Confirm your password."),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [registerError, setRegisterError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function submitRegister(formData: RegisterFormData) {
    setRegisterError("");

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.detail || "Registration failed.");
        return;
      }

      router.push("/login");
    } catch {
      setRegisterError("Could not connect to the server.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Create an Account
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Create your account and start building your team.
        </p>

        <form
          onSubmit={handleSubmit(submitRegister)}
          className="mt-6 space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>

            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              aria-invalid={errors.username ? true : false}
              {...register("username")}
            />

            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
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
            <Label htmlFor="password">Password</Label>

            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              aria-invalid={errors.password ? true : false}
              {...register("password")}
            />

            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirm Password
            </Label>

            <Input
              id="confirmPassword"
              type="password"
              placeholder="Enter your password again"
              aria-invalid={errors.confirmPassword ? true : false}
              {...register("confirmPassword")}
            />

            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {registerError && (
            <p className="text-sm text-destructive">
              {registerError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
