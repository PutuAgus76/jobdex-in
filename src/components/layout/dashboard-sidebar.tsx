"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardNavigation } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/role-badge";

function getNavItemClass(isActive: boolean) {
  const base =
    "rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-3";

  if (isActive) {
    return `${base} bg-slate-950 text-white hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:hover:text-white`;
  }

  return `${base} text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white`;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const navItems = getDashboardNavigation(userProfile);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <Link href="/" className="text-xl font-bold text-slate-950 dark:text-white">
          JobDex.in
        </Link>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Humas & Media Kreatif</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} className={getNavItemClass(isActive)}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="rounded-[8px] border border-slate-100 bg-slate-50 p-4 text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50">
          <p className="text-sm font-semibold">
            {userProfile?.name ?? user?.displayName ?? "Anggota"}
          </p>
          <div className="mt-2">
            <RoleBadge role={userProfile?.role} />
          </div>
          <Link
            href="/dashboard/profile"
            className="mt-3 inline-flex text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            Lihat profile
          </Link>
        </div>
      </div>
    </aside>
  );
}
