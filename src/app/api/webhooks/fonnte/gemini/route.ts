import { NextResponse, type NextRequest } from "next/server";
import { normalizeFonnteWebhookPayload } from "@/lib/server/fonnte-webhook-parser";
import { executeWhatsAppWebhook } from "@/lib/server/whatsapp/command-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Check if FONNTE Webhook is enabled
  if (process.env.FONNTE_WEBHOOK_ENABLED === "false") {
    return NextResponse.json({ error: "FONNTE Webhook is disabled." }, { status: 403 });
  }

  // Parse request body
  let payload: unknown;
  try {
    const text = await request.text();
    if (!text) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }
    payload = JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Fonnte webhook payload:", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payloadObj = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  // Securely log payload structure (keys only, no values to avoid printing tokens or phone numbers)
  console.log("[fonnte webhook] payload keys", Object.keys(payloadObj));

  // Validate Secret Key if configured in env
  const configuredSecret = process.env.FONNTE_WEBHOOK_SECRET ?? "";
  if (configuredSecret) {
    const tokenFromPayload = typeof payloadObj.token === "string" ? payloadObj.token : "";
    const secretFromPayload = typeof payloadObj.secret === "string" ? payloadObj.secret : "";

    const incomingToken = request.headers.get("Authorization") || 
                          request.headers.get("token") || 
                          request.headers.get("x-fonnte-token") ||
                          request.headers.get("x-fonnte-secret") ||
                          tokenFromPayload || 
                          secretFromPayload || 
                          "";

    if (incomingToken !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
    }
  }

  // Normalize Fonnte payload
  const incoming = normalizeFonnteWebhookPayload(payload);
  if (!incoming) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: "invalid_or_non_message_payload",
    });
  }

  // Guard against malformed messages
  if (!incoming.message || !incoming.sender) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: "missing_message_or_sender",
    });
  }

  // Forward to shared command execution engine
  return executeWhatsAppWebhook(incoming, payload);
}
