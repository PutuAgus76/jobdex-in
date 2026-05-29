"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDashboardNavigation } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { useAuth } from "@/hooks/use-auth";
import { logoutUser } from "@/lib/firebase/auth";

export function DashboardTopbar() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navItems = getDashboardNavigation(userProfile);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutUser();
    router.replace("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex min-h-16 flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" className="text-lg font-bold text-slate-950">
              JobDex.in
            </Link>
            <Badge>Dashboard</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 lg:mt-0">
            Pantau koordinasi job desk, acara, anggota, dan referensi desain.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden text-right text-sm sm:block">
            <p className="font-semibold text-slate-950">
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
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Keluar..." : "Logout"}
          </Button>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-3 sm:px-6 lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-[8px] bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
