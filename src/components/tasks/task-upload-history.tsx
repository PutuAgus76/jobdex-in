"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/upload-validation";
import type { TaskUpload, UserProfile } from "@/types";

type TaskUploadHistoryProps = {
  uploads: TaskUpload[];
  usersById: Map<string, UserProfile>;
};

function formatDateTime(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format((value as { toDate: () => Date }).toDate());
}

export function TaskUploadHistory({
  uploads,
  usersById,
}: TaskUploadHistoryProps) {
  if (!uploads.length) {
    return (
      <div className="rounded-[8px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Belum ada hasil desain yang diupload.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat upload</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-200">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="grid gap-2 py-3 text-sm md:grid-cols-[90px_1fr_120px]"
            >
              <span className="font-semibold text-slate-950">
                Versi {upload.version_number}
              </span>
              <div>
                <a
                  href={upload.upload_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-sky-700 hover:text-sky-900"
                >
                  {upload.file_name}
                </a>
                <p className="mt-1 text-slate-500">
                  {usersById.get(upload.uploaded_by)?.name ?? "User tidak ditemukan"} ·{" "}
                  {formatDateTime(upload.uploaded_at)}
                </p>
              </div>
              <span className="text-slate-500">{formatFileSize(upload.file_size)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
