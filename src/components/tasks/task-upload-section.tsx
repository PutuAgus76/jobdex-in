"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Upload, FileText, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskUploadHistory } from "@/components/tasks/task-upload-history";
import { useAuth } from "@/hooks/use-auth";
import { canManageTask } from "@/lib/permissions";
import { formatFileSize, validateFileUpload } from "@/lib/upload-validation";
import type { Task, TaskUpload, UserProfile } from "@/types";
import { showSuccess, showError, showWarning } from "@/lib/swal";

type TaskUploadSectionProps = {
  task: Task;
  uploads: TaskUpload[];
  currentUser: UserProfile;
  usersById: Map<string, UserProfile>;
  onUploaded: () => Promise<void>;
  eventRole?: string;
};

export function TaskUploadSection({
  task,
  uploads,
  currentUser,
  usersById,
  onUploaded,
  eventRole,
}: TaskUploadSectionProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceLink, setSourceLink] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [outputType, setOutputType] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  const latestUpload = useMemo(() => uploads[0], [uploads]);
  const canUpload = canManageTask(currentUser, task, eventRole) || task.pic_id === currentUser.id;

  const isDesignCategory = useMemo(() => {
    return task.category_key === "desain_publikasi" || task.category_key === "identitas_acara_dan_panitia" || task.category_key === "aset_desain";
  }, [task.category_key]);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetUploadState() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSourceLink("");
    setUploadNote("");
    setOutputType("");
    setIsConfirming(false);
    setMessage("");
    setWarning("");
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage("");
    setWarning("");
    setError("");

    const validation = validateFileUpload(file);

    if (!validation.valid) {
      void showError(validation.error, "File Tidak Valid");
      setError(validation.error);
      return;
    }

    setSelectedFile(file);
    setIsConfirming(true);

    // Set recommended output type
    const recommendedType = task.output_types && task.output_types.length > 0 ? task.output_types[0] : "";
    setOutputType(recommendedType);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleUploadSubmit() {
    if (!user) {
      void showError("Sesi login tidak ditemukan. Silakan login ulang.", "Error");
      setError("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    setUploading(true);
    setMessage("");
    setWarning("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("taskId", task.id);
      
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      if (sourceLink) {
        formData.append("sourceLink", sourceLink);
      }
      if (uploadNote) {
        formData.append("uploadNote", uploadNote);
      }
      if (outputType) {
        formData.append("outputType", outputType);
      }
      formData.append("isFinalCandidate", "true");

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

      void showSuccess("Hasil pekerjaan berhasil diserahkan! Status task diubah menjadi Menunggu Approval.");
      setMessage("Penyerahan berhasil. Task dipindahkan ke Menunggu Approval.");

      if (!result.whatsappSent) {
        void showWarning("Penyerahan berhasil, tetapi notifikasi WhatsApp gagal dikirim.");
        setWarning("Penyerahan berhasil, tetapi notifikasi WhatsApp gagal dikirim.");
      }

      resetUploadState();
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
          <CardTitle>Hasil Pekerjaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestUpload ? (
            latestUpload.upload_url ? (
              latestUpload.file_type?.startsWith("image/") ? (
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
                <div className="flex flex-col items-center justify-center rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-8 text-slate-500">
                  <FileText className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {latestUpload.file_name || "File Dokumen / Hasil"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Format: {latestUpload.file_type || "Dokumen"} | Ukuran: {formatFileSize(latestUpload.file_size)}
                  </p>
                  <Button asChild variant="secondary" size="sm" className="mt-4">
                    <a href={latestUpload.upload_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                      <ExternalLink className="h-4 w-4" />
                      Buka Berkas
                    </a>
                  </Button>
                </div>
              )
            ) : (
              <div className="rounded-[8px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-6 text-sm text-slate-500 dark:text-slate-400">
                Tugas diserahkan tanpa file (hanya link sumber atau catatan).
              </div>
            )
          ) : (
            <div className="rounded-[8px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-6 text-sm text-slate-500 dark:text-slate-400">
              Belum ada hasil pekerjaan.
            </div>
          )}

          {/* Rule-based warnings */}
          <div className="space-y-2">
            {task.requires_file && !latestUpload ? (
              <p className="rounded-[8px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ Tugas ini memiliki kategori yang <strong>wajib mengunggah file hasil</strong> (seperti poster/surat/laporan). Harap unggah berkas di bawah ini.
              </p>
            ) : null}
            {task.requires_source_link && !task.source_link ? (
              <p className="rounded-[8px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ Tugas ini <strong>wajib mencantumkan link sumber pengerjaan</strong> (Canva/Figma/Docs). Silakan sertakan link sumber saat menyerahkan hasil.
              </p>
            ) : null}
            {task.requires_file === false ? (
              <p className="rounded-[8px] bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 px-3.5 py-2.5 text-xs text-sky-800 dark:text-sky-300 font-medium">
                ℹ️ Kategori tugas ini <strong>tidak wajib mengunggah file hasil</strong> (hanya log aktivitas). Anda dapat menyerahkan tugas tanpa file, atau menyertakan link sumber / catatan pengerjaan saja.
              </p>
            ) : null}
          </div>

          {/* Confirmation Panel */}
          {isConfirming ? (
            <div className="rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-950 dark:text-slate-50">
                  Konfirmasi Penyerahan Hasil
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetUploadState}
                  disabled={uploading}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Left side: Preview & File Details */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Berkas Hasil
                  </span>
                  
                  {selectedFile ? (
                    <div className="space-y-3">
                      {previewUrl ? (
                        <div className="relative overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-black aspect-video max-h-48 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="Preview upload"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 text-slate-500 min-h-[120px]">
                          <FileText className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-2" />
                          <span className="text-xs font-medium text-slate-500">
                            File Non-Gambar
                          </span>
                        </div>
                      )}

                      <div className="rounded-[8px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                        <p className="truncate"><strong>Nama:</strong> {selectedFile.name}</p>
                        <p><strong>Ukuran:</strong> {formatFileSize(selectedFile.size)}</p>
                        <p><strong>Tipe:</strong> {selectedFile.type || "unknown"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-slate-500 min-h-[180px]">
                      <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                      <span className="text-sm font-semibold text-amber-850 dark:text-amber-400">
                        Penyerahan Tanpa File
                      </span>
                      <span className="text-xs text-center text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                        Hanya menyertakan link sumber pengerjaan atau catatan hasil.
                      </span>
                    </div>
                  )}

                  {task.requires_file && !selectedFile && (
                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-[8px] font-medium">
                      ⚠️ Peringatan: Kategori tugas ini disarankan mengunggah berkas. Anda tetap dapat melanjutkan tanpa file.
                    </p>
                  )}
                </div>

                {/* Right side: Metadata Inputs */}
                <div className="space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Informasi Pendukung
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="source-link-input" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Link Sumber Pengerjaan
                      </label>
                      <input
                        id="source-link-input"
                        type="url"
                        placeholder="https://canva.com/design/... atau Figma/Drive"
                        value={sourceLink}
                        onChange={(e) => setSourceLink(e.target.value)}
                        className="h-10 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-xs text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">
                        Opsional. Contoh: Canva, Figma, Google Drive.
                      </p>
                      {isDesignCategory && (
                        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          Jika desain dibuat di Canva/Figma, tambahkan link sumber agar mudah diedit ulang oleh penerus.
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="output-type-input" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Jenis Output
                      </label>
                      <input
                        id="output-type-input"
                        type="text"
                        placeholder="canva_link, figma_link, pdf, image, dll."
                        value={outputType}
                        onChange={(e) => setOutputType(e.target.value)}
                        className="h-10 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-xs text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800"
                      />
                      {task.output_types && task.output_types.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] text-slate-400 mr-1">Rekomendasi:</span>
                          {task.output_types.map((typeVal) => (
                            <button
                              key={typeVal}
                              type="button"
                              onClick={() => setOutputType(typeVal)}
                              className="text-[9px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              {typeVal}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="upload-note-input" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Catatan Upload
                      </label>
                      <textarea
                        id="upload-note-input"
                        placeholder="Tulis versi atau catatan revisi di sini..."
                        value={uploadNote}
                        onChange={(e) => setUploadNote(e.target.value)}
                        className="min-h-20 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={resetUploadState}
                  disabled={uploading}
                >
                  Batalkan
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUploadSubmit}
                  disabled={uploading}
                >
                  {uploading ? "Mengupload..." : "Lanjut Upload"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-[8px] border border-slate-200 dark:border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950 dark:text-slate-50">Upload Hasil Pekerjaan</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Gambar (JPG, PNG, WEBP), PDF, atau berkas spreadsheet. Max {formatFileSize(10 * 1024 * 1024)}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestUpload?.upload_url ? (
                  <Button asChild variant="secondary" size="sm">
                    <a href={latestUpload.upload_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                      <ExternalLink className="h-4 w-4" />
                      Buka File
                    </a>
                  </Button>
                ) : null}
                {canUpload ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Berkas Hasil
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const recommendedType = task.output_types && task.output_types.length > 0 ? task.output_types[0] : "";
                        setOutputType(recommendedType);
                        setIsConfirming(true);
                      }}
                      disabled={uploading}
                    >
                      Input Tanpa File
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
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
