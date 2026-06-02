"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardNavigation } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/role-badge";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Calendar,
  Users,
  Images,
  Bot,
  Wrench,
  Settings,
  User,
} from "lucide-react";

const sidebarIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/tasks": ClipboardList,
  "/dashboard/calendar": CalendarDays,
  "/dashboard/events": Calendar,
  "/dashboard/members": Users,
  "/dashboard/references": Images,
  "/dashboard/ai": Bot,
  "/dashboard/setup": Wrench,
  "/dashboard/settings": Settings,
  "/dashboard/profile": User,
};

export function NeoSidebar() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const navItems = getDashboardNavigation(userProfile);

  return (
    <aside className="hidden w-64 shrink-0 flex-col jd-neo-sidebar lg:flex">
      {/* Brand Header */}
      <div className="border-b-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-sidebar)] dark:bg-[#12131a] px-6 py-5">
        <Link href="/" className="text-2xl font-black tracking-wider text-neutral-950 dark:text-white hover:opacity-90 block">
          JobDex<span className="text-[#8fa882]">.in</span>
        </Link>
        <p className="mt-1 text-xs opacity-80 tracking-wide uppercase font-bold text-neutral-500 dark:text-neutral-400">
          Humas & Media Kreatif
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          const IconComponent = sidebarIconMap[item.href];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-between px-4 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                isActive
                  ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white border-neutral-950 dark:border-neutral-50 shadow-[3px_3px_0px_var(--jd-neo-shadow)]"
                  : "bg-transparent text-neutral-700 dark:text-neutral-300 border-transparent hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {IconComponent && <IconComponent className="size-4 shrink-0" />}
                <span>{item.label}</span>
              </div>
              {isActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffe699] border border-neutral-950 dark:border-neutral-50 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Area */}
      <div className="border-t-2 border-[var(--jd-neo-border)] p-4">
        <div className="p-4 rounded-xl border-2 border-neutral-950 bg-white dark:bg-neutral-900/60 shadow-[3px_3px_0px_var(--jd-neo-shadow)]">
          <p className="text-sm font-black text-neutral-900 dark:text-white truncate">
            {userProfile?.name ?? user?.displayName ?? "Anggota"}
          </p>
          <div className="mt-2">
            <RoleBadge role={userProfile?.role} />
          </div>
          <Link
            href="/dashboard/profile"
            className="mt-3 inline-block text-xs font-bold text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            Lihat Profile →
          </Link>
        </div>
      </div>
    </aside>
  );
}
