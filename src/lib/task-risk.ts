import type { Task } from "@/types";

function getCalendarDateParts(date: Date, timeZone = "Asia/Jakarta") {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateString = formatter.format(date); // YYYY-MM-DD
    const [year, month, day] = dateString.split("-").map(Number);
    const utcMidnight = Date.UTC(year, month - 1, day);
    return { year, month, day, dateString, utcMidnight };
  } catch {
    const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      dateString: date.toISOString().slice(0, 10),
      utcMidnight,
    };
  }
}

export function getTaskDeadlineDiffDays(task: Task, refDate: Date = new Date()): number {
  const deadlineDate =
    task.deadline && typeof task.deadline === "object" && "toDate" in task.deadline
      ? (task.deadline as { toDate: () => Date }).toDate()
      : task.deadline instanceof Date
      ? task.deadline
      : typeof task.deadline === "string"
      ? new Date(task.deadline)
      : null;

  if (!deadlineDate || isNaN(deadlineDate.getTime())) return Number.MAX_SAFE_INTEGER;

  const tz = (typeof process !== "undefined" && process.env?.APP_TIMEZONE) || "Asia/Jakarta";
  const todayCal = getCalendarDateParts(refDate, tz);
  const deadlineCal = getCalendarDateParts(deadlineDate, tz);

  const diffMs = deadlineCal.utcMidnight - todayCal.utcMidnight;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getRiskLevelFromTask(task: Task): "none" | "yellow" | "orange" | "red" {
  if (task.status === "approved" || task.is_archived) {
    return "none";
  }

  const diffDays = getTaskDeadlineDiffDays(task);
  const priority = task.priority;

  // Overdue check regardless of priority or status
  if (diffDays < 0) {
    return "red";
  }

  // Stuck or Butuh Bantuan for >= 3 days -> Red
  if (task.status === "stuck" || task.status === "butuh_bantuan") {
    const updatedAtDate =
      task.updated_at && typeof task.updated_at === "object" && "toDate" in task.updated_at
        ? (task.updated_at as { toDate: () => Date }).toDate()
        : task.updated_at instanceof Date
        ? task.updated_at
        : null;

    if (updatedAtDate) {
      const updatedDaysAgo = Math.floor((Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24));
      if (updatedDaysAgo >= 3) {
        return "red";
      }
    }
  }

  // Menunggu Materi for >= 2 days -> orange or red depending on deadline, or yellow
  if (task.status === "menunggu_materi") {
    const updatedAtDate =
      task.updated_at && typeof task.updated_at === "object" && "toDate" in task.updated_at
        ? (task.updated_at as { toDate: () => Date }).toDate()
        : task.updated_at instanceof Date
        ? task.updated_at
        : null;

    if (updatedAtDate) {
      const updatedDaysAgo = Math.floor((Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24));
      if (updatedDaysAgo >= 2) {
        if (diffDays <= 3) return "red";
        if (diffDays <= 5) return "orange";
        return "yellow";
      }
    }
  }

  // Menunggu Approval dekat deadline: orange atau red tergantung deadline
  if (task.status === "menunggu_approval") {
    if (diffDays <= 1) return "red";
    if (diffDays <= 3) return "orange";
    if (diffDays <= 5) return "yellow";
  }

  // Belum Dimulai dekat deadline: orange atau red tergantung deadline
  if (task.status === "belum_dimulai") {
    if (diffDays <= 1) return "red";
    if (diffDays <= 3) return "orange";
    if (diffDays <= 5) return "yellow";
  }

  // Priority-based deadline diff days mapping
  if (priority === "rendah" || priority === "sedang") {
    if (diffDays <= 1) return "red"; // H-1, today, overdue
    if (diffDays === 5) return "yellow"; // H-5 Peringatan awal
  } else if (priority === "tinggi" || priority === "kritis") {
    if (diffDays <= 1) return "red"; // H-1, today, overdue
    if (diffDays === 5 || diffDays === 3) return "orange"; // H-5, H-3
    if (diffDays === 7) return "yellow"; // H-7
  }

  return "none";
}

export function getRiskColor(level: "none" | "yellow" | "orange" | "red"): string {
  switch (level) {
    case "red":
      return "#EF4444"; // rose-500
    case "orange":
      return "#F97316"; // orange-500
    case "yellow":
      return "#F59E0B"; // amber-500
    case "none":
    default:
      return "#10B981"; // emerald-500
  }
}

export function getRiskLabel(level: "none" | "yellow" | "orange" | "red", task?: Task): string {
  const diffDays = task ? getTaskDeadlineDiffDays(task) : null;

  if (task?.status === "stuck" || task?.status === "butuh_bantuan") {
    return level === "red" ? "Sangat Kritis / Stuck" : "Stuck";
  }

  if (task?.status === "menunggu_approval") {
    if (typeof diffDays === "number" && diffDays < 0) {
      return "Overdue / Menunggu Approval";
    }

    if (typeof diffDays === "number" && diffDays <= 1) {
      return "H-1 / Menunggu Approval";
    }

    return "Perlu Review";
  }

  if (level === "red" && typeof diffDays === "number" && diffDays < 0) {
    return "Overdue";
  }

  switch (level) {
    case "red":
      return "Sangat Kritis";
    case "orange":
      return "Mendekati Deadline";
    case "yellow":
      return "Peringatan Awal";
    case "none":
    default:
      return "Aman";
  }
}
