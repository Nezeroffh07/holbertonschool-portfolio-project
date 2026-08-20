"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  usePathname,
} from "next/navigation";
import {
  FileText,
  FolderKanban,
  LogOut,
  Mail,
  Pencil,
  Shield,
  User,
  X,
} from "lucide-react";type UserData

import {
  API_URL,
  getAuthHeaders,
} from "@/lib/api";



type UserData = {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
};

type ProfileData = {
  full_name: string | null;
  faculty: string | null;
  avatar_url: string | null;
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
    name: "My Invitations",
    href: "/invitations",
    icon: Mail,
  },
  {
    name: "Edit Profile",
    href: "/profile/edit",
    icon: Pencil,
  },
];

export default function UserSidebar() {
  const pathname = usePathname();

  const [user, setUser] =
    useState<UserData | null>(null);

  const [profile, setProfile] =
    useState<ProfileData | null>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  useEffect(() => {
    async function loadUser() {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      try {
        const userResponse = await fetch(
          `${API_URL}/me`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!userResponse.ok) {
          return;
        }

        const userData: UserData =
          await userResponse.json();

        setUser(userData);

        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

        const profileResponse =
          await fetch(
            `${API_URL}/users/${userData.id}/profile`,
            {
              headers: getAuthHeaders(),
            }
          );

        if (profileResponse.ok) {
          const profileData: ProfileData =
            await profileResponse.json();

          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
    }

    loadUser();
    setIsOpen(false);
  }, [pathname]);

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem(
      "access_token"
    );

    window.location.href = "/";
  }

  const displayName =
    profile?.full_name ||
    user?.username ||
    "User";
      const displayName =
    profile?.full_name ||
    user?.username ||
    "User";

  const links = user?.is_admin
    ? [
        ...userLinks,
        {
          name: "Admin Panel",
          href: "/admin",
          icon: Shield,
        },
      ]
    : userLinks;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open profile menu"
        className="fixed right-16 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-[#16423C] hover:bg-secondary/80 md:hidden"
      >
        <User className="h-5 w-5" />
      </button>

      {isOpen && (
        <button
          type="button"
          onClick={() =>
            setIsOpen(false)
          }
          aria-label="Close profile menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] shrink-0 flex-col bg-[#16423C] text-white transition-transform duration-200 md:sticky md:top-0 md:translate-x-0 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/20 px-6">
          <Link
            href="/"
            onClick={() =>
              setIsOpen(false)
            }
            className="flex flex-col leading-none text-white"
          >
            <span className="text-2xl font-bold">
              TUP
            </span>

            <span className="mt-2 text-[10px] font-medium tracking-wide text-white/70">
              Team Up Platform
            </span>
          </Link>

          <button
            type="button"
            onClick={() =>
              setIsOpen(false)
            }
            aria-label="Close profile menu"
            className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/20 p-6">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D3E8BF] text-lg font-semibold text-[#16423C]">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

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

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {links.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() =>
                  setIsOpen(false)
                }
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
    </>
  );
}
