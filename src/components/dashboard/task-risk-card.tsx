"use client";

import type { Task, UserProfile } from "@/types";
import {
  getRiskLevelFromTask,
  getRiskLabel,
  getTaskDeadlineDiffDays,
} from "@/lib/task-risk";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type TaskRiskCardProps = {
  task: Task;
  picUser?: UserProfile | null;
  divisionOrEventName: string;
};

export function TaskRiskCard({ task, picUser, divisionOrEventName }: TaskRiskCardProps) {
  const riskLevel = getRiskLevelFromTask(task);
  const riskLabel = getRiskLabel(riskLevel);
  const diffDays = getTaskDeadlineDiffDays(task);

  const formattedDeadline =
    task.deadline && typeof task.deadline === "object" && "toDate" in task.deadline
      ? (task.deadline as { toDate: () => Date }).toDate().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

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

  const riskVariant =
    riskLevel === "red"
      ? "error"
      : riskLevel === "orange"
      ? "orange"
      : riskLevel === "yellow"
      ? "warning"
      : "neutral";

  return (
    <div className="flex-none w-[290px] jd-neo-card p-4 flex flex-col justify-between space-y-4 m-1">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={riskVariant} className="text-[10px] font-bold">
            {riskLabel}
          </Badge>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {diffDays < 0 ? "Overdue" : diffDays === 0 ? "Hari Ini" : `H-${diffDays}`}
          </span>
        </div>

        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm line-clamp-2" title={task.name}>
          {task.name}
        </h3>

        <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] text-slate-650 dark:text-slate-400 pt-1 border-t border-dashed border-neutral-200 dark:border-neutral-800">
          <div>
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
              PIC
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-350 truncate block">
              {picUser ? picUser.name : "-"}
            </span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
              Deadline
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-350 block truncate">
              {formattedDeadline}
            </span>
          </div>
          <div className="mt-1">
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
              Divisi / Acara
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-350 truncate block">
              {divisionOrEventName}
            </span>
          </div>
          <div className="mt-1">
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
              Status
            </span>
            <span className="font-semibold text-slate-850 dark:text-slate-300 block truncate">
              {statusLabels[task.status] || task.status}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Link href={`/dashboard/tasks/${task.id}`} passHref legacyBehavior>
          <Button variant="secondary" size="sm" className="w-full text-xs font-bold py-1.5 h-auto">
            Buka Detail Task
          </Button>
        </Link>
      </div>
    </div>
  );
}
