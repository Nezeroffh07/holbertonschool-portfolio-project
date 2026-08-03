"use client";

import { useEffect, useState } from "react";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    setIsLoggedIn(Boolean(savedUser));
    setCheckingUser(false);
  }, []);

  const homeContent = (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </>
  );

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Loading...
        </p>
      </main>
    );
  }

  if (isLoggedIn) {
    return (
      <AuthenticatedLayout>
        {homeContent}
      </AuthenticatedLayout>
    );
  }

  return (
    <>
      <Navbar />
      {homeContent}
    </>
  );
}