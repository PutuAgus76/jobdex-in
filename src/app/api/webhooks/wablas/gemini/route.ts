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
import {
  confirmPreviewCommand,
  cancelPreviewCommand,
  sanitizePinFromMessage,
} from "@/lib/server/whatsapp-command-executor";
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

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizePhone(value: string): string {
  return value
    .replace(/\@s\.whatsapp\.net$/i, "")
    .replace(/\@c\.us$/i, "")
    .replace(/\D/g, "")
    .replace(/^0/, "62")
    .replace(/^8/, "628");
}

function findGroupParticipantSender(payload: unknown): {
  normalized: string;
  source: string;
  raw: string;
} | null {
  const root = getRecord(payload);
  const data = getRecord(root?.data);
  const group = getRecord(root?.group) ?? getRecord(data?.group);
  const participants = getArray(group?.participants);

  const groupId = normalizePhone(getString(root?.phone) || getString(group?.group_id));
  const deviceSender = normalizePhone(getString(root?.sender));

  for (let i = 0; i < participants.length; i++) {
    const participant = getRecord(participants[i]);
    const rawSender = getString(participant?.sender);
    const normalized = normalizePhone(rawSender);

    if (
      normalized &&
      normalized.startsWith("62") &&
      normalized !== groupId &&
      normalized !== deviceSender &&
      !normalized.startsWith("120363")
    ) {
      return {
        normalized,
        raw: rawSender,
        source: `group.participants[${i}].sender`,
      };
    }
  }

  return null;
}

function extractCandidates(payload: unknown): Record<string, string> {
  const candidates: Record<string, string> = {};
  
  if (!payload || typeof payload !== "object") return candidates;

  const root = getRecord(payload);
  const data = getRecord(root?.data);
  const keyObj = getRecord(root?.key);
  const dataKeyObj = getRecord(data?.key);

  const getStr = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return "";
  };

  // Root level candidates
  candidates["sender"] = getStr(root?.sender);
  candidates["from"] = getStr(root?.from);
  candidates["phone"] = getStr(root?.phone);
  candidates["author"] = getStr(root?.author);
  candidates["participant"] = getStr(root?.participant);
  candidates["sender_number"] = getStr(root?.sender_number);
  candidates["phone_number"] = getStr(root?.phone_number);
  candidates["key.participant"] = getStr(keyObj?.participant);
  candidates["key.remoteJid"] = getStr(keyObj?.remoteJid);

  // Data level candidates
  candidates["data.sender"] = getStr(data?.sender);
  candidates["data.from"] = getStr(data?.from);
  candidates["data.phone"] = getStr(data?.phone);
  candidates["data.author"] = getStr(data?.author);
  candidates["data.participant"] = getStr(data?.participant);
  candidates["data.key.participant"] = getStr(dataKeyObj?.participant);
  candidates["data.key.remoteJid"] = getStr(dataKeyObj?.remoteJid);

  // Group participants candidates (extract from root or data.group)
  const group = getRecord(root?.group) ?? getRecord(data?.group);
  const participants = getArray(group?.participants);

  const getParticipantSender = (idx: number): string => {
    const p = getRecord(participants[idx]);
    if (p) {
      return normalizePhone(getString(p.sender));
    }
    return "";
  };

  candidates["group.participants[0].sender"] = getParticipantSender(0);
  candidates["group.participants[1].sender"] = getParticipantSender(1);
  candidates["group.participants[2].sender"] = getParticipantSender(2);

  const allSenders: string[] = [];
  for (let i = 0; i < participants.length; i++) {
    const p = getRecord(participants[i]);
    if (p) {
      const s = normalizePhone(getString(p.sender));
      if (s) allSenders.push(s);
    }
  }
  candidates["group_participant_senders"] = allSenders.join(", ");

  return candidates;
}

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function scrubPinFromPayload(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") {
    if (typeof obj === "string") {
      return sanitizePinFromMessage(obj);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(scrubPinFromPayload);
  }
  
  const record = obj as Record<string, unknown>;
  const scrubbed: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    scrubbed[key] = scrubPinFromPayload(record[key]);
  }
  return scrubbed;
}

