"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  FolderKanban,
  LogOut,
  Pencil,
  User,
} from "lucide-react";

type UserData = {
  id: number;
  username: string;
  email: string;
};

type ProfileData = {
  full_name: string | null;
  faculty: string | null;
};

const userLinks = [
  {
    name: "My Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "My Projects",
    href: "/my-projects",
    icon: FolderKanban,
  },
  {
    name: "My Applications",
    href: "/applications",
    icon: FileText,
  },
  {
    name: "Edit Profile",
    href: "/profile/edit",
    icon: Pencil,
  },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(
    null
  );

  useEffect(() => {
    async function loadUser() {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        return;
      }

      const userData: UserData = JSON.parse(savedUser);
      setUser(userData);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/users/${userData.id}/profile`
        );

        if (response.ok) {
          const profileData: ProfileData =
            await response.json();

          setProfile(profileData);
        }
      } catch {
        setProfile(null);
      }
    }

    loadUser();
  }, [pathname]);

  function logout() {
    localStorage.removeItem("user");
    router.push("/");
  }

  const displayName =
    profile?.full_name || user?.username || "User";

  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 bg-[#16423C] text-white md:flex md:flex-col">
      <div className="flex h-[72px] items-center border-b border-white/20 px-6">
        <Link
          href="/"
          className="flex flex-col leading-none text-white"
        >
          <span className="text-2xl font-bold">
            TUP
          </span>

          <span className="mt-2 text-[10px] font-medium tracking-wide text-white/70">
            Team Up Platform
          </span>
        </Link>
      </div>

      <div className="border-b border-white/20 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D3E8BF] text-lg font-semibold text-[#16423C]">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">
              {displayName}
            </h2>

            {profile?.faculty && (
              <p className="mt-1 truncate text-xs text-white/80">
                {profile.faculty}
              </p>
            )}

            <p className="mt-1 truncate text-xs text-white/60">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {userLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                isActive
                  ? "bg-[#D3E8BF] text-[#16423C]"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/20 p-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}