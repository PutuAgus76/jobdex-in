import { NextResponse, type NextRequest } from "next/server";
import { validateFileUpload } from "@/lib/upload-validation";
import { buildCloudinaryThumbnail, uploadImageBuffer } from "@/lib/server/cloudinary";
import { canUploadTaskResult, getServerAuthContext } from "@/lib/server/auth";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import { notifyTaskEvent } from "@/lib/server/notifications";
import type { Task } from "@/types";
import { recalculateEventProgressAdmin } from "@/lib/server/whatsapp-command-executor";

export const runtime = "nodejs";

function getSourceLinkType(url?: string): "canva" | "figma" | "google_docs" | "google_sheets" | "google_drive" | "other" | undefined {
  if (!url) return undefined;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("canva.com")) return "canva";
  if (lowerUrl.includes("figma.com")) return "figma";
  if (lowerUrl.includes("docs.google.com/document")) return "google_docs";
  if (lowerUrl.includes("docs.google.com/spreadsheets")) return "google_sheets";
  if (lowerUrl.includes("drive.google.com")) return "google_drive";
  return "other";
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await getServerAuthContext(request);
    const formData = await request.formData();
    const taskId = formData.get("taskId");
    const file = formData.get("file");

    const sourceLink = formData.get("sourceLink") as string | null;
    const uploadNote = formData.get("uploadNote") as string | null;
    const outputType = formData.get("outputType") as string | null;
    const isFinalCandidateStr = formData.get("isFinalCandidate") as string | null;
    const isFinalCandidate = isFinalCandidateStr === "false" ? false : true;

    if (typeof taskId !== "string" || !taskId) {
      return NextResponse.json(
        { error: "Task ID wajib diisi." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnapshot = await taskRef.get();

    if (!taskSnapshot.exists) {
      return NextResponse.json(
        { error: "Task tidak ditemukan." },
        { status: 404 },
      );
    }

    const task = {
      id: taskSnapshot.id,
      ...taskSnapshot.data(),
    } as Task;

    if (!(await canUploadTaskResult(profile, task))) {
      return NextResponse.json(
        { error: "Anda tidak punya akses upload untuk task ini." },
        { status: 403 },
      );
    }

    const hasFile = file instanceof File && file.name && file.size > 0;
    
    if (hasFile && file instanceof File) {
      const validation = validateFileUpload(file);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const uploadCount = await taskRef.collection("uploads").count().get();
    const versionNumber = (uploadCount.data().count ?? 0) + 1;

    let uploadUrl = "";
    let thumbnailUrl = "";
    let publicId = "";
    let fileName = "";
    let fileSize = 0;
    let fileType = "";

    if (hasFile && file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const folder = `jobdex/${task.organization_id || "main_org"}/tasks/${taskId}`;
      const cloudinaryResult = await uploadImageBuffer({
        buffer,
        folder,
        fileName: file.name,
      });
      uploadUrl = cloudinaryResult.secure_url;
      const isImage = file.type.startsWith("image/");
      thumbnailUrl = isImage ? buildCloudinaryThumbnail(cloudinaryResult.public_id) : "";
      publicId = cloudinaryResult.public_id;
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;
    }

    const sourceLinkType = getSourceLinkType(sourceLink || undefined);

    const uploadRef = taskRef.collection("uploads").doc();
    const shouldCreateStatusLog = task.status !== "menunggu_approval";
    const logRef = shouldCreateStatusLog
      ? taskRef.collection("status_logs").doc()
      : null;
    const batch = db.batch();

    batch.set(uploadRef, {
      id: uploadRef.id,
      task_id: taskId,
      upload_url: uploadUrl,
      thumbnail_url: thumbnailUrl,
      public_id: publicId,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      version_number: versionNumber,
      uploaded_by: profile.id,
      uploaded_at: FieldValue.serverTimestamp(),
      source_link: sourceLink || "",
      source_link_type: sourceLinkType || "",
      upload_note: uploadNote || "",
      output_type: outputType || "",
      is_final_candidate: isFinalCandidate,
    });

    const taskUpdatePayload: Record<string, unknown> = {
      status: "menunggu_approval",
      approval_status: "pending",
      updated_at: FieldValue.serverTimestamp(),
    };

    if (uploadUrl) {
      taskUpdatePayload.result_design_url = uploadUrl;
    }
    if (sourceLink) {
      taskUpdatePayload.source_link = sourceLink;
    }

    batch.update(taskRef, taskUpdatePayload);

    if (logRef) {
      batch.set(logRef, {
        id: logRef.id,
        task_id: taskId,
        from_status: task.status,
        to_status: "menunggu_approval",
        changed_by: profile.id,
        note: hasFile ? "Hasil pengerjaan diupload." : "Hasil pengerjaan diserahkan (tanpa file).",
        created_at: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    if (task.type === "acara" && task.event_id) {
      await recalculateEventProgressAdmin(task.event_id);
    }

    const notification = await notifyTaskEvent({
      eventType: "task_result_uploaded",
      taskId,
      actorId: profile.id,
      status: "menunggu_approval",
      note: hasFile ? "Hasil pengerjaan diupload." : "Hasil pengerjaan diserahkan (tanpa file).",
      uploadUrl,
      thumbnailUrl,
    });

    return NextResponse.json({
      ok: true,
      whatsappSent: notification.sent,
      upload: {
        id: uploadRef.id,
        upload_url: uploadUrl,
        thumbnail_url: thumbnailUrl,
        version_number: versionNumber,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload hasil desain gagal diproses.",
      },
      { status: 500 },
    );
  }
}
