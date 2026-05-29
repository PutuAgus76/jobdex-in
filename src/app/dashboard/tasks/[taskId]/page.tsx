"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskDetail } from "@/components/tasks/task-detail";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/use-auth";
import { getEventsForProfile } from "@/lib/firebase/events";
import { getMembers } from "@/lib/firebase/members";
import { getTaskStatusLogs } from "@/lib/firebase/task-status-logs";
import { getTaskById } from "@/lib/firebase/tasks";
import { canReadTask } from "@/lib/permissions";
import type { Event, Task, TaskStatusLog, UserProfile } from "@/types";

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<TaskStatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const taskId = params.taskId;

  const loadDetail = useCallback(async () => {
    if (!userProfile || !taskId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const taskData = await getTaskById(taskId);

      if (!taskData) {
        setTask(null);
        return;
      }

      if (!canReadTask(userProfile, taskData)) {
        router.replace("/dashboard/unauthorized");
        return;
      }

      const [usersData, eventsData, logData] = await Promise.all([
        getMembers().catch(() => [userProfile]),
        getEventsForProfile(userProfile).catch(() => []),
        getTaskStatusLogs(taskId).catch(() => []),
      ]);

      setTask(taskData);
      setUsers(usersData.length ? usersData : [userProfile]);
      setEvents(eventsData);
      setLogs(logData);
    } catch {
      setError("Gagal memuat detail task. Periksa izin akses dan Firestore Rules.");
    } finally {
      setLoading(false);
    }
  }, [router, taskId, userProfile]);

  useEffect(() => {
    void Promise.resolve().then(loadDetail);
  }, [loadDetail]);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  if (loading) {
    return <LoadingState title="Memuat detail job desk..." />;
  }

  if (error) {
    return <EmptyState title="Detail job desk gagal dimuat" description={error} />;
  }

  if (!task) {
    return (
      <EmptyState
        title="Job desk tidak ditemukan"
        description="Dokumen task tidak tersedia atau sudah tidak dapat diakses."
      />
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <TaskDetail
      task={task}
      usersById={usersById}
      eventsById={eventsById}
      logs={logs}
      currentUser={userProfile}
      onChanged={loadDetail}
    />
  );
}
