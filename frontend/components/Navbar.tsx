"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Find Team", href: "/find-team" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="relative flex h-[72px] items-center justify-between border-b border-border bg-background px-4 md:px-8">
      <Link
        href="/"
        className="flex flex-col leading-none text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className="text-2xl font-bold">TUP</span>

        <span className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground">
          Team Up Platform
        </span>
      </Link>

      <ul className="hidden items-center gap-6 text-foreground md:flex">
        {navigation.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="rounded-md px-2 py-1 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Login
        </Link>

        <button
          type="button"
          className="rounded-md p-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute left-0 top-[72px] z-50 w-full border-b border-border bg-background p-6 shadow-sm md:hidden">
          <ul className="flex flex-col gap-4 text-foreground">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md px-2 py-2 hover:bg-secondary hover:text-secondary-foreground"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}