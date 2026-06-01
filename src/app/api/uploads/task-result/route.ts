import { NextResponse, type NextRequest } from "next/server";
import { validateImageUpload } from "@/lib/upload-validation";
import { buildCloudinaryThumbnail, uploadImageBuffer } from "@/lib/server/cloudinary";
import { canUploadTaskResult, getServerAuthContext } from "@/lib/server/auth";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import { notifyTaskEvent } from "@/lib/server/notifications";
import type { Task } from "@/types";
import { recalculateEventProgressAdmin } from "@/lib/server/whatsapp-command-executor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { profile } = await getServerAuthContext(request);
    const formData = await request.formData();
    const taskId = formData.get("taskId");
    const file = formData.get("file");

    if (typeof taskId !== "string" || !taskId) {
      return NextResponse.json(
        { error: "Task ID wajib diisi." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File gambar wajib diunggah." },
        { status: 400 },
      );
    }

    const validation = validateImageUpload(file);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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

    if (!canUploadTaskResult(profile, task)) {
      return NextResponse.json(
        { error: "Anda tidak punya akses upload untuk task ini." },
        { status: 403 },
      );
    }

    const uploadCount = await taskRef.collection("uploads").count().get();
    const versionNumber = (uploadCount.data().count ?? 0) + 1;
    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = `jobdex/${task.organization_id || "main_org"}/tasks/${taskId}`;
    const cloudinaryResult = await uploadImageBuffer({
      buffer,
      folder,
      fileName: file.name,
    });
    const thumbnailUrl = buildCloudinaryThumbnail(cloudinaryResult.public_id);
    const uploadRef = taskRef.collection("uploads").doc();
    const shouldCreateStatusLog = task.status !== "menunggu_approval";
    const logRef = shouldCreateStatusLog
      ? taskRef.collection("status_logs").doc()
      : null;
    const batch = db.batch();

    batch.set(uploadRef, {
      id: uploadRef.id,
      task_id: taskId,
      upload_url: cloudinaryResult.secure_url,
      thumbnail_url: thumbnailUrl,
      public_id: cloudinaryResult.public_id,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      version_number: versionNumber,
      uploaded_by: profile.id,
      uploaded_at: FieldValue.serverTimestamp(),
    });
    batch.update(taskRef, {
      status: "menunggu_approval",
      approval_status: "pending",
      result_design_url: cloudinaryResult.secure_url,
      updated_at: FieldValue.serverTimestamp(),
    });

    if (logRef) {
      batch.set(logRef, {
        id: logRef.id,
        task_id: taskId,
        from_status: task.status,
        to_status: "menunggu_approval",
        changed_by: profile.id,
        note: "Hasil desain diupload.",
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
      note: "Hasil desain diupload.",
      uploadUrl: cloudinaryResult.secure_url,
      thumbnailUrl,
    });

    return NextResponse.json({
      ok: true,
      whatsappSent: notification.sent,
      upload: {
        id: uploadRef.id,
        upload_url: cloudinaryResult.secure_url,
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
