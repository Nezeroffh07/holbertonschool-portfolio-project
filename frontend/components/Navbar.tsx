"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

type NavbarProps = {
  hideBrand?: boolean;
};

const navigation = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Find Team", href: "/find-team" },
  { name: "About", href: "/about" },
];

export default function Navbar({
  hideBrand = false,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    setIsLoggedIn(Boolean(savedUser));
    setUserChecked(true);
  }, []);

  return (
    <nav className="relative grid h-[72px] grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background px-4 md:px-8">
      <Link
        href="/"
        className={`flex flex-col leading-none text-primary ${
          hideBrand ? "md:invisible" : ""
        }`}
      >
        <span className="text-2xl font-bold">
          TUP
        </span>

        <span className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground">
          Team Up Platform
        </span>
      </Link>

      <ul className="hidden items-center gap-6 text-foreground md:flex">
        {navigation.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="rounded-md px-2 py-1 hover:text-primary"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-3">
        {userChecked && !isLoggedIn && (
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Login
          </Link>
        )}

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-md p-2 text-primary md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute left-0 top-[72px] z-50 w-full border-b border-border bg-background p-6 shadow-sm md:hidden">
          <ul className="flex flex-col gap-4">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-foreground hover:bg-secondary"
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