function cleanPhone(val: unknown): string {
  const str = getString(val);
  if (!str) return "";
  const cleaned = normalizePhone(str);
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

  interface CandidateSource {
    source: string;
    raw: string;
    normalized: string;
  }

  const rootObj = getRecord(payload) || {};
  const dataPayloadObj = getRecord(rootObj.data) || {};
  const detailedCandidates: CandidateSource[] = [];

  // 1. Try finding group participant sender using explicit helper
  const participantSender = findGroupParticipantSender(payload);

  let senderUserProfile: UserProfile | null = null;
  let resolvedSenderNumber = "";
  let senderSource = "";

  if (participantSender) {
    resolvedSenderNumber = participantSender.normalized;
    senderSource = participantSender.source;
    detailedCandidates.push({
      source: participantSender.source,
      raw: participantSender.raw,
      normalized: participantSender.normalized,
    });
  } else {
    resolvedSenderNumber = incoming.sender;
    senderSource = "fallback";

    // Populate backup fallback candidates
    const keyObj = getRecord(rootObj.key) || {};
    const dataKeyObj = getRecord(dataPayloadObj.key) || {};

    const addDirectSource = (key: string, val: unknown) => {
      const rawVal = String(val || "");
      const cleaned = cleanPhone(val);
      if (cleaned && cleaned !== "6287798799068" && cleaned !== resolvedSenderNumber) {
        detailedCandidates.push({
          source: key,
          raw: rawVal,
          normalized: cleaned,
        });
      }
    };

    addDirectSource("participant", rootObj.participant);
    addDirectSource("author", rootObj.author);
    addDirectSource("key.participant", keyObj.participant);
    addDirectSource("data.participant", dataPayloadObj.participant);
    addDirectSource("data.author", dataPayloadObj.author);
    addDirectSource("data.key.participant", dataKeyObj.participant);

    const isBotOrGroup = (val: string) => {
      return val === "6287798799068" || val.startsWith("120363") || val.includes("g.us");
    };

    const addRootSource = (key: string, val: unknown) => {
      const rawVal = String(val || "");
      const cleaned = cleanPhone(val);
      if (cleaned && !isBotOrGroup(cleaned) && cleaned !== resolvedSenderNumber) {
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
  }

  // Firestore user lookup
  const userSnapshot = await getAdminDb()
    .collection("users")
    .where("whatsapp_number", "==", resolvedSenderNumber)
    .limit(1)
    .get();

  if (!userSnapshot.empty) {
    senderUserProfile = userSnapshot.docs[0].data() as UserProfile;
  } else {
    // Try fallback candidates in order
    for (const cand of detailedCandidates) {
      if (cand.normalized === resolvedSenderNumber) continue;
      const fbSnapshot = await getAdminDb()
        .collection("users")
        .where("whatsapp_number", "==", cand.normalized)
        .limit(1)
        .get();
      if (!fbSnapshot.empty) {
        senderUserProfile = fbSnapshot.docs[0].data() as UserProfile;
        resolvedSenderNumber = cand.normalized;
        senderSource = cand.source;
        break;
      }
    }
  }

  // WRITE DEEP DEBUG TO FIRESTORE COLLECTION "wablas_incoming_debug" (scrub PIN!)
  try {
    const debugRef = getAdminDb().collection("wablas_incoming_debug").doc();
    const sanitizedBody = scrubPinFromPayload(sanitizePayload(payload));
    const candidatesDump = extractCandidates(payload);
    
    const available_top_level_keys = Object.keys(payload && typeof payload === "object" ? payload : {});
    const available_data_keys = dataPayloadObj ? Object.keys(dataPayloadObj) : [];

    await debugRef.set({
      created_at: FieldValue.serverTimestamp(),
      raw_body_sanitized: JSON.parse(JSON.stringify(sanitizedBody)),
      extracted_candidates: candidatesDump,
      raw_sender_candidates: detailedCandidates,
      selected_sender: resolvedSenderNumber, // force selection
      normalized_sender: resolvedSenderNumber,
      matched_user_id: senderUserProfile?.id ?? "",
      matched_user_name: senderUserProfile?.name ?? "",
      matched_user_role: senderUserProfile?.role ?? "",
      sender_source: senderSource,
      group_id: incoming.groupId || "",
      message_text: sanitizePinFromMessage(incoming.message || ""),
      group_participant_senders: candidatesDump["group_participant_senders"] || "",
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

    // Fase 12C: Detect konfirmasi / batal command first!
    if (lowerQuestion.startsWith("konfirmasi") || lowerQuestion.startsWith("batal")) {
      const parsedCommand = parseWhatsAppCommand(incoming.message);
      const code = String(parsedCommand.fields.code || "").toUpperCase();
      const pin = String(parsedCommand.fields.pin || "");

      let result;
      if (parsedCommand.intent === "confirm_command") {
        result = await confirmPreviewCommand(code, pin);
      } else {
        result = await cancelPreviewCommand(code, pin);
      }

      // Send execution reply to WhatsApp group
      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);

      // Save WhatsApp reply log (scrub PIN!)
      await createWhatsAppLog({
        message: sanitizePinFromMessage(replyMessage),
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

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

      // Generate Preview ID & instruction ONLY if preview is valid and is not approve task (approve task remains preview only)
      let confirmationCode = "";
      let status = "failed";
      let expiresAt: Date | null = null;
      let replyMessage = previewResult.previewText;

      const isApprove = parsedCommand.intent === "approve_task_preview";

      if (previewResult.isValid && !isApprove) {
        confirmationCode = generateConfirmationCode();
        status = "pending";
        expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        // Replace the placeholder note or append
        const oldNote = "Preview ini belum disimpan ke database.";
        const oldNote2 = "Preview ini belum dijalankan.";
        const instruction = [
          `Preview ID: ${confirmationCode}`,
          `Untuk menyimpan ke database, balas:`,
          `!jobdex konfirmasi ${confirmationCode} pin: 1234`
        ].join("\n");

        if (replyMessage.includes(oldNote)) {
          replyMessage = replyMessage.replace(oldNote, `${instruction}\n\nCatatan:\n${oldNote}`);
        } else if (replyMessage.includes(oldNote2)) {
          replyMessage = replyMessage.replace(oldNote2, `${instruction}\n\nCatatan:\n${oldNote2}`);
        } else {
          replyMessage = replyMessage + `\n\n${instruction}`;
        }
      }

      const scrubbedFields: Record<string, string> = {};
      for (const key of Object.keys(parsedCommand.fields || {})) {
        scrubbedFields[key] = sanitizePinFromMessage(parsedCommand.fields[key]);
      }

      const scrubbedItems = (parsedCommand.items || []).map((item) => {
        const cleaned: Record<string, string> = {};
        for (const key of Object.keys(item)) {
          cleaned[key] = sanitizePinFromMessage(item[key]);
        }
        return cleaned;
      });

      // 4. Save preview log to Firestore collection ai_command_previews
      const previewLogRef = getAdminDb().collection("ai_command_previews").doc();
      await previewLogRef.set({
        id: previewLogRef.id,
        source: "whatsapp",
        raw_message: sanitizePinFromMessage(incoming.message),
        parsed_intent: parsedCommand.intent,
        parsed_fields: scrubbedFields,
        parsed_items: scrubbedItems,
        preview_text: replyMessage,
        whatsapp_sender: senderLabel,
        whatsapp_group_id: incoming.groupId || "",
        created_at: FieldValue.serverTimestamp(),
        // New Fase 12C fields
        confirmation_code: confirmationCode,
        status: status,
        expires_at: expiresAt || null,
      });

      // 5. Send preview reply to WhatsApp group
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
      sanitizePinFromMessage(question),
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
      question: sanitizePinFromMessage(question),
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
      sanitizePinFromMessage(question),
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
