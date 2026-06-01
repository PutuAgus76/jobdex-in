"use client";

import type { Task, UserProfile } from "@/types";
import {
  getRiskLevelFromTask,
  getRiskColor,
  getRiskLabel,
  getTaskDeadlineDiffDays,
} from "@/lib/task-risk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type TaskRiskCardProps = {
  task: Task;
  picUser?: UserProfile | null;
  divisionOrEventName: string;
};

export function TaskRiskCard({ task, picUser, divisionOrEventName }: TaskRiskCardProps) {
  const riskLevel = getRiskLevelFromTask(task);
  const riskColor = getRiskColor(riskLevel);
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

  return (
    <div className="flex-none w-[290px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition duration-150">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge
            className="text-[10px] font-bold"
            style={{
              backgroundColor: `${riskColor}15`,
              color: riskColor,
              borderColor: `${riskColor}30`,
              borderWidth: 1,
            }}
          >
            {riskLabel}
          </Badge>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            {diffDays < 0 ? "Overdue" : diffDays === 0 ? "Hari Ini" : `H-${diffDays}`}
          </span>
        </div>

        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2" title={task.name}>
          {task.name}
        </h3>

        <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <div>
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
              PIC
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {picUser ? picUser.name : "-"}
            </span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
              Deadline
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 block truncate">
              {formattedDeadline}
            </span>
          </div>
          <div className="mt-1">
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
              Divisi / Acara
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {divisionOrEventName}
            </span>
          </div>
          <div className="mt-1">
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
              Status
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 block truncate">
              {statusLabels[task.status] || task.status}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Link href={`/dashboard/tasks/${task.id}`} passHref legacyBehavior>
          <Button variant="outline" className="w-full text-xs font-semibold py-1.5 h-auto">
            Buka Detail Task
          </Button>
        </Link>
      </div>
    </div>
  );
}
