"use client";

import { useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Find Team", href: "/find-team" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="relative flex h-[72px] items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-8">
      {/* Logo */}
      <a
        href="/"
        className="flex flex-col leading-none text-[#16423C] focus:outline-none focus:ring-2 focus:ring-[#44766C] focus:ring-offset-2"
      >
        <span className="text-2xl font-bold">TUP</span>

        <span className="mt-1 text-[10px] font-medium tracking-wide text-[#64748B]">
          Team Up Platform
        </span>
      </a>

      {/* Desktop Navigation */}
      <ul className="hidden items-center gap-6 text-[#1E293B] md:flex">
        {navigation.map((item) => (
          <li key={item.name}>
            <a
              href={item.href}
              className="rounded-md px-2 py-1 transition-colors hover:text-[#44766C] focus:outline-none focus:ring-2 focus:ring-[#44766C] focus:ring-offset-2"
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>

      {/* Login */}
      <div className="flex items-center">
        <a
          href="/login"
          className="rounded-lg bg-[#44766C] px-5 py-2 text-white transition-colors hover:bg-[#16423C] focus:outline-none focus:ring-2 focus:ring-[#44766C] focus:ring-offset-2"
        >
          Login
        </a>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="ml-3 rounded-md p-2 text-2xl text-[#16423C] focus:outline-none focus:ring-2 focus:ring-[#44766C] md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute left-0 top-[72px] z-50 w-full border-b border-[#E2E8F0] bg-white p-6 shadow-sm md:hidden">
          <ul className="flex flex-col gap-4 text-[#1E293B]">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md px-2 py-2 transition-colors hover:bg-[#F8FAFC] hover:text-[#44766C] focus:outline-none focus:ring-2 focus:ring-[#44766C]"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}