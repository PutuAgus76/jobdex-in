import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Task, TaskStatus, UserProfile, Event } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SummaryCardData = {
  activeEvents: number;
  activeJobs: number;
  needsAttention: number; // stuck + butuh_bantuan + perlu_revisi + overdue
  completedThisWeek: number;
  totalMembers: number;
};

export type TaskStatusCount = {
  status: TaskStatus;
  label: string;
  count: number;
  color: string;
};

export type EventTaskCount = {
  eventId: string;
  eventName: string;
  total: number;
  done: number; // approved
  progress: number; // 0-100
};

export type FocusItem = {
  id: string;
  taskId: string;
  taskName: string;
  picName: string;
  eventOrDivision: string;
  deadline: Date | null;
  diffDays: number | null;
  kind: "overdue" | "h1" | "stuck" | "approval" | "revision";
};

export type ActivityItem = {
  id: string;
  text: string;
  time: Date;
  kind: "approved" | "revision" | "stuck" | "created";
};

export type DashboardData = {
  summary: SummaryCardData;
  statusCounts: TaskStatusCount[];
  eventTaskCounts: EventTaskCount[];
  focusItems: FocusItem[];
  recentActivity: ActivityItem[];
  role: UserProfile["role"];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === "object" && "toDate" in (val as object)) {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Date) return val;
  return null;
}

function diffDaysFromToday(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  belum_dimulai:    { label: "Belum Dimulai",       color: "#94a3b8" },
  sedang_dikerjakan:{ label: "Sedang Dikerjakan",   color: "#38bdf8" },
  menunggu_approval:{ label: "Menunggu Approval",   color: "#a78bfa" },
  perlu_revisi:     { label: "Perlu Revisi",         color: "#fb923c" },
  stuck:            { label: "Stuck",                color: "#f87171" },
  approved:         { label: "Selesai / Approved",  color: "#34d399" },
  butuh_bantuan:    { label: "Butuh Bantuan",        color: "#fbbf24" },
  menunggu_materi:  { label: "Menunggu Materi",     color: "#60a5fa" },
  draft_selesai:    { label: "Draft Selesai",        color: "#4ade80" },
  revisi_dikerjakan:{ label: "Revisi Dikerjakan",   color: "#c084fc" },
  ditunda:          { label: "Ditunda",              color: "#64748b" },
};

// Statuses shown in the donut chart (grouped for clarity)
const DONUT_STATUSES: TaskStatus[] = [
  "belum_dimulai",
  "sedang_dikerjakan",
  "menunggu_approval",
  "perlu_revisi",
  "stuck",
  "approved",
];

// ─── Main Fetcher ─────────────────────────────────────────────────────────────

