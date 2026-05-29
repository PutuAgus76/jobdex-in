"use client";

import { useState } from "react";
import { TaskApproveDialog } from "@/components/tasks/task-approve-dialog";
import { TaskRevisionDialog } from "@/components/tasks/task-revision-dialog";
import { TaskUpdateStatusDialog } from "@/components/tasks/task-update-status-dialog";
import { Button } from "@/components/ui/button";
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
  const [statusOpen, setStatusOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [presetStatus, setPresetStatus] = useState<TaskStatus | undefined>();
  const allowedStatuses = getAllowedStatusOptions(currentUser, task);
  const canUpdate = canUpdateTaskStatus(currentUser, task);
  const canApprove = canApproveTaskWorkflow(currentUser, task);

  async function submitStatus(
    status: TaskStatus,
    note: string,
    stuckNotes?: string,
  ) {
    await updateTaskStatusWithLog({
      task,
      toStatus: status,
      changedBy: currentUser.id,
      note: note || stuckNotes || `Status diubah ke ${status}.`,
      stuckNotes,
    });
    await onChanged();
  }

  async function submitRevision(revisionNotes: string) {
    await requestTaskRevision({
      task,
      changedBy: currentUser.id,
      revisionNotes,
    });
    await onChanged();
  }

  async function submitApprove() {
    await approveTask({
      task,
      changedBy: currentUser.id,
    });
    await onChanged();
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
          className="bg-amber-600 hover:bg-amber-700"
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
