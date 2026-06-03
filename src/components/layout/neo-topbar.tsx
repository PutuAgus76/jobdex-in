"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { logoutUser } from "@/lib/firebase/auth";
import { showSuccess } from "@/lib/swal";
import { useTheme } from "@/components/theme/theme-provider";
import { USER_ROLE_LABELS } from "@/lib/roles";
import { Sun, Moon, LogOut, User, Home, ChevronDown } from "lucide-react";

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Ringkasan";
  if (pathname.startsWith("/dashboard/tasks")) return "Job Desk";
  if (pathname.startsWith("/dashboard/events")) return "Acara";
  if (pathname.startsWith("/dashboard/members")) return "Anggota";
  if (pathname.startsWith("/dashboard/references")) return "Referensi";
  if (pathname.startsWith("/dashboard/ai")) return "AI Assistant";
  if (pathname.startsWith("/dashboard/setup")) return "Setup";
  if (pathname.startsWith("/dashboard/settings")) return "Pengaturan";
  if (pathname.startsWith("/dashboard/profile")) return "Profile";
  return "Dashboard";
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NeoTopbar(props: {
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutUser();
    await showSuccess("Anda berhasil keluar dari akun.", "Logout Sukses");
    router.replace("/login");
  }

  const isDark = theme === "dark";

  return (
    <header className="jd-neo-topbar sticky top-0 z-40 w-full">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Title and Badge Info */}
        <div className="flex items-center gap-3">
          <span className="jd-neo-badge bg-main text-main-foreground">
            {getPageTitle(pathname)}
          </span>
          <p className="hidden md:block text-xs font-bold text-neutral-500 dark:text-neutral-400">
            Humas & Media Kreatif
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          
          {/* Theme toggle */}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center jd-neo-button p-0"
              title={isDark ? "Aktifkan light mode" : "Aktifkan dark mode"}
            >
              {isDark ? (
                <Sun size={18} color="#facc15" fill="#facc15" className="shrink-0" />
              ) : (
                <Moon size={18} color="currentColor" fill="currentColor" className="shrink-0" />
              )}
            </button>
          )}

          {/* User Info & Quick Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="jd-neo-button h-10 px-1.5 sm:px-3 flex items-center gap-2 text-sm"
              >
                {/* Avatar */}
                {userProfile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile?.name || "Avatar"}
                    className="size-8 rounded-full border-2 border-[var(--border)] object-cover shrink-0"
                  />
                ) : (
                  <div className="size-8 rounded-full border-2 border-[var(--border)] bg-[var(--jd-neo-orange)] flex items-center justify-center text-xs font-black text-neutral-950 shrink-0">
                    {getInitials(userProfile?.name || user?.displayName)}
                  </div>
                )}

                {/* Name & Role (Desktop) */}
                <div className="hidden sm:flex flex-col items-start text-left leading-tight">
                  <span className="font-bold text-foreground text-xs truncate max-w-[120px]">
                    {userProfile?.name ?? user?.displayName ?? "User"}
                  </span>
                  <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">
                    {userProfile?.role ? USER_ROLE_LABELS[userProfile.role] : "Anggota"}
                  </span>
                </div>

                <ChevronDown size={14} className="text-foreground shrink-0 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 z-20 jd-neo-card p-2 flex flex-col gap-1 shadow-shadow">
                    <div className="px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Akun Anda</p>
                      <p className="text-xs font-black text-foreground truncate">
                        {userProfile?.name ?? user?.displayName ?? "Anggota"}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-bold text-xs text-neutral-800 dark:text-neutral-200"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={14} />
                      Profile
                    </Link>
                    <Link
                      href="/"
                      className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-bold text-xs text-neutral-800 dark:text-neutral-200"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Home size={14} />
                      Landing Page
                    </Link>
                    <hr className="border-neutral-200 dark:border-neutral-700 my-1" />
                    <button
                      type="button"
                      disabled={isLoggingOut}
                      onClick={() => {
                        setDropdownOpen(false);
                        void handleLogout();
                      }}
                      className="flex w-full text-left items-center gap-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded font-bold text-xs"
                    >
                      <LogOut size={14} />
                      {isLoggingOut ? "Keluar..." : "Logout"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
