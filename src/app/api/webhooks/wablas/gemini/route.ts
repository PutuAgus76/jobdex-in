import { NextResponse, type NextRequest } from "next/server";
import { AI_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { buildAIContext } from "@/lib/server/ai-context";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import { askGemini, GEMINI_MODEL } from "@/lib/server/gemini";
import {
  getWhatsAppRecipient,
  getWhatsAppRecipientType,
  isWhatsAppGroupRecipient,
  sendWhatsAppMessage,
} from "@/lib/server/whatsapp";
import {
  extractJobDexQuestion,
  parseWablasIncomingPayload,
} from "@/lib/server/wablas-webhook-parser";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";

async function parseRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  const text = await request.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { body: text };
  }
}

function getWebhookSecret() {
  return process.env.WABLAS_WEBHOOK_SECRET ?? "";
}

function isTargetGroup(groupId: string, sender: string) {
  const targetGroupId = process.env.WABLAS_GROUP_ID;

  if (!targetGroupId) {
    return false;
  }

  return groupId === targetGroupId || sender === targetGroupId;
}

function getBotProfile() {
  return {
    id: "whatsapp_bot",
    organization_id: "main_org",
    name: "WhatsApp Bot",
    email: "",
    whatsapp_number: "",
    role: "super_admin",
    division_id: "humas_media_kreatif",
    avatar_url: "",
    is_active: true,
  } satisfies UserProfile;
}

async function createWhatsAppLog({
  message,
  status,
  response,
  errorMessage,
}: {
  message: string;
  status: "sent" | "failed";
  response?: string;
  errorMessage?: string;
}) {
  const logRef = getAdminDb().collection("whatsapp_logs").doc();

  await logRef.set({
    id: logRef.id,
    organization_id: "main_org",
    event_type: "whatsapp_ai_bot_reply",
    message_content: message,
    recipient: getWhatsAppRecipient(),
    recipient_type: getWhatsAppRecipientType(),
    is_group: isWhatsAppGroupRecipient(),
    status,
    ...(response ? { wablas_response: response } : {}),
    ...(errorMessage ? { error_message: errorMessage } : {}),
    retry_count: 0,
    created_at: FieldValue.serverTimestamp(),
  });
}

export async function POST(request: NextRequest) {
  const configuredSecret = getWebhookSecret();
  const requestSecret = request.nextUrl.searchParams.get("secret") ?? "";

  if (!configuredSecret || requestSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  const payload = await parseRequestBody(request);
  const incoming = parseWablasIncomingPayload(payload);
  const question = extractJobDexQuestion(incoming.message);

  if (!incoming.message || !question) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!isTargetGroup(incoming.groupId, incoming.sender)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const senderLabel = incoming.senderName || incoming.sender || "WhatsApp";

  try {
    const { contextSummary } = await buildAIContext({
      profile: getBotProfile(),
    });
    const prompt = [
      "CONTEXT JOBDEX.IN:",
      contextSummary,
      "",
      "PERTANYAAN DARI WHATSAPP:",
      question,
      "",
      "Instruksi jawaban: jawab ringkas, siap dibaca di WhatsApp group, dan jangan memakai data di luar context.",
    ].join("\n");
    const answer = await askGemini({
      systemPrompt: AI_SYSTEM_PROMPT,
      prompt,
    });
    const aiLogRef = getAdminDb().collection("ai_logs").doc();

    await aiLogRef.set({
      id: aiLogRef.id,
      organization_id: "main_org",
      asked_by: "whatsapp_bot",
      question,
      context_summary: contextSummary.slice(0, 12000),
      answer,
      model_used: GEMINI_MODEL,
      source: "whatsapp",
      whatsapp_sender: senderLabel,
      whatsapp_group_id: process.env.WABLAS_GROUP_ID ?? "",
      created_at: FieldValue.serverTimestamp(),
    });

    const replyMessage = [
      "[JobDex.in AI]",
      "",
      "Pertanyaan:",
      question,
      "",
      "Jawaban:",
      answer,
    ].join("\n");
    const sendResult = await sendWhatsAppMessage(replyMessage);
    await createWhatsAppLog({
      message: replyMessage,
      status: "sent",
      response: sendResult.responseText,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorReply = [
      "[JobDex.in AI]",
      "Maaf, AI sedang tidak bisa menjawab. Coba lagi nanti.",
    ].join("\n");

    try {
      const sendResult = await sendWhatsAppMessage(errorReply);
      await createWhatsAppLog({
        message: errorReply,
        status: "sent",
        response: sendResult.responseText,
      });
    } catch (sendError) {
      await createWhatsAppLog({
        message: errorReply,
        status: "failed",
        errorMessage:
          sendError instanceof Error
            ? sendError.message
            : "Gagal mengirim error reply ke WhatsApp.",
      });
    }

    return NextResponse.json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Webhook AI gagal diproses.",
    });
  }
}
