"use client";

import type { TaskStatusCount } from "@/lib/dashboard-data";

type Props = {
  data: TaskStatusCount[];
};

export function DashboardDonutChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
        <div className="w-28 h-28 rounded-full border-8 border-dashed border-slate-200 dark:border-slate-700" />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Belum ada data tugas</p>
      </div>
    );
  }

  // Build SVG arcs
  const cx = 56;
  const cy = 56;
  const r = 44;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * r;

  const segments = data
    .filter((d) => d.count > 0)
    .reduce<Array<typeof data[0] & { dash: number; gap: number; offset: number }>>(
      (acc, d) => {
        const prev = acc[acc.length - 1];
        const prevOffset = prev ? prev.offset + prev.dash : 0;
        const pct = d.count / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        acc.push({ ...d, dash, gap, offset: prevOffset });
        return acc;
      },
      [],
    );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Donut */}
      <div className="relative">
        <svg width="112" height="112" viewBox="0 0 112 112">
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={circumference / 4 - seg.offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 500ms ease" }}
            />
          ))}
          {/* Center label */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-slate-800 dark:fill-slate-100"
            fontSize="18"
            fontWeight="700"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500"
            fontSize="8"
          >
            TUGAS TOTAL
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full flex-none"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {d.label}
            </span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 ml-auto flex-none">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
