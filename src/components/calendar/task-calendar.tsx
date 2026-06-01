"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Task, UserProfile } from "@/types";
import { getCalendarGrid, isSameDay } from "@/lib/calendar-utils";
import { getRiskLevelFromTask, getRiskColor } from "@/lib/task-risk";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

type TaskCalendarProps = {
  profile: UserProfile;
};

export function TaskCalendar({ profile }: TaskCalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, UserProfile>>(new Map());
  const [eventsMap, setEventsMap] = useState<Map<string, { name?: string }>>(new Map());
  const [divisionsMap, setDivisionsMap] = useState<Map<string, { name?: string }>>(new Map());
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const tasksQuery = query(collection(db, "tasks"), where("is_archived", "==", false));
        const [tasksSnap, usersSnap, eventsSnap, divisionsSnap] = await Promise.all([
          getDocs(tasksQuery),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "divisions")),
        ]);

        if (!mounted) return;

        // Process users
        const uMap = new Map<string, UserProfile>();
        usersSnap.forEach((doc) => {
          uMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile);
        });
        setUsersMap(uMap);

        // Process events
        const eMap = new Map<string, { name?: string }>();
        eventsSnap.forEach((doc) => {
          eMap.set(doc.id, doc.data() as { name?: string });
        });
        setEventsMap(eMap);

        // Process divisions
        const dMap = new Map<string, { name?: string }>();
        divisionsSnap.forEach((doc) => {
          dMap.set(doc.id, doc.data() as { name?: string });
        });
        setDivisionsMap(dMap);

        // Process and filter tasks
        const allTasks: Task[] = [];
        tasksSnap.forEach((doc) => {
          const data = doc.data() as Task;
          allTasks.push({ ...data, id: doc.id });
        });

        // Role-aware filter
        let filteredTasks = allTasks;
        if (profile.role === "anggota") {
          filteredTasks = allTasks.filter((t) => t.pic_id === profile.id);
        } else if (profile.role === "koordinator_divisi") {
          filteredTasks = allTasks.filter((t) => t.division_id === profile.division_id);
        } else if (profile.role === "koordinator_acara") {
          filteredTasks = allTasks.filter((t) => t.coordinator_id === profile.id);
        }

        // Only keep tasks that are not approved and have a deadline
        const activeTasks = filteredTasks.filter((t) => t.status !== "approved" && t.deadline);
        setTasks(activeTasks);
      } catch (error) {
        console.error("[TaskCalendar] Load failed:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [profile]);

  const daysGrid = getCalendarGrid(currentYear, currentMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const setToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Helper to extract due date from task
  const getTaskDate = (task: Task): Date | null => {
    if (!task.deadline) return null;
    return task.deadline && typeof task.deadline === "object" && "toDate" in task.deadline
      ? (task.deadline as { toDate: () => Date }).toDate()
      : task.deadline instanceof Date
      ? task.deadline
      : new Date(task.deadline as string);
  };

  // Get tasks due on a specific day
  const getTasksForDay = (day: Date): Task[] => {
    return tasks.filter((task) => {
      const taskDate = getTaskDate(task);
      return taskDate ? isSameDay(taskDate, day) : false;
    });
  };

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];

  const statusLabels = {
    belum_dimulai: "Belum Dimulai",
    sedang_dikerjakan: "Sedang Dikerjakan",
    butuh_bantuan: "Butuh Bantuan",
    stuck: "Stuck",
    menunggu_materi: "Menunggu Materi",
    draft_selesai: "Draft Selesai",
    perlu_revisi: "Perlu Revisi",
    revisi_dikerjakan: "Revisi Dikerjakan",
    menunggu_approval: "Menunggu Approval",
    approved: "Approved",
    ditunda: "Ditunda",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar Grid Container */}
      <div className="lg:col-span-2 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-slate-500" />
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={prevMonth} className="px-2 h-8">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={setToday} className="text-xs font-semibold px-3 h-8">
              Hari Ini
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth} className="px-2 h-8">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>Min</div>
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div>Sab</div>
        </div>

        {/* 6-Week Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysGrid.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const dayTasks = getTasksForDay(day);

            // Determine highest risk level color for this day's tasks
            let maxRiskColor = "";
            let maxRiskWeight = 0;
            const riskWeights = { red: 3, orange: 2, yellow: 1, none: 0 };

            dayTasks.forEach((t) => {
              const r = getRiskLevelFromTask(t);
              const w = riskWeights[r] || 0;
              if (w > maxRiskWeight) {
                maxRiskWeight = w;
                maxRiskColor = getRiskColor(r);
              }
            });

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`relative h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 ${
                  isCurrentMonth
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50"
                    : "bg-slate-100/30 dark:bg-slate-950/10 border-transparent text-slate-300 dark:text-slate-700"
                } ${
                  isSelected
                    ? "ring-2 ring-slate-800 dark:ring-slate-300 border-transparent"
                    : "hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Date Number */}
                <div className="flex justify-between items-center w-full">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? "inline-flex items-center justify-center size-5 rounded-full bg-slate-950 text-white dark:bg-slate-50 dark:text-slate-950"
                        : isCurrentMonth
                        ? "text-slate-700 dark:text-slate-350"
                        : "text-slate-400 dark:text-slate-650"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Task Indicators */}
                {dayTasks.length > 0 && (
                  <div className="flex items-center gap-1 mt-auto">
                    <span
                      className="size-2 rounded-full animate-pulse"
                      style={{ backgroundColor: maxRiskColor || "#94A3B8" }}
                    ></span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      {dayTasks.length} {dayTasks.length === 1 ? "Task" : "Tasks"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Task List (Sidebar/Details) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tugas Deadline
          </h3>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
            {selectedDate
              ? selectedDate.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Pilih tanggal"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse pt-2">
            <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
            <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
          </div>
        ) : selectedDayTasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
            Tidak ada tugas deadline di tanggal ini.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {selectedDayTasks.map((task) => {
              const riskLevel = getRiskLevelFromTask(task);
              const riskColor = getRiskColor(riskLevel);
              const picUser = task.pic_id ? usersMap.get(task.pic_id) || null : null;

              let divisionOrEventName = "-";
              if (task.type === "acara" && task.event_id) {
                const event = eventsMap.get(task.event_id);
                if (event && event.name) divisionOrEventName = event.name;
              } else if (task.type === "divisi" && task.division_id) {
                const division = divisionsMap.get(task.division_id);
                if (division && division.name) divisionOrEventName = division.name;
              }

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: riskColor }}
                      ></span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {divisionOrEventName}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs line-clamp-2">
                      {task.name}
                    </h4>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>PIC: {picUser ? picUser.name : "-"}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">
                        {statusLabels[task.status] || task.status}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                    <Link href={`/dashboard/tasks/${task.id}`} passHref legacyBehavior>
                      <Button variant="ghost" size="sm" className="w-full text-[10px] font-semibold py-1 h-auto">
                        Buka Detail Task
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
