"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Task, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { appendTaskStatusLog } from "@/lib/firebase/task-status-logs";

type TaskChecklistProps = {
  task: Task;
  profile: UserProfile;
  onUpdate: () => void;
};

const DEFAULT_CHECKLIST_ITEMS = [
  { id: "checklist_1", label: "Redaksi/materi tersedia", is_done: false },
  { id: "checklist_2", label: "Referensi desain tersedia", is_done: false },
  { id: "checklist_3", label: "Mulai desain/draft awal", is_done: false },
  { id: "checklist_4", label: "Revisi internal", is_done: false },
  { id: "checklist_5", label: "Finalisasi desain", is_done: false },
  { id: "checklist_6", label: "Upload hasil ke JobDex.in / Drive", is_done: false },
];

export function TaskChecklist({ task, profile, onUpdate }: TaskChecklistProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const checklistItems = task.checklist_items || [];

  // Determine permissions
  const isPic = profile.id === task.pic_id;
  const isCoordinator = profile.id === task.coordinator_id;
  const isSuperAdmin = profile.role === "super_admin";
  const canUpdate = isPic || isCoordinator || isSuperAdmin;

  const handleCreateDefaultChecklist = async () => {
    setUpdatingId("init");
    try {
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, {
        checklist_items: DEFAULT_CHECKLIST_ITEMS,
        updated_at: serverTimestamp(),
      });

      // Log status log
      await appendTaskStatusLog({
        task,
        toStatus: task.status,
        changedBy: profile.id,
        note: "Checklist default berhasil dibuat.",
      });

      onUpdate();
    } catch (error) {
      console.error("[TaskChecklist] Failed to generate default checklist:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
    if (!canUpdate) return;
    setUpdatingId(itemId);

    try {
      const targetLabel = checklistItems.find((item) => item.id === itemId)?.label || "Item";
      const nextStatus = !currentStatus;

      const updatedChecklist = checklistItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            is_done: nextStatus,
            done_by: nextStatus ? profile.id : null,
            done_by_name: nextStatus ? profile.name : null,
            done_at: nextStatus ? new Date() : null,
          };
        }
        return item;
      });

      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, {
        checklist_items: updatedChecklist,
        updated_at: serverTimestamp(),
      });

      // Append status log
      const logNote = nextStatus
        ? `Checklist "${targetLabel}" ditandai selesai.`
        : `Checklist "${targetLabel}" ditandai belum selesai.`;

      await appendTaskStatusLog({
        task,
        toStatus: task.status,
        changedBy: profile.id,
        note: logNote,
      });

      onUpdate();
    } catch (error) {
      console.error("[TaskChecklist] Toggle failed:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>📋 Checklist Alur Tugas</span>
          {checklistItems.length > 0 && (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-semibold">
              {checklistItems.filter((i) => i.is_done).length}/{checklistItems.length}
            </span>
          )}
        </h3>
      </div>

      {checklistItems.length === 0 ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Tugas ini belum memiliki checklist pengerjaan.
          </p>
          <Button
            onClick={handleCreateDefaultChecklist}
            disabled={updatingId !== null}
            variant="outline"
            size="sm"
            className="text-xs font-semibold py-1.5 h-auto"
          >
            {updatingId === "init" ? "Membuat..." : "Buat Checklist Default"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {checklistItems.map((item) => {
            const isDone = item.is_done;
            const isDisabled = !canUpdate || updatingId !== null;

            return (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-2.5 rounded-xl border transition duration-150 ${
                  isDone
                    ? "border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/20 dark:bg-emerald-950/5 text-emerald-900 dark:text-emerald-300"
                    : "border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/10 text-slate-700 dark:text-slate-300"
                } ${
                  canUpdate ? "cursor-pointer hover:border-slate-200 dark:hover:border-slate-750" : "cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={isDisabled}
                  onChange={() => handleToggleChecklist(item.id, isDone)}
                  className="mt-0.5 size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-offset-slate-950 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-0.5">
                  <span
                    className={`text-xs font-medium leading-none ${
                      isDone ? "line-through text-slate-400 dark:text-slate-500" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                  {isDone && item.done_by_name && (
                    <span className="block text-[9px] text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-wider mt-0.5">
                      ✓ Selesai oleh {item.done_by_name}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {!canUpdate && checklistItems.length > 0 && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center">
          * Anda tidak memiliki akses untuk mengubah checklist tugas ini.
        </p>
      )}
    </div>
  );
}
