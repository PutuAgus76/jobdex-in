"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskDetail } from "@/components/tasks/task-detail";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/use-auth";
import { getEventsForProfile } from "@/lib/firebase/events";
import { getMembers, getUsersByIds } from "@/lib/firebase/members";
import { getTaskStatusLogs } from "@/lib/firebase/task-status-logs";
import { getTaskUploads } from "@/lib/firebase/task-uploads";
import { getTaskById } from "@/lib/firebase/tasks";
import { canReadTask } from "@/lib/permissions";
import type { Event, Task, TaskStatusLog, TaskUpload, UserProfile } from "@/types";

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<TaskStatusLog[]>([]);
  const [uploads, setUploads] = useState<TaskUpload[]>([]);
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

      const [usersData, eventsData, logData, uploadData] = await Promise.all([
        getMembers().catch(() => [userProfile]),
        getEventsForProfile(userProfile).catch(() => []),
        getTaskStatusLogs(taskId).catch(() => []),
        getTaskUploads(taskId).catch(() => []),
      ]);
      const userIdsFromLogs = logData.map((log) => log.changed_by);
      const missingLogUserIds = userIdsFromLogs.filter(
        (userId) =>
          userId &&
          !usersData.some((user) => user.id === userId) &&
          userId !== userProfile.id,
      );
      const logUsers = missingLogUserIds.length
        ? await getUsersByIds(missingLogUserIds).catch(() => [])
        : [];
      const usersByUniqueId = new Map(
        [...usersData, userProfile, ...logUsers].map((user) => [user.id, user]),
      );

      setTask(taskData);
      setUsers([...usersByUniqueId.values()]);
      setEvents(eventsData);
      setLogs(logData);
      setUploads(uploadData);
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
      uploads={uploads}
      currentUser={userProfile}
      onChanged={loadDetail}
    />
  );
}
