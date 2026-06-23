import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthContext } from "@/lib/server/auth";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import { sendWhatsAppMessage, getWhatsAppRecipient } from "@/lib/server/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const db = getAdminDb();
  try {
    const { profile } = await getServerAuthContext(request);

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin yang diizinkan." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const mode = body.mode || "personal"; // "personal" or "group"

    const provider = process.env.WHATSAPP_PROVIDER || "wablas";
    let target = "";
    let type: "phone" | "group" = "phone";

    if (mode === "group") {
      target = getWhatsAppRecipient();
      type = "group";
    } else {
      target = process.env.FONNTE_TEST_TARGET || process.env.FONNTE_DEFAULT_TARGET || "";
      type = "phone";
    }

    if (!target) {
      return NextResponse.json(
        { error: `Target penerima untuk mode ${mode} belum diatur.` },
        { status: 400 }
      );
    }

    const message = [
      `[*JobdexIn* Test]`,
      `Provider ${provider.toUpperCase()} aktif.`,
      `Jika pesan ini masuk, integrasi WhatsApp outbound sudah berjalan.`,
    ].join("\n");

    const result = await sendWhatsAppMessage({
      target,
      message,
      type,
    });

    // Log result to whatsapp_logs
    const logRef = db.collection("whatsapp_logs").doc();
    await logRef.set({
      id: logRef.id,
      organization_id: profile.organization_id || "main_org",
      event_type: "whatsapp_test_send",
      message_content: message,
      recipient: target,
      recipient_type: type,
      is_group: type === "group",
      status: "sent",
      wablas_response: result.responseText || JSON.stringify(result.response || {}),
      retry_count: 0,
      created_at: FieldValue.serverTimestamp(),
      provider: result.provider,
      target_type: type,
    });

    return NextResponse.json({
      ok: true,
      message: "Pesan test WhatsApp berhasil dikirim.",
      result,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Gagal mengirim pesan test: ${errorMessage}` },
      { status: 500 }
    );
  }
}
