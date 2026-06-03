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
      <div className="border-b-2 border-border bg-[var(--jd-neo-sidebar)] px-4 py-5 flex items-center justify-between gap-1">
        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <Link href="/" className="text-2xl font-black tracking-wider text-foreground hover:opacity-90 block">
              JobDex<span className="text-[var(--main)]">.in</span>
            </Link>
            <p className="mt-1 text-[10px] opacity-80 tracking-wide uppercase font-bold text-neutral-500 dark:text-neutral-455 truncate">
              Humas & Media Kreatif
            </p>
          </div>
        ) : (
          <div className="flex-1 flex justify-center">
            <Link href="/" className="text-2xl font-black tracking-wider text-foreground hover:opacity-90 block">
              J<span className="text-[var(--main)]">D</span>
            </Link>
          </div>
        )}

        {/* Toggle Collapse Button */}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-base border-2 border-border bg-secondary-background text-foreground shadow-[2px_2px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0"
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
              className={`relative flex items-center rounded-base border-2 font-semibold text-sm transition-all ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-4 py-2.5"
              } ${
                isActive
                  ? "bg-[var(--main)] text-neutral-955 border-border shadow-[3px_3px_0px_var(--border)]"
                  : "bg-transparent text-neutral-700 dark:text-neutral-300 border-transparent hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                {IconComponent && <IconComponent className="size-4 shrink-0" />}
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && isActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-border shrink-0 dark:bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      {!isCollapsed && (
        <div className="border-t-2 border-border p-4 text-center bg-[var(--jd-neo-sidebar)]">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
            JobDex.in Workspace
          </span>
        </div>
      )}
    </aside>
  );
}
