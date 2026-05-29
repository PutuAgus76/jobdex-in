"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/role-badge";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const navItems = getDashboardNavigation(userProfile);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-5">
        <Link href="/" className="text-xl font-bold text-slate-950">
          JobDex.in
        </Link>
        <p className="mt-1 text-xs text-slate-500">Humas & Media Kreatif</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-[8px] px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                isActive && "bg-slate-950 text-white hover:bg-slate-900 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-[8px] bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">
            {userProfile?.name ?? user?.displayName ?? "Anggota"}
          </p>
          <div className="mt-2">
            <RoleBadge role={userProfile?.role} />
          </div>
          <Link
            href="/dashboard/profile"
            className="mt-3 inline-flex text-xs font-semibold text-slate-950"
          >
            Lihat profile
          </Link>
        </div>
      </div>
    </aside>
  );
}
