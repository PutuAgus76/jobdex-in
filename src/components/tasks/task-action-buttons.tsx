"use client";

import { useState } from "react";
import { TaskApproveDialog } from "@/components/tasks/task-approve-dialog";
import { TaskRevisionDialog } from "@/components/tasks/task-revision-dialog";
import { TaskUpdateStatusDialog } from "@/components/tasks/task-update-status-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  approveTask,
  requestTaskRevision,
  updateTaskStatusWithLog,
} from "@/lib/firebase/task-status-logs";
import {
  canApproveTaskWorkflow,
  canUpdateTaskStatus,
  getAllowedStatusOptions,
} from "@/lib/task-workflow";
import type { Task, TaskStatus, UserProfile } from "@/types";
import { showSuccess, showError } from "@/lib/swal";

type TaskActionButtonsProps = {
  task: Task;
  currentUser: UserProfile;
  onChanged: () => Promise<void>;
};

export function TaskActionButtons({
  task,
  currentUser,
  onChanged,
}: TaskActionButtonsProps) {
  const { user } = useAuth();
  const [statusOpen, setStatusOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [presetStatus, setPresetStatus] = useState<TaskStatus | undefined>();
  const allowedStatuses = getAllowedStatusOptions(currentUser, task);
  const canUpdate = canUpdateTaskStatus(currentUser, task);
  const canApprove = canApproveTaskWorkflow(currentUser, task);

  async function sendWorkflowNotification(payload: Record<string, unknown>) {
    if (!user) {
      return;
    }

    try {
      const token = await user.getIdToken();
      await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
          ...payload,
        }),
      });
    } catch {
      // Aksi workflow tetap dianggap berhasil walau notifikasi gagal.
    }
  }

  async function submitStatus(
    status: TaskStatus,
    note: string,
    stuckNotes?: string,
  ) {
    try {
      await updateTaskStatusWithLog({
        task,
        toStatus: status,
        changedBy: currentUser.id,
        note: note || stuckNotes || `Status diubah ke ${status}.`,
        stuckNotes,
      });
      void showSuccess("Status job desk berhasil diperbarui!");
      await sendWorkflowNotification({
        eventType:
          status === "stuck" || status === "butuh_bantuan"
            ? "task_help_needed"
            : "task_status_changed",
        status,
        note,
        stuckNotes,
      });
      await onChanged();
    } catch {
      void showError("Gagal memperbarui status job desk.");
    }
  }

  async function submitRevision(revisionNotes: string) {
    try {
      await requestTaskRevision({
        task,
        changedBy: currentUser.id,
        revisionNotes,
      });
      void showSuccess("Revisi job desk berhasil diminta!");
      await sendWorkflowNotification({
        eventType: "task_revision_requested",
        revisionNotes,
      });
      await onChanged();
    } catch {
      void showError("Gagal meminta revisi.");
    }
  }

  async function submitApprove() {
    try {
      await approveTask({
        task,
        changedBy: currentUser.id,
      });
      void showSuccess("Job desk berhasil disetujui!");
      await sendWorkflowNotification({
        eventType: "task_approved",
      });
      await onChanged();
    } catch {
      void showError("Gagal menyetujui job desk.");
    }
  }

  if (!canUpdate && !canApprove) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canUpdate && allowedStatuses.length ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPresetStatus(undefined);
            setStatusOpen(true);
          }}
        >
          Update Status
        </Button>
      ) : null}
      {canUpdate && allowedStatuses.includes("butuh_bantuan") ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPresetStatus("butuh_bantuan");
            setStatusOpen(true);
          }}
        >
          Butuh Bantuan
        </Button>
      ) : null}
      {canUpdate && allowedStatuses.includes("stuck") ? (
        <Button
          type="button"
          variant="warning"
          onClick={() => {
            setPresetStatus("stuck");
            setStatusOpen(true);
          }}
        >
          Tandai Stuck
        </Button>
      ) : null}
      {canApprove ? (
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRevisionOpen(true)}
          >
            Minta Revisi
          </Button>
          <Button type="button" onClick={() => setApproveOpen(true)}>
            Approve
          </Button>
        </>
      ) : null}

      {statusOpen ? (
        <TaskUpdateStatusDialog
          key={presetStatus ?? "custom-status"}
          open
          task={task}
          allowedStatuses={allowedStatuses}
          presetStatus={presetStatus}
          onClose={() => setStatusOpen(false)}
          onSubmit={submitStatus}
        />
      ) : null}
      <TaskRevisionDialog
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        onSubmit={submitRevision}
      />
      <TaskApproveDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onApprove={submitApprove}
      />
    </div>
  );
}
