"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskUploadHistory } from "@/components/tasks/task-upload-history";
import { useAuth } from "@/hooks/use-auth";
import { canManageTask } from "@/lib/permissions";
import { formatFileSize, validateImageUpload } from "@/lib/upload-validation";
import type { Task, TaskUpload, UserProfile } from "@/types";
import { showSuccess, showError, showWarning } from "@/lib/swal";

type TaskUploadSectionProps = {
  task: Task;
  uploads: TaskUpload[];
  currentUser: UserProfile;
  usersById: Map<string, UserProfile>;
  onUploaded: () => Promise<void>;
};

export function TaskUploadSection({
  task,
  uploads,
  currentUser,
  usersById,
  onUploaded,
}: TaskUploadSectionProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const latestUpload = useMemo(() => uploads[0], [uploads]);
  const canUpload = canManageTask(currentUser, task) || task.pic_id === currentUser.id;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage("");
    setWarning("");
    setError("");

    const validation = validateImageUpload(file);

    if (!validation.valid) {
      void showError(validation.error, "Upload Gagal");
      setError(validation.error);
      return;
    }

    if (!user) {
      void showError("Sesi login tidak ditemukan. Silakan login ulang.", "Error");
      setError("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("taskId", task.id);
      formData.append("file", file);

      const token = await user.getIdToken();
      const response = await fetch("/api/uploads/task-result", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const result = (await response.json()) as {
        error?: string;
        whatsappSent?: boolean;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Upload hasil desain gagal.");
      }

      void showSuccess("Hasil desain berhasil diunggah! Status task diubah menjadi Menunggu Approval.");
      setMessage("Upload berhasil. Task dipindahkan ke Menunggu Approval.");

      if (!result.whatsappSent) {
        void showWarning("Upload berhasil, tetapi notifikasi WhatsApp gagal dikirim.");
        setWarning("Upload berhasil, tetapi notifikasi WhatsApp gagal dikirim.");
      }

      await onUploaded();
    } catch (uploadError) {
      const errMsg =
        uploadError instanceof Error
          ? uploadError.message
          : "Upload hasil desain gagal.";
      void showError(errMsg, "Upload Gagal");
      setError(errMsg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hasil Desain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestUpload ? (
            <div className="overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <Image
                src={latestUpload.thumbnail_url || latestUpload.upload_url}
                alt={`Preview hasil desain ${task.name}`}
                width={1000}
                height={700}
                className="max-h-[420px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-[8px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-6 text-sm text-slate-500 dark:text-slate-400">
              Belum ada hasil desain. Upload pertama akan muncul sebagai preview terbaru.
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-[8px] border border-slate-200 dark:border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950 dark:text-slate-50">Upload Hasil Desain</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                JPG, JPEG, PNG, atau WEBP. Maksimal {formatFileSize(10 * 1024 * 1024)}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {latestUpload ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={latestUpload.upload_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                    <ExternalLink className="h-4 w-4" />
                    Buka Gambar
                  </a>
                </Button>
              ) : null}
              {canUpload ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Mengupload..." : "Upload Hasil Desain"}
                </Button>
              ) : null}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {message ? (
            <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              {message}
            </p>
          ) : null}
          {warning ? (
            <p className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {warning}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <TaskUploadHistory uploads={uploads} usersById={usersById} />
    </section>
  );
}
