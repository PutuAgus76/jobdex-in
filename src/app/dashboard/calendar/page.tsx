"use client";

import { useAuth } from "@/hooks/use-auth";
import { TaskCalendar } from "@/components/calendar/task-calendar";
import { LoadingState } from "@/components/ui/loading-state";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <LoadingState title="Memuat kalender..." />;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Kalender</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
          Kalender Deadline
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Visualisasi sisa waktu dan tingkat risiko tugas berdasarkan tanggal deadline.
        </p>
      </section>

      <TaskCalendar profile={userProfile} />
    </div>
  );
}
