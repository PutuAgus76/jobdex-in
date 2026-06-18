"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import type { FocusItem } from "@/lib/dashboard-data";

type Props = {
  items: FocusItem[];
};

const KIND_CONFIG = {
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
  },
  stuck: {
    label: "Stuck",
    icon: AlertTriangle,
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
  },
  h1: {
    label: "H-1",
    icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  },
  approval: {
    label: "Menunggu Approval",
    icon: CheckCircle2,
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
  },
  revision: {
    label: "Perlu Revisi",
    icon: RotateCcw,
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    text: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
  },
};

function deadlineLabel(item: FocusItem): string {
  if (item.diffDays === null) return "—";
  if (item.diffDays < 0) return `Overdue ${Math.abs(item.diffDays)}h`;
  if (item.diffDays === 0) return "Hari ini";
  return `H-${item.diffDays}`;
}

export function DashboardFocusPanel({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <Loader2 className="size-7 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Tidak ada item yang perlu perhatian hari ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const cfg = KIND_CONFIG[item.kind];
        const Icon = cfg.icon;
        return (
          <Link
            key={item.id}
            href={`/dashboard/tasks/${item.taskId}`}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg border
              transition-all duration-150 group
              ${cfg.bg} ${cfg.border}
              hover:shadow-sm hover:-translate-y-px
            `}
          >
            <Icon className={`size-4 shrink-0 ${cfg.text}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {item.taskName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {item.picName} · {item.eventOrDivision}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-none">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>
                {deadlineLabel(item)}
              </span>
              <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
