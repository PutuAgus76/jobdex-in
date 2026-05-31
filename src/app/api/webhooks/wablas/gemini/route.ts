import { NextResponse, type NextRequest } from "next/server";
import { AI_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { buildAIContext } from "@/lib/server/ai-context";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import {
  askGemini,
  GEMINI_EMPTY_ANSWER_FALLBACK,
  GEMINI_MODEL,
} from "@/lib/server/gemini";
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
import { parseWhatsAppCommand } from "@/lib/server/whatsapp-command-parser";
import { buildWhatsAppCommandPreview } from "@/lib/server/whatsapp-command-preview";
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

function sanitizePayload(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }

  const record = obj as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ["token", "secret", "authorization", "api_key", "apikey", "password", "credential"];

  for (const key of Object.keys(record)) {
    const isSensitive = sensitiveKeys.some(
      (s) => key.toLowerCase().includes(s)
    );
    if (isSensitive) {
      sanitized[key] = "[STRIPPED]";
    } else {
      sanitized[key] = sanitizePayload(record[key]);
    }
  }

  return sanitized;
}

function extractCandidates(payload: unknown): Record<string, string> {
  const candidates: Record<string, string> = {};
  
  if (!payload || typeof payload !== "object") return candidates;

  const root = payload as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object") ? (root.data as Record<string, unknown>) : {};
  const keyObj = (root.key && typeof root.key === "object") ? (root.key as Record<string, unknown>) : {};
  const dataKeyObj = (data.key && typeof data.key === "object") ? (data.key as Record<string, unknown>) : {};

  const getStr = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return "";
  };

  // Root level candidates
  candidates["sender"] = getStr(root.sender);
  candidates["from"] = getStr(root.from);
  candidates["phone"] = getStr(root.phone);
  candidates["author"] = getStr(root.author);
  candidates["participant"] = getStr(root.participant);
  candidates["sender_number"] = getStr(root.sender_number);
  candidates["phone_number"] = getStr(root.phone_number);
  candidates["key.participant"] = getStr(keyObj.participant);
  candidates["key.remoteJid"] = getStr(keyObj.remoteJid);

  // Data level candidates
  candidates["data.sender"] = getStr(data.sender);
  candidates["data.from"] = getStr(data.from);
  candidates["data.phone"] = getStr(data.phone);
  candidates["data.author"] = getStr(data.author);
  candidates["data.participant"] = getStr(data.participant);
  candidates["data.key.participant"] = getStr(dataKeyObj.participant);
  candidates["data.key.remoteJid"] = getStr(dataKeyObj.remoteJid);

  // Group participants candidates (extract from root or data.group)
  let group = (root.group && typeof root.group === "object") ? (root.group as Record<string, unknown>) : {};
  if (!group.participants) {
    const dataGroup = (data.group && typeof data.group === "object") ? (data.group as Record<string, unknown>) : {};
    if (dataGroup.participants) {
      group = dataGroup;
    }
  }

  const participants = Array.isArray(group.participants) ? group.participants : [];

  const getParticipantSender = (idx: number): string => {
    const p = participants[idx];
    if (p && typeof p === "object") {
      const pRecord = p as Record<string, unknown>;
      return getStr(pRecord.sender);
    }
    return "";
  };

  candidates["group.participants[0].sender"] = getParticipantSender(0);
  candidates["group.participants[1].sender"] = getParticipantSender(1);
  candidates["group.participants[2].sender"] = getParticipantSender(2);

  const allSenders: string[] = [];
  for (const p of participants) {
    if (p && typeof p === "object") {
      const pRecord = p as Record<string, unknown>;
      const s = getStr(pRecord.sender);
      if (s) allSenders.push(s);
    }
  }
  candidates["group_participant_senders"] = allSenders.join(", ");

  return candidates;
}

