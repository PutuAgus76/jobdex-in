"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDashboardNavigation } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { logoutUser } from "@/lib/firebase/auth";

function getMobileNavItemClass(isActive: boolean) {
  const base = "shrink-0 px-3 py-2 text-sm font-semibold transition-colors";

  if (isActive) {
    return `${base} jd-sidebar-active`;
  }

  return `${base} jd-sidebar-item`;
}

export function DashboardTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navItems = getDashboardNavigation(userProfile);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutUser();
    router.replace("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-h-16 flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" className="text-lg font-bold text-slate-950 dark:text-white">
              JobDex.in
            </Link>
            <Badge>Dashboard</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 lg:mt-0">
            Pantau koordinasi job desk, acara, anggota, dan referensi desain.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden text-right text-sm sm:block">
            <p className="font-semibold text-slate-950 dark:text-white">
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
          <ThemeToggle />
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
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6 lg:hidden">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={getMobileNavItemClass(isActive)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
