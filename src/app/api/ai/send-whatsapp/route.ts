import { NextResponse, type NextRequest } from "next/server";
import { canAccessAI } from "@/lib/permissions";
import { getServerAuthContext } from "@/lib/server/auth";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import {
  getWhatsAppRecipient,
  getWhatsAppRecipientType,
  isWhatsAppGroupRecipient,
  sendWhatsAppMessage,
} from "@/lib/server/whatsapp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const db = getAdminDb();
  let organizationId = "main_org";
  let message = "";

  try {
    const { profile } = await getServerAuthContext(request);

    if (!canAccessAI(profile)) {
      return NextResponse.json(
        { error: "Anda tidak punya akses mengirim ringkasan AI." },
        { status: 403 },
      );
    }

    organizationId = profile.organization_id || "main_org";
    const body = (await request.json()) as {
      answer?: string;
    };
    const answer = body.answer?.trim() ?? "";

    if (!answer) {
      return NextResponse.json(
        { error: "Jawaban AI wajib diisi." },
        { status: 400 },
      );
    }

    message = ["[JobDex.in] Ringkasan AI Assistant", "", answer].join("\n");
    const result = await sendWhatsAppMessage({
      target: getWhatsAppRecipient(),
      message,
      type: isWhatsAppGroupRecipient() ? "group" : "phone",
    });
    const logRef = db.collection("whatsapp_logs").doc();

    await logRef.set({
      id: logRef.id,
      organization_id: organizationId,
      event_type: "ai_answer_sent",
      message_content: message,
      recipient: getWhatsAppRecipient(),
      recipient_type: getWhatsAppRecipientType(),
      is_group: isWhatsAppGroupRecipient(),
      status: "sent",
      wablas_response: result.responseText,
      retry_count: 0,
      created_at: FieldValue.serverTimestamp(),
      provider: result.provider,
      target_type: isWhatsAppGroupRecipient() ? "group" : "phone",
    });

    return NextResponse.json({ ok: true, whatsappSent: true });
  } catch (error) {
    const logRef = db.collection("whatsapp_logs").doc();

    await logRef.set({
      id: logRef.id,
      organization_id: organizationId,
      event_type: "ai_answer_sent",
      message_content: message || "[JobDex.in] Ringkasan AI Assistant",
      recipient: getWhatsAppRecipient(),
      recipient_type: getWhatsAppRecipientType(),
      is_group: isWhatsAppGroupRecipient(),
      status: "failed",
      error_message:
        error instanceof Error
          ? error.message
          : "Ringkasan AI gagal dikirim ke WhatsApp.",
      retry_count: 0,
      created_at: FieldValue.serverTimestamp(),
      provider: process.env.WHATSAPP_PROVIDER || "wablas",
      target_type: isWhatsAppGroupRecipient() ? "group" : "phone",
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ringkasan AI gagal dikirim ke WhatsApp.",
      },
      { status: 500 },
    );
  }
}
