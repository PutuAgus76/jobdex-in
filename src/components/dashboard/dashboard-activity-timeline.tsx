"use client";

import type { ActivityItem } from "@/lib/dashboard-data";
import { CheckCircle2, AlertTriangle, RotateCcw, Pencil } from "lucide-react";

type Props = {
  items: ActivityItem[];
};

const KIND_CONFIG = {
  approved: {
    Icon: CheckCircle2,
    color: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  revision: {
    Icon: RotateCcw,
    color: "text-orange-500",
    dot: "bg-orange-500",
  },
  stuck: {
    Icon: AlertTriangle,
    color: "text-red-500",
    dot: "bg-red-500",
  },
  created: {
    Icon: Pencil,
    color: "text-sky-500",
    dot: "bg-sky-500",
  },
};

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}d lalu`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m lalu`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}j lalu`;
  return `${Math.floor(secs / 86400)} hari lalu`;
}

export function DashboardActivityTimeline({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        Belum ada aktivitas terbaru.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800" />

      <div className="space-y-4">
        {items.map((item) => {
          const cfg = KIND_CONFIG[item.kind];
          const Icon = cfg.Icon;
          return (
            <div key={item.id} className="flex gap-3 items-start pl-1">
              <div className={`relative z-10 mt-0.5 flex-none w-5 h-5 rounded-full flex items-center justify-center ${cfg.dot} shadow-sm`}>
                <Icon className="size-2.5 text-white" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  {item.text}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {timeAgo(item.time)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
