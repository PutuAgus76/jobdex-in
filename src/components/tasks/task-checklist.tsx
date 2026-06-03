"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Task, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { appendTaskStatusLog } from "@/lib/firebase/task-status-logs";
import { ClipboardList, Check } from "lucide-react";

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
    <div className="border-2 border-black rounded-[4px] bg-white dark:bg-slate-900 p-5 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#000] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ClipboardList className="size-4 text-slate-500 shrink-0" />
          <span>Checklist Alur Tugas</span>
          {checklistItems.length > 0 && (
            <span className="text-[10px] border-2 border-black rounded-[4px] bg-[var(--main)] px-2 py-0.5 text-neutral-955 font-extrabold shadow-[1.5px_1.5px_0px_#000] dark:border-black shrink-0">
              {checklistItems.filter((i) => i.is_done).length}/{checklistItems.length}
            </span>
          )}
        </h3>
      </div>

      {checklistItems.length === 0 ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-450">
            Tugas ini belum memiliki checklist pengerjaan.
          </p>
          <Button
            onClick={handleCreateDefaultChecklist}
            disabled={updatingId !== null}
            variant="outline"
            size="sm"
            className="text-xs font-bold py-1.5 h-auto"
          >
            {updatingId === "init" ? "Membuat..." : "Buat Checklist Default"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {checklistItems.map((item) => {
            const isDone = item.is_done;
            const isDisabled = !canUpdate || updatingId !== null;

            return (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 border-2 border-black rounded-[4px] transition-all duration-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#000] ${
                  isDone
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                } ${
                  canUpdate
                    ? "cursor-pointer hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#000]"
                    : "cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={isDisabled}
                  onChange={() => handleToggleChecklist(item.id, isDone)}
                  className="mt-0.5 size-4 accent-[var(--main)] border-2 border-black rounded-[2px] cursor-pointer disabled:cursor-not-allowed bg-white dark:bg-slate-950 focus:ring-0 focus:ring-offset-0"
                />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span
                    className={`text-xs font-bold leading-tight block ${
                      isDone ? "line-through text-slate-400 dark:text-slate-500" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                  {isDone && item.done_by_name && (
                    <span className="block text-[9px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider mt-1 flex items-center gap-0.5">
                      <Check className="size-3 shrink-0" />
                      <span>Selesai oleh {item.done_by_name}</span>
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {!canUpdate && checklistItems.length > 0 && (
        <p className="text-[10px] text-slate-500 dark:text-slate-450 italic text-center">
          * Anda tidak memiliki akses untuk mengubah checklist tugas ini.
        </p>
      )}
    </div>
  );
}
