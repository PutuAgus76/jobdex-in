"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardData, type DashboardData } from "@/lib/dashboard-data";
import { getDivisions } from "@/lib/firebase/divisions";
import type { Division } from "@/types";

import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary-cards";
import { DashboardDonutChart } from "@/components/dashboard/dashboard-donut-chart";
import { DashboardBarChart } from "@/components/dashboard/dashboard-bar-chart";
import { DashboardFocusPanel } from "@/components/dashboard/dashboard-focus-panel";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { TaskRiskSection } from "@/components/dashboard/task-risk-section";

import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import {
  PieChart,
  BarChart3,
  Crosshair,
  Activity,
  RefreshCw,
} from "lucide-react";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-xl border border-slate-200/80 dark:border-slate-700/50
        bg-white dark:bg-slate-900/60
        shadow-sm overflow-hidden
        ${className}
      `}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Icon className="size-4 text-sky-500 dark:text-sky-400 shrink-0" />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800 lg:col-span-2" />
      </div>
      {/* Focus + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function RoleDashboardContent() {
  const { userProfile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [divisionsList, setDivisionsList] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState("all");

  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.role === "super_admin") {
      getDivisions()
        .then((divs) => {
          setDivisionsList(divs.filter((d) => d.is_active !== false));
        })
        .catch(() => {});
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const result = await getDashboardData(userProfile!, selectedDivisionId);
        if (mounted) setData(result);
      } catch (err) {
        console.error("[Dashboard] Load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [userProfile, refreshKey, selectedDivisionId]);

  if (!userProfile) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Selamat pagi";
    if (h < 17) return "Selamat siang";
    return "Selamat sore";
  })();

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="info">Dashboard</Badge>
            <RoleBadge role={userProfile.role} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {greeting},{" "}
            <span className="text-sky-600 dark:text-sky-400">
              {userProfile.name.split(" ")[0]}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {selectedDivisionId !== "all" && userProfile.role === "super_admin"
              ? `Ringkasan koordinasi untuk Divisi ${divisionsList.find(d => d.id === selectedDivisionId)?.name || ""} — diperbarui secara real-time.`
              : "Ringkasan koordinasi JobDex.in — diperbarui secara real-time."}
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 mt-1 shrink-0">
          {userProfile.role === "super_admin" && (
            <select
              value={selectedDivisionId}
              onChange={(e) => setSelectedDivisionId(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-955/30"
            >
              <option value="all">Semua Divisi</option>
              {divisionsList.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh dashboard"
            className="
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
              rounded-lg border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-900
              text-slate-600 dark:text-slate-400
              hover:bg-slate-50 dark:hover:bg-slate-800
              transition-all duration-150
              shrink-0
            "
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      {/* ── Loading or Content ───────────────────────────────────────────────── */}
      {loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ── 4 Summary Cards ─────────────────────────────────────────────── */}
          <DashboardSummaryCards data={data.summary} />

          {/* ── Charts Row ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Donut chart */}
            <SectionCard title="Distribusi Status Tugas" icon={PieChart}>
              <DashboardDonutChart data={data.statusCounts} />
            </SectionCard>

            {/* Bar chart */}
            <SectionCard
              title="Progres Tugas per Acara"
              icon={BarChart3}
              className="lg:col-span-2"
            >
              {data.eventTaskCounts.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-xs text-slate-400 dark:text-slate-500">
                  Belum ada data tugas per acara.
                </div>
              ) : (
                <DashboardBarChart data={data.eventTaskCounts} />
              )}
            </SectionCard>
          </div>

          {/* ── At-Risk Tasks (coordinator view only) ───────────────────────── */}
          {userProfile.role !== "anggota" && (
            <div className="border-b border-slate-100 dark:border-slate-800 pb-1">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <BarChart3 className="size-4 text-red-500 shrink-0" />
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Tugas Berisiko
                  </h2>
                </div>
                <div className="p-4">
                  <TaskRiskSection profile={userProfile} />
                </div>
              </div>
            </div>
          )}

          {/* ── Focus + Activity ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title="Fokus Hari Ini" icon={Crosshair}>
              <DashboardFocusPanel items={data.focusItems} />
            </SectionCard>

            <SectionCard title="Aktivitas Terbaru" icon={Activity}>
              <DashboardActivityTimeline items={data.recentActivity} />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
