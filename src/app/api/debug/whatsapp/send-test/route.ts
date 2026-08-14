import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthContext } from "@/lib/server/auth";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import { sendWhatsAppMessage, getWhatsAppRecipient } from "@/lib/server/whatsapp";
import { getWhatsAppSystemSettings, DEFAULT_SANDBOX_TEST_GROUP_ID } from "@/lib/server/whatsapp-settings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const db = getAdminDb();
  try {
    const { profile } = await getServerAuthContext(request);

    if (!profile || (profile.role !== "super_admin" && profile.role !== "koordinator_divisi")) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin atau Koordinator Divisi yang diizinkan." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const mode = body.mode || "sandbox_ping"; // "sandbox_ping", "personal", or "group"
    const settings = await getWhatsAppSystemSettings(true);

    const provider = process.env.WHATSAPP_PROVIDER || "fonnte";
    let target = "";
    let type: "phone" | "group" = "group";

    if (mode === "sandbox_ping") {
      target = body.target || settings.testGroupId || DEFAULT_SANDBOX_TEST_GROUP_ID;
      type = "group";
    } else if (mode === "group") {
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

    const timeString = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta",
    }).format(new Date());

    const message = [
      "🤖 *JobDex.in - WhatsApp Ping Test*",
      "",
      `Status Sandbox: *${settings.isTestMode ? "AKTIF (Sandbox ON)" : "NONAKTIF (Production)"}*`,
      `Provider Gateway: *${provider.toUpperCase()}*`,
      `Target: *${target}*`,
      `Waktu Server: ${timeString}`,
      `Dites oleh: *${profile.name} (${profile.role})*`,
      "",
      "✅ Koneksi outbound bot WhatsApp berjalan dengan baik.",
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
      message: `Pesan test WhatsApp berhasil dikirim ke ${target}.`,
      target,
      isTestMode: settings.isTestMode,
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
