"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CTA() {
  const [buttonLink, setButtonLink] =
    useState("/register");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setButtonLink("/projects/create");
    }
  }, []);

  return (
    <section className="bg-[#16423C] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-[24px] font-semibold text-white md:text-[28px]">
          Ready to Build Your Team?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-normal text-[#E2E8F0]">
          Find the right people for your next project,
          startup, research, or hackathon.
        </p>

        <Link
          href={buttonLink}
          className="mt-8 inline-block rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
