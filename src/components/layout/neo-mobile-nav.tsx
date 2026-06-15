"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardNavigation } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ClipboardList, 
  CalendarDays, 
  Images, 
  Bot 
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/tasks": ClipboardList,
  "/dashboard/events": CalendarDays,
  "/dashboard/references": Images,
  "/dashboard/ai": Bot,
};

export function NeoMobileNav() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  
  if (!userProfile) return null;
  
  const navItems = getDashboardNavigation(userProfile);
  const bottomPaths = [
    "/dashboard",
    "/dashboard/tasks",
    "/dashboard/events",
    "/dashboard/references",
    "/dashboard/ai"
  ];
  
  const activeBottomItems = navItems.filter((item) => bottomPaths.includes(item.href));

  return (
    <nav className="fixed left-0 right-0 bottom-0 z-50 grid grid-cols-5 gap-1 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden">
      {activeBottomItems.map((item) => {
        const IconComponent = iconMap[item.href];
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 rounded-md py-1.5 px-0.5 font-medium text-[10px] transition-all ${
              isActive
                ? "text-sky-600 dark:text-sky-400 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {IconComponent ? <IconComponent className="size-5" /> : null}
            <span className="truncate max-w-full mt-0.5">
              {item.href === "/dashboard/ai" ? "AI" : item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

