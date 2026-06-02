"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardNavigation } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
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
  ChevronLeft,
  ChevronRight,
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

type NeoSidebarProps = {
  isCollapsed?: boolean;
  onToggle?: () => void;
};

export function NeoSidebar({ isCollapsed = false, onToggle }: NeoSidebarProps) {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const navItems = getDashboardNavigation(userProfile);

  return (
    <aside
      className={`hidden shrink-0 flex-col jd-neo-sidebar lg:flex h-screen sticky top-0 overflow-hidden transition-all duration-200 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="border-b-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-sidebar)] dark:bg-[#12131a] px-4 py-5 flex items-center justify-between gap-1">
        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <Link href="/" className="text-2xl font-black tracking-wider text-neutral-950 dark:text-white hover:opacity-90 block">
              JobDex<span className="text-[#059669] dark:text-[#10b981]">.in</span>
            </Link>
            <p className="mt-1 text-[10px] opacity-80 tracking-wide uppercase font-bold text-neutral-500 dark:text-neutral-400 truncate">
              Humas & Media Kreatif
            </p>
          </div>
        ) : (
          <div className="flex-1 flex justify-center">
            <Link href="/" className="text-2xl font-black tracking-wider text-neutral-950 dark:text-white hover:opacity-90 block">
              J<span className="text-[#059669] dark:text-[#10b981]">D</span>
            </Link>
          </div>
        )}

        {/* Toggle Collapse Button */}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-md border border-neutral-950 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-[1px_1px_0px_var(--jd-neo-shadow)] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_var(--jd-neo-shadow)] active:translate-y-[1px] active:shadow-[0px_0px_0px_var(--jd-neo-shadow)] transition-all cursor-pointer shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
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
              title={item.label}
              className={`relative flex items-center rounded-lg border-2 font-semibold text-sm transition-all ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-4 py-2.5"
              } ${
                isActive
                  ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white border-neutral-950 dark:border-neutral-50 shadow-[3px_3px_0px_var(--jd-neo-shadow)]"
                  : "bg-transparent text-neutral-700 dark:text-neutral-300 border-transparent hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                {IconComponent && <IconComponent className="size-4 shrink-0" />}
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && isActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffe699] border border-neutral-950 dark:border-neutral-50 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      {!isCollapsed && (
        <div className="border-t-2 border-[var(--jd-neo-border)] p-4 text-center bg-[var(--jd-neo-sidebar)] dark:bg-[#0b0c10]">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
            JobDex.in Workspace
          </span>
        </div>
      )}
    </aside>
  );
}