function cleanPhone(val: unknown): string {
  if (typeof val !== "string" && typeof val !== "number") return "";
  const str = String(val).trim();

  // Explicitly reject @lid domain
  if (str.toLowerCase().includes("@lid")) {
    return "";
  }

  // JID domain verification if @ is present
  if (str.includes("@")) {
    const domain = str.split("@")[1]?.toLowerCase();
    if (domain !== "s.whatsapp.net" && domain !== "c.us") {
      return "";
    }
  }

  // Clean numbers
  const cleaned = str.split("@")[0].replace(/[^\d]/g, "");

  // Safe phone length validation
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return cleaned;
  }

  return "";
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

  // --- RESOLVE SENDER FROM CANDIDATES & LOOKUP FIRESTORE ---
  interface CandidateSource {
    source: string;
    raw: string;
    normalized: string;
  }

  const detailedCandidates: CandidateSource[] = [];

  const rootGroup = (payload as Record<string, unknown>).group as Record<string, unknown> || {};
  const dataPayloadObj = (payload as Record<string, unknown>).data as Record<string, unknown> || {};
  const dataGroup = dataPayloadObj.group as Record<string, unknown> || {};

  const processParticipantsForSource = (participants: unknown[], isData: boolean) => {
    participants.forEach((p, idx) => {
      if (p && typeof p === "object") {
        const pRecord = p as Record<string, unknown>;
        const srcPrefix = isData ? `data.group.participants[${idx}]` : `group.participants[${idx}]`;
        
        // 1. sender
        const rawSender = String(pRecord.sender || "");
        const normSender = cleanPhone(pRecord.sender);
        if (normSender && normSender !== "6287798799068") {
          detailedCandidates.push({
            source: `${srcPrefix}.sender`,
            raw: rawSender,
            normalized: normSender,
          });
        }

        // 2. jid (only if valid and doesn't contain @lid)
        const rawJid = String(pRecord.jid || "");
        if (rawJid && !rawJid.toLowerCase().includes("@lid")) {
          const normJid = cleanPhone(pRecord.jid);
          if (normJid && normJid !== "6287798799068") {
            detailedCandidates.push({
              source: `${srcPrefix}.jid`,
              raw: rawJid,
              normalized: normJid,
            });
          }
        }
      }
    });
  };

  if (Array.isArray(rootGroup.participants)) {
    processParticipantsForSource(rootGroup.participants, false);
  }
  if (Array.isArray(dataGroup.participants)) {
    processParticipantsForSource(dataGroup.participants, true);
  }

  // Direct fields
  const addDirectSource = (key: string, val: unknown) => {
    const rawVal = String(val || "");
    const cleaned = cleanPhone(val);
    if (cleaned && cleaned !== "6287798799068") {
      detailedCandidates.push({
        source: key,
        raw: rawVal,
        normalized: cleaned,
      });
    }
  };

  const rootObj = payload as Record<string, unknown>;
  const keyObj = (rootObj.key && typeof rootObj.key === "object") ? (rootObj.key as Record<string, unknown>) : {};
  const dataKeyObj = (dataPayloadObj.key && typeof dataPayloadObj.key === "object") ? (dataPayloadObj.key as Record<string, unknown>) : {};

  addDirectSource("participant", rootObj.participant);
  addDirectSource("author", rootObj.author);
  addDirectSource("key.participant", keyObj.participant);
  addDirectSource("data.participant", dataPayloadObj.participant);
  addDirectSource("data.author", dataPayloadObj.author);
  addDirectSource("data.key.participant", dataKeyObj.participant);

  // Root sender (if not bot and not group ID)
  const isBotOrGroup = (val: string) => {
    return val === "6287798799068" || val.startsWith("120363") || val.includes("g.us");
  };

  const addRootSource = (key: string, val: unknown) => {
    const rawVal = String(val || "");
    const cleaned = cleanPhone(val);
    if (cleaned && !isBotOrGroup(cleaned)) {
      detailedCandidates.push({
        source: key,
        raw: rawVal,
        normalized: cleaned,
      });
    }
  };

  addRootSource("sender", rootObj.sender);
  addRootSource("from", rootObj.from);
  addRootSource("phone", rootObj.phone);
  addRootSource("data.sender", dataPayloadObj.sender);
  addRootSource("data.from", dataPayloadObj.from);
  addRootSource("data.phone", dataPayloadObj.phone);

  let senderUserProfile: UserProfile | null = null;
  let resolvedSenderNumber = incoming.sender;
  let senderSource = "fallback";

  for (const cand of detailedCandidates) {
    const userSnapshot = await getAdminDb()
      .collection("users")
      .where("whatsapp_number", "==", cand.normalized)
      .limit(1)
      .get();
    
    if (!userSnapshot.empty) {
      senderUserProfile = userSnapshot.docs[0].data() as UserProfile;
      resolvedSenderNumber = cand.normalized;
      senderSource = cand.source;
      break;
    }
  }

  // Fallback: If no registered user is found, pick the first valid non-bot candidate
  if (!senderUserProfile && detailedCandidates.length > 0) {
    resolvedSenderNumber = detailedCandidates[0].normalized;
    senderSource = detailedCandidates[0].source;
  }

  // WRITE DEEP DEBUG TO FIRESTORE COLLECTION "wablas_incoming_debug"
  try {
    const debugRef = getAdminDb().collection("wablas_incoming_debug").doc();
    const sanitizedBody = sanitizePayload(payload);
    const candidatesDump = extractCandidates(payload);
    
    const available_top_level_keys = Object.keys(payload || {});
    const available_data_keys = payload && typeof payload === "object" && (payload as Record<string, unknown>).data && typeof (payload as Record<string, unknown>).data === "object"
      ? Object.keys((payload as Record<string, unknown>).data as Record<string, unknown>)
      : [];

    await debugRef.set({
      created_at: FieldValue.serverTimestamp(),
      raw_body_sanitized: JSON.parse(JSON.stringify(sanitizedBody)),
      extracted_candidates: candidatesDump,
      raw_sender_candidates: detailedCandidates,
      selected_sender: incoming.sender || "",
      normalized_sender: resolvedSenderNumber,
      matched_user_id: senderUserProfile?.id ?? "",
      matched_user_name: senderUserProfile?.name ?? "",
      matched_user_role: senderUserProfile?.role ?? "",
      sender_source: senderSource,
      group_id: incoming.groupId || "",
      message_text: incoming.message || "",
      available_top_level_keys,
      available_data_keys,
    });
  } catch (debugError) {
    console.error("Failed to write wablas incoming debug log:", debugError);
  }

  if (!incoming.message || !question) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!isTargetGroup(incoming.groupId, incoming.sender)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const senderLabel = senderUserProfile 
    ? `${senderUserProfile.name} (${resolvedSenderNumber})` 
    : resolvedSenderNumber || incoming.sender;

  try {
    const lowerQuestion = question.toLowerCase().trim();
    const isStructured =
      lowerQuestion.startsWith("tambah jobdesk") ||
      lowerQuestion.startsWith("tambah acara") ||
      lowerQuestion.startsWith("tambah banyak jobdesk") ||
      lowerQuestion.startsWith("approve task");

    if (isStructured) {
      // 2. Parse command
      const parsedCommand = parseWhatsAppCommand(incoming.message);

      // 3. Build command preview (with resolved sender profile!)
      const previewResult = await buildWhatsAppCommandPreview(parsedCommand, senderUserProfile);

      // 4. Save preview log to Firestore collection ai_command_previews
      const previewLogRef = getAdminDb().collection("ai_command_previews").doc();
      await previewLogRef.set({
        id: previewLogRef.id,
        source: "whatsapp",
        raw_message: incoming.message,
        parsed_intent: parsedCommand.intent,
        parsed_fields: parsedCommand.fields || {},
        preview_text: previewResult.previewText,
        whatsapp_sender: senderLabel,
        whatsapp_group_id: incoming.groupId || "",
        created_at: FieldValue.serverTimestamp(),
      });

      // 5. Send preview reply to WhatsApp group
      const replyMessage = previewResult.previewText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      
      await createWhatsAppLog({
        message: replyMessage,
        status: "sent",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // --- Fallback: Standard Gemini AI Assistant ---
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
      GEMINI_EMPTY_ANSWER_FALLBACK,
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
