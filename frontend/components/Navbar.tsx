"use client";

import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="relative flex h-[72px] items-center justify-between px-8">
      {/* Logo */}
      <h2 className="text-2xl font-bold text-[#16423C]">TUP</h2>

      {/* Desktop Navigation */}
      <ul className="hidden gap-6 text-[#1E293B] md:flex">
        <li>
          <a
            href="/"
            className="transition-colors hover:text-[#44766C]"
          >
            Home
          </a>
        </li>

        <li>
          <a
            href="/projects"
            className="transition-colors hover:text-[#44766C]"
          >
            Projects
          </a>
        </li>

        <li>
          <a
            href="/find-team"
            className="transition-colors hover:text-[#44766C]"
          >
            Find Team
          </a>
        </li>

        <li>
          <a
            href="/about"
            className="transition-colors hover:text-[#44766C]"
          >
            About
          </a>
        </li>
      </ul>

      {/* Login Button */}
      <button className="rounded-lg bg-[#44766C] px-5 py-2 text-white">
        Login
      </button>

      {/* Mobile Menu Button */}
      <button
        className="text-2xl text-[#16423C] md:hidden"
        aria-label="Open menu"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        ☰
      </button>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute left-0 top-[72px] w-full bg-white p-6 shadow-sm md:hidden">
          <ul className="flex flex-col gap-4 text-[#1E293B]">
            <li>
              <a href="/" className="hover:text-[#44766C]">
                Home
              </a>
            </li>

            <li>
              <a href="/projects" className="hover:text-[#44766C]">
                Projects
              </a>
            </li>

            <li>
              <a href="/find-team" className="hover:text-[#44766C]">
                Find Team
              </a>
            </li>

            <li>
              <a href="/about" className="hover:text-[#44766C]">
                About
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}