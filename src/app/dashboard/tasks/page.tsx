"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskCardGrid } from "@/components/tasks/task-card-grid";
import { TaskFilters, type TaskDeadlineFilter } from "@/components/tasks/task-filters";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskViewToggle, type TaskViewMode } from "@/components/tasks/task-view-toggle";
import { TasksTable } from "@/components/tasks/tasks-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/use-auth";
import { getEventsForProfile } from "@/lib/firebase/events";
import { getMembers } from "@/lib/firebase/members";
import {
  archiveTask,
  createTask,
  getTasksForProfile,
  updateTask,
} from "@/lib/firebase/tasks";
import { canCreateTask, canManageTask } from "@/lib/permissions";
import type { Event, Task, TaskInput, TaskPriority, TaskStatus, TaskType, UserProfile } from "@/types";

export default function TasksPage() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TaskType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [picFilter, setPicFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState<TaskDeadlineFilter>("all");
  const [viewMode, setViewMode] = useState<TaskViewMode>("table");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    if (!userProfile) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [taskData, eventData, userData] = await Promise.all([
        getTasksForProfile(userProfile),
        getEventsForProfile(userProfile).catch(() => []),
        getMembers().catch(() => [userProfile]),
      ]);

      setTasks(taskData);
      setEvents(eventData);
      setUsers(userData.length ? userData : [userProfile]);
    } catch {
      setError("Gagal mengambil data job desk. Periksa Firestore Rules dan koneksi.");
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAhead = new Date(today);
    weekAhead.setDate(today.getDate() + 7);

    return tasks.filter((task) => {
      const deadline = getDeadlineDate(task.deadline);
      const matchesSearch = !query || task.name.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || task.type === typeFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesPic = picFilter === "all" || task.pic_id === picFilter;
      const matchesEvent = eventFilter === "all" || task.event_id === eventFilter;
      const matchesDeadline =
        deadlineFilter === "all" ||
        !deadline ||
        (deadlineFilter === "overdue" && deadline < today) ||
        (deadlineFilter === "week" && deadline >= today && deadline <= weekAhead);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesPriority &&
        matchesPic &&
        matchesEvent &&
        matchesDeadline
      );
    });
  }, [
    deadlineFilter,
    eventFilter,
    picFilter,
    priorityFilter,
    search,
    statusFilter,
    tasks,
    typeFilter,
  ]);

  async function handleSaveTask(input: TaskInput, taskId?: string) {
    if (!userProfile) {
      return;
    }

    if (taskId) {
      await updateTask(taskId, input);
    } else {
      await createTask(input, userProfile.id);
    }

    await loadData();
  }

  async function handleArchiveTask(task: Task) {
    await archiveTask(task.id);
    await loadData();
  }

  if (!userProfile) {
    return null;
  }

  const canCreate = canCreateTask(userProfile);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge variant="info">Job Desk</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Job Desk</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Kelola job desk divisi dan job desk acara. Upload dan workflow
            approval akan tersedia di fase berikutnya.
          </p>
        </div>
        {canCreate ? (
          <Button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setFormOpen(true);
            }}
          >
            Tambah Job Desk
          </Button>
        ) : null}
      </section>

      <TaskFilters
        search={search}
        type={typeFilter}
        status={statusFilter}
        priority={priorityFilter}
        picId={picFilter}
        eventId={eventFilter}
        deadline={deadlineFilter}
        users={users}
        events={events}
        onSearchChange={setSearch}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onPicChange={setPicFilter}
        onEventChange={setEventFilter}
        onDeadlineChange={setDeadlineFilter}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Menampilkan {filteredTasks.length} dari {tasks.length} job desk.
        </p>
        <TaskViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {error ? (
        <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <LoadingState title="Memuat daftar job desk..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Belum ada job desk"
          description="Buat job desk pertama untuk mulai mengelola tugas divisi atau acara."
          action={
            canCreate ? (
              <Button type="button" onClick={() => setFormOpen(true)}>
                Tambah Job Desk
              </Button>
            ) : undefined
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="Tidak ada job desk yang cocok"
          description="Coba ubah search atau filter yang digunakan."
        />
      ) : viewMode === "table" ? (
        <TasksTable
          tasks={filteredTasks}
          usersById={usersById}
          eventsById={eventsById}
          canEdit={(task) => canManageTask(userProfile, task)}
          onEdit={(task) => {
            setSelectedTask(task);
            setFormOpen(true);
          }}
          onArchive={handleArchiveTask}
        />
      ) : (
        <TaskCardGrid
          tasks={filteredTasks}
          usersById={usersById}
          eventsById={eventsById}
          canEdit={(task) => canManageTask(userProfile, task)}
          onEdit={(task) => {
            setSelectedTask(task);
            setFormOpen(true);
          }}
          onArchive={handleArchiveTask}
        />
      )}

      <TaskFormDialog
        open={formOpen}
        task={selectedTask}
        users={users.filter((user) => user.is_active)}
        events={events}
        fallbackCoordinatorId={userProfile.id}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
}

function getDeadlineDate(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return null;
  }

  const date = (value as { toDate: () => Date }).toDate();
  date.setHours(0, 0, 0, 0);
  return date;
}