export async function getDashboardData(profile: UserProfile): Promise<DashboardData> {
  const role = profile.role;

  // Fetch raw data in parallel
  const [tasksSnap, eventsSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "tasks"), where("is_archived", "==", false))),
    getDocs(collection(db, "events")),
    getDocs(collection(db, "users")),
  ]);

  const allTasks: Task[] = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
  const allEvents: Event[] = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Event));
  const usersMap = new Map<string, UserProfile>();
  usersSnap.docs.forEach((d) => usersMap.set(d.id, { id: d.id, ...d.data() } as UserProfile));

  // Role-filter tasks
  let tasks = allTasks;
  if (role === "koordinator_divisi" && profile.division_id) {
    tasks = allTasks.filter((t) => t.division_id === profile.division_id);
  } else if (role === "koordinator_acara") {
    tasks = allTasks.filter((t) => t.coordinator_id === profile.id);
  } else if (role === "anggota") {
    tasks = allTasks.filter((t) => t.pic_id === profile.id);
  }

  // ── Summary cards ─────────────────────────────────────────────────────────
  const weekStart = startOfWeek();
  const activeEvents = allEvents.filter(
    (e) => e.status === "persiapan" || e.status === "berlangsung"
  ).length;

  const activeJobs = tasks.filter(
    (t) => t.status !== "approved" && t.status !== "ditunda"
  ).length;

  const needsAttention = tasks.filter((t) => {
    const deadlineDate = toDate(t.deadline);
    const diffDays = deadlineDate ? diffDaysFromToday(deadlineDate) : null;
    return (
      t.status === "stuck" ||
      t.status === "butuh_bantuan" ||
      t.status === "perlu_revisi" ||
      (diffDays !== null && diffDays < 0 && t.status !== "approved")
    );
  }).length;

  const completedThisWeek = tasks.filter((t) => {
    if (t.status !== "approved") return false;
    const updatedAt = toDate(t.updated_at);
    return updatedAt !== null && updatedAt >= weekStart;
  }).length;

  const totalMembers = role === "super_admin" ? usersSnap.size : 0;

  // ── Status distribution (donut) ────────────────────────────────────────────
  const statusCountMap: Partial<Record<TaskStatus, number>> = {};
  tasks.forEach((t) => {
    statusCountMap[t.status] = (statusCountMap[t.status] ?? 0) + 1;
  });

  const statusCounts: TaskStatusCount[] = DONUT_STATUSES.map((status) => ({
    status,
    label: STATUS_CONFIG[status].label,
    count: statusCountMap[status] ?? 0,
    color: STATUS_CONFIG[status].color,
  }));

  // ── Event progress (bar chart) ─────────────────────────────────────────────
  const eventTaskMap = new Map<string, { total: number; done: number }>();
  tasks.forEach((t) => {
    if (!t.event_id) return;
    const prev = eventTaskMap.get(t.event_id) ?? { total: 0, done: 0 };
    eventTaskMap.set(t.event_id, {
      total: prev.total + 1,
      done: prev.done + (t.status === "approved" ? 1 : 0),
    });
  });

  const eventTaskCounts: EventTaskCount[] = [];
  allEvents.forEach((ev) => {
    const counts = eventTaskMap.get(ev.id);
    if (!counts || counts.total === 0) return;
    eventTaskCounts.push({
      eventId: ev.id,
      eventName: ev.name,
      total: counts.total,
      done: counts.done,
      progress: Math.round((counts.done / counts.total) * 100),
    });
  });
  // Sort by most tasks, take top 8
  eventTaskCounts.sort((a, b) => b.total - a.total);
  const topEvents = eventTaskCounts.slice(0, 8);

  // ── Focus panel ────────────────────────────────────────────────────────────
  const focusItems: FocusItem[] = [];

  tasks.forEach((t) => {
    if (t.status === "approved" || t.status === "ditunda") return;

    const deadlineDate = toDate(t.deadline);
    const diffDays = deadlineDate ? diffDaysFromToday(deadlineDate) : null;
    const picUser = t.pic_id ? usersMap.get(t.pic_id) : undefined;
    const picName = picUser?.name ?? "-";

    // Determine event/division label (simplified)
    const eventOrDivision = t.event_id
      ? (allEvents.find((e) => e.id === t.event_id)?.name ?? t.event_id)
      : (t.division_id ? `Div: ${t.division_id}` : "-");

    let kind: FocusItem["kind"] | null = null;

    if (diffDays !== null && diffDays < 0) {
      kind = "overdue";
    } else if (t.status === "stuck" || t.status === "butuh_bantuan") {
      kind = "stuck";
    } else if (t.status === "menunggu_approval") {
      kind = "approval";
    } else if (t.status === "perlu_revisi" || t.status === "revisi_dikerjakan") {
      kind = "revision";
    } else if (diffDays !== null && diffDays <= 1) {
      kind = "h1";
    }

    if (kind) {
      focusItems.push({
        id: `${t.id}-${kind}`,
        taskId: t.id,
        taskName: t.name,
        picName,
        eventOrDivision,
        deadline: deadlineDate,
        diffDays,
        kind,
      });
    }
  });

  // Sort: overdue first, then stuck, then h1, then approval, then revision
  const kindOrder: FocusItem["kind"][] = ["overdue", "stuck", "h1", "approval", "revision"];
  focusItems.sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind));

  // ── Recent activity ────────────────────────────────────────────────────────
  const recentActivity: ActivityItem[] = tasks
    .filter((t) => toDate(t.updated_at) !== null)
    .sort((a, b) => {
      const da = toDate(a.updated_at)?.getTime() ?? 0;
      const db_ = toDate(b.updated_at)?.getTime() ?? 0;
      return db_ - da;
    })
    .slice(0, 5)
    .map((t) => {
      const pic = t.pic_id ? usersMap.get(t.pic_id) : undefined;
      let text = "";
      let kind: ActivityItem["kind"] = "created";
      switch (t.status) {
        case "approved":
          text = `"${t.name}" selesai diapprove`;
          kind = "approved";
          break;
        case "perlu_revisi":
          text = `"${t.name}" perlu revisi`;
          kind = "revision";
          break;
        case "stuck":
          text = `"${t.name}" dilaporkan stuck oleh ${pic?.name ?? "-"}`;
          kind = "stuck";
          break;
        default:
          text = `"${t.name}" diperbarui`;
          kind = "created";
      }
      return {
        id: t.id,
        text,
        time: toDate(t.updated_at)!,
        kind,
      };
    });

  return {
    summary: { activeEvents, activeJobs, needsAttention, completedThisWeek, totalMembers },
    statusCounts,
    eventTaskCounts: topEvents,
    focusItems: focusItems.slice(0, 12),
    recentActivity,
    role,
  };
}
