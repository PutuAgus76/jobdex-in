"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getDashboardNavigation } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { logoutUser } from "@/lib/firebase/auth";

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

import { showSuccess } from "@/lib/swal";

export function DashboardTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = getDashboardNavigation(userProfile);
  const bottomPaths = [
    "/dashboard",
    "/dashboard/tasks",
    "/dashboard/events",
    "/dashboard/references",
    "/dashboard/ai"
  ];
  const extraItems = navItems.filter((item) => !bottomPaths.includes(item.href));

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutUser();
    await showSuccess("Anda berhasil keluar dari akun.", "Logout Sukses");
    router.replace("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-black text-slate-950 dark:text-white">
              JobDex.in
            </Link>
            <Badge>{getPageTitle(pathname)}</Badge>
          </div>
          <p className="hidden md:block mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pantau koordinasi job desk, acara, anggota, dan referensi desain.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Desktop Direct Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right text-sm mr-2">
              <p className="font-semibold text-slate-950 dark:text-white leading-none">
                {userProfile?.name ?? user?.displayName ?? "Anggota"}
              </p>
              <div className="mt-1 flex justify-end">
                <RoleBadge role={userProfile?.role} />
              </div>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/profile">Profile</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/">Landing</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Keluar..." : "Logout"}
            </Button>
          </div>

          {/* Theme Toggle is always visible and extremely compact */}
          <ThemeToggle />

          {/* Mobile Account Menu Dropdown */}
          <div className="relative sm:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMenuOpen(!menuOpen)}
              className="gap-1 px-2.5"
            >
              <span className="text-xs">Menu</span>
              <span className="text-[10px] opacity-60">▼</span>
            </Button>

            {menuOpen ? (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 z-20 rounded-[8px] p-2 space-y-1 jd-surface shadow-xl">
                  <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-950 dark:text-slate-50 truncate">
                      {userProfile?.name ?? user?.displayName ?? "Anggota"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {userProfile?.role?.replace("_", " ") ?? "Anggota"}
                    </p>
                  </div>
                  {extraItems.map((item) => (
                    <Button 
                      key={item.href} 
                      asChild 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-left h-9 px-2" 
                      onClick={() => setMenuOpen(false)}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  ))}
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start text-left h-9 px-2" onClick={() => setMenuOpen(false)}>
                    <Link href="/">Landing Page</Link>
                  </Button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="w-full justify-start h-9 px-2 text-left"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleLogout();
                    }}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Keluar..." : "Logout"}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
