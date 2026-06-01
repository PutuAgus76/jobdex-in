import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export function showSuccess(message: string, title: string = "Sukses") {
  return Swal.fire({
    title,
    text: message,
    icon: "success",
    confirmButtonText: "OK",
    customClass: {
      confirmButton: "jd-btn jd-btn-dark px-6 py-2 rounded-[8px]",
      popup: "rounded-[8px] bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800",
    },
    buttonsStyling: false,
  });
}

export function showError(message: string, title: string = "Gagal") {
  return Swal.fire({
    title,
    text: message,
    icon: "error",
    confirmButtonText: "OK",
    customClass: {
      confirmButton: "jd-btn jd-btn-danger px-6 py-2 rounded-[8px]",
      popup: "rounded-[8px] bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800",
    },
    buttonsStyling: false,
  });
}

export function showWarning(message: string, title: string = "Peringatan") {
  return Swal.fire({
    title,
    text: message,
    icon: "warning",
    confirmButtonText: "OK",
    customClass: {
      confirmButton: "jd-btn jd-btn-dark px-6 py-2 rounded-[8px]",
      popup: "rounded-[8px] bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800",
    },
    buttonsStyling: false,
  });
}

export async function showConfirm({
  title = "Apakah Anda yakin?",
  text = "Tindakan ini tidak dapat dibatalkan.",
  confirmButtonText = "Ya",
  cancelButtonText = "Batal",
  icon = "warning",
}: {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
}): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      confirmButton: "jd-btn jd-btn-danger px-6 py-2 rounded-[8px] mr-2",
      cancelButton: "jd-btn jd-btn-outline px-6 py-2 rounded-[8px]",
      popup: "rounded-[8px] bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800",
    },
    buttonsStyling: false,
  });
  
  return result.isConfirmed;
}
