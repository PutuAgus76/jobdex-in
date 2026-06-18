"use client";

import {
  CalendarDays,
  ClipboardList,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import type { SummaryCardData } from "@/lib/dashboard-data";

type Props = {
  data: SummaryCardData;
};

type CardConfig = {
  label: string;
  value: number;
  insight: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  iconColor: string;
  sparkColor: string;
  trend?: "up" | "down" | "neutral";
};

function MiniSparkline({ color }: { color: string }) {
  // Decorative sparkline SVG
  const points = [3, 8, 5, 12, 9, 7, 14, 10, 16, 11, 18].map((y, i) => `${i * 4},${20 - y}`).join(" ");
  return (
    <svg width="52" height="24" viewBox="0 0 44 24" className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardSummaryCards({ data }: Props) {
  const cards: CardConfig[] = [
    {
      label: "Acara Aktif",
      value: data.activeEvents,
      insight: data.activeEvents === 0
        ? "Tidak ada acara berlangsung"
        : `${data.activeEvents} acara sedang berjalan`,
      icon: CalendarDays,
      gradient: "from-sky-50 to-sky-100/60 dark:from-sky-950/40 dark:to-sky-900/20",
      iconBg: "bg-sky-100 dark:bg-sky-900/60",
      iconColor: "text-sky-600 dark:text-sky-400",
      sparkColor: "#38bdf8",
    },
    {
      label: "Job Desk Aktif",
      value: data.activeJobs,
      insight: data.activeJobs === 0
        ? "Semua tugas selesai"
        : `${data.activeJobs} tugas sedang berjalan`,
      icon: ClipboardList,
      gradient: "from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/20",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      sparkColor: "#818cf8",
    },
    {
      label: "Butuh Perhatian",
      value: data.needsAttention,
      insight: data.needsAttention === 0
        ? "Semua tugas aman"
        : `${data.needsAttention} tugas kritis / stuck / overdue`,
      icon: AlertCircle,
      gradient: data.needsAttention > 0
        ? "from-red-50 to-rose-100/60 dark:from-red-950/40 dark:to-red-900/20"
        : "from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20",
      iconBg: data.needsAttention > 0
        ? "bg-red-100 dark:bg-red-900/60"
        : "bg-emerald-100 dark:bg-emerald-900/60",
      iconColor: data.needsAttention > 0
        ? "text-red-600 dark:text-red-400"
        : "text-emerald-600 dark:text-emerald-400",
      sparkColor: data.needsAttention > 0 ? "#f87171" : "#34d399",
    },
    {
      label: "Selesai Minggu Ini",
      value: data.completedThisWeek,
      insight: data.completedThisWeek === 0
        ? "Belum ada yang selesai minggu ini"
        : `${data.completedThisWeek} tugas selesai minggu ini`,
      icon: CheckCheck,
      gradient: "from-emerald-50 to-teal-100/60 dark:from-emerald-950/40 dark:to-teal-900/20",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      sparkColor: "#34d399",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`
              relative overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700/50
              bg-gradient-to-br ${card.gradient}
              p-4 flex flex-col justify-between gap-3
              shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5
            `}
          >
            {/* Top row: icon + sparkline */}
            <div className="flex items-start justify-between">
              <div className={`flex items-center justify-center rounded-lg w-9 h-9 ${card.iconBg}`}>
                <Icon className={`size-4.5 ${card.iconColor}`} />
              </div>
              <MiniSparkline color={card.sparkColor} />
            </div>

            {/* Value */}
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 leading-none tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                {card.label}
              </p>
            </div>

            {/* Insight subtag */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug border-t border-slate-200/60 dark:border-slate-700/40 pt-2">
              {card.insight}
            </p>
          </div>
        );
      })}
    </div>
  );
}
