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
import { parseWhatsAppCommand, isTaskCommandLike } from "@/lib/server/whatsapp-command-parser";
import { buildWhatsAppCommandPreview } from "@/lib/server/whatsapp-command-preview";
import {
  confirmPreviewCommand,
  cancelPreviewCommand,
  sanitizePinFromMessage,
} from "@/lib/server/whatsapp-command-executor";
import {
  handleDeadlineQuery,
  handleApproveTaskCommand,
  handleUpdateTaskStatusCommand,
  handleEditTaskCommand,
  handleConfirmEditTaskCommand,
  handleCancelEditTaskCommand,
  handleArchiveTaskCommand,
  handleConfirmArchiveCommand,
  handleChecklistCommand,
  validateCommandPin,
} from "@/lib/server/whatsapp-task-command-executor";
import type { UserProfile } from "@/types";
import {
  isReferenceSearchQuestion,
  searchDesignReferencesFromQuestion,
} from "@/lib/server/reference-search";

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

function formatStatusVal(status: string): string {
  const clean = status.toLowerCase().replace(/[\s\-_]+/g, " ").trim();
  if (clean.includes("belum mulai") || clean.includes("belum dimulai") || clean === "belum_dimulai") return "Belum Dimulai";
  if (clean.includes("sedang dikerjakan") || clean.includes("dikerjakan") || clean.includes("kerja") || clean === "sedang_dikerjakan") return "Sedang Dikerjakan";
  if (clean.includes("butuh bantuan") || clean.includes("bantuan") || clean === "butuh_bantuan") return "Butuh Bantuan";
  if (clean.includes("stuck") || clean.includes("macet") || clean === "stuck") return "Stuck";
  if (clean.includes("menunggu materi") || clean.includes("materi") || clean === "menunggu_materi") return "Menunggu Materi";
  if (clean.includes("draft selesai") || clean.includes("draft") || clean === "draft_selesai") return "Draft Selesai";
  if (clean.includes("perlu revisi") || clean.includes("revisi") || clean === "perlu_revisi") return "Perlu Revisi";
  if (clean.includes("revisi dikerjakan") || clean === "revisi_dikerjakan") return "Revisi Dikerjakan";
  if (clean.includes("menunggu approval") || clean.includes("approval") || clean === "menunggu_approval") return "Menunggu Approval";
  if (clean.includes("approved") || clean.includes("selesai") || clean.includes("acc") || clean === "approved") return "Approved";
  if (clean.includes("ditunda") || clean.includes("tunda") || clean === "ditunda") return "Ditunda";
  return status;
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
  let debugRefId = "";
  try {
    const debugRef = getAdminDb().collection("wablas_incoming_debug").doc();
    debugRefId = debugRef.id;
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
    const isTaskLike = isTaskCommandLike(incoming.message || "");
    const isRefSearch = isReferenceSearchQuestion(question);

    const updateDebugIntent = async (
      routedTo: "task_command" | "task_help" | "reference_search" | "gemini_fallback",
      parsedTaskIntent: string | null
    ) => {
      if (!debugRefId) return;
      try {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          intent_debug: {
            is_task_command_like: isTaskLike,
            parsed_task_intent: parsedTaskIntent,
            is_reference_search: isRefSearch,
            routed_to: routedTo,
          }
        });
      } catch (err) {
        console.error("Failed to update intent_debug in wablas_incoming_debug:", err);
      }
    };

    const parsedCommand = parseWhatsAppCommand(incoming.message);
    const intent = parsedCommand.intent;

    // Fase 15C: Bantuan Task Command
    if (intent === "bantuan_task") {
      const replyMessage = [
        "[JobDex.in Bantuan Task]",
        "",
        "Command yang tersedia:",
        "",
        "1. Cek deadline:",
        "!jobdex deadline dekat",
        "!jobdex tugas h-3",
        "!jobdex tugas overdue",
        "!jobdex siapa yang stuck",
        "",
        "2. Approve task:",
        "!jobdex approve task Nama Task pin: 9703",
        "",
        "3. Update status:",
        "!jobdex update status Nama Task menjadi sedang dikerjakan pin: 9703",
        "!jobdex update status Nama Task menjadi stuck catatan: kurang materi pin: 9703",
        "",
        "4. Edit task:",
        "!jobdex edit task Nama Task",
        "deadline: 5 Juni 2026",
        "prioritas: kritis",
        "pic: Nama PIC",
        "pin: 9703",
        "",
        "5. Checklist:",
        "!jobdex checklist Nama Task redaksi selesai pin: 9703",
        "!jobdex checklist Nama Task upload selesai pin: 9703"
      ].join("\n");

      await updateDebugIntent("task_command", "bantuan_task");

      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: "sent",
        response: sendResult.responseText,
      });
      return NextResponse.json({ ok: true });
    }

    // Fase 15C: Read-only Deadline & Risk Queries (No PIN needed)
    if (intent === "deadline_query") {
      const queryType = String(parsedCommand.fields.query_type || "dekat");
      const replyMessage = await handleDeadlineQuery(queryType);
      
      await updateDebugIntent("task_command", "deadline_query");

      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: "sent",
        response: sendResult.responseText,
      });
      return NextResponse.json({ ok: true });
    }

    // Fase 12C: Detect konfirmasi / batal command (tambah jobdesk / acara)
    if (intent === "confirm_command" || intent === "cancel_command") {
      const code = String(parsedCommand.fields.code || "").toUpperCase();
      const pin = String(parsedCommand.fields.pin || "");

      if (!pin) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Saya membaca perintah konfirmasi / batal:",
          `Kode: ${code}`,
          "",
          "Namun PIN belum disertakan.",
          "",
          "Gunakan:",
          `!jobdex ${intent === "confirm_command" ? "konfirmasi" : "batal"} ${code} pin: 9703`
        ].join("\n");

        await updateDebugIntent("task_help", intent);

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      const validatedUser = await validateCommandPin(pin);
      if (!validatedUser) {
        const errMessage = `[JobDex.in AI]\n\n❌ PIN yang Anda masukkan salah atau akun Anda tidak aktif.`;
        const sendResult = await sendWhatsAppMessage(errMessage);
        await createWhatsAppLog({ message: errMessage, status: "failed", response: sendResult.responseText });
        return NextResponse.json({ ok: true });
      }

      let result;
      if (intent === "confirm_command") {
        result = await confirmPreviewCommand(code, pin);
      } else {
        result = await cancelPreviewCommand(code, pin);
      }

      await updateDebugIntent("task_command", intent);

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

    // Fase 15C: Detect konfirmasi / batal edit / archive task
    if (intent === "confirm_edit" || intent === "cancel_edit" || intent === "confirm_archive") {
      const code = String(parsedCommand.fields.code || "").toUpperCase();
      const pin = String(parsedCommand.fields.pin || "");

      if (!pin) {
        const actionStr = intent === "confirm_edit" ? "konfirmasi edit" : intent === "cancel_edit" ? "batal edit" : "konfirmasi archive";
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Saya membaca perintah konfirmasi / batal:",
          `Kode: ${code}`,
          "",
          "Namun PIN belum disertakan.",
          "",
          "Gunakan:",
          `!jobdex ${actionStr} ${code} pin: 9703`
        ].join("\n");

        await updateDebugIntent("task_help", intent);

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      const validatedUser = await validateCommandPin(pin);
      if (!validatedUser) {
        const errMessage = "[JobDex.in Command]\n\n❌ PIN yang Anda masukkan salah atau akun Anda tidak aktif.";
        const sendResult = await sendWhatsAppMessage(errMessage);
        await createWhatsAppLog({ message: errMessage, status: "failed", response: sendResult.responseText });
        return NextResponse.json({ ok: true });
      }

      let result;
      if (intent === "confirm_edit") {
        result = await handleConfirmEditTaskCommand(code, pin, validatedUser);
      } else if (intent === "cancel_edit") {
        result = await handleCancelEditTaskCommand(code, pin, validatedUser);
      } else {
        result = await handleConfirmArchiveCommand(code, pin, validatedUser);
      }

      await updateDebugIntent("task_command", intent);

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);

      await createWhatsAppLog({
        message: sanitizePinFromMessage(replyMessage),
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // Fase 15C: Approve Task
    if (intent === "approve_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const pin = String(parsedCommand.fields.pin || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!pin) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Saya membaca perintah approve task:",
          `Tugas: ${taskName || "Desain feed forkom achievement"}`,
          "",
          "Namun PIN belum disertakan.",
          "",
          "Gunakan:",
          `!jobdex approve task ${taskName || "Desain feed forkom achievement"} pin: 9703`
        ].join("\n");

        await updateDebugIntent("task_help", "approve_task");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      const validatedUser = await validateCommandPin(pin);
      if (!validatedUser) {
        const errMessage = "[JobDex.in Approval]\n\n❌ PIN yang Anda masukkan salah atau akun Anda tidak aktif.";
        const sendResult = await sendWhatsAppMessage(errMessage);
        await createWhatsAppLog({ message: errMessage, status: "failed", response: sendResult.responseText });
        return NextResponse.json({ ok: true });
      }

      const result = await handleApproveTaskCommand(taskName, pin, validatedUser, isCode);
      
      await updateDebugIntent("task_command", "approve_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);

      await createWhatsAppLog({
        message: sanitizePinFromMessage(replyMessage),
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // Fase 15C: Update Status
    if (intent === "update_status") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const pin = String(parsedCommand.fields.pin || "");
      const statusVal = String(parsedCommand.fields.status || "");
      const notes = String(parsedCommand.fields.notes || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!statusVal || !taskName) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Format update status belum lengkap.",
          "",
          "Gunakan:",
          "!jobdex update status Nama Task menjadi sedang dikerjakan pin: 9703",
          "",
          "Contoh:",
          "!jobdex update status Desain feed forkom achievement menjadi sedang dikerjakan pin: 9703"
        ].join("\n");

        await updateDebugIntent("task_help", "update_status");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      if (!pin) {
        const readableStatus = formatStatusVal(statusVal) || statusVal || "Sedang Dikerjakan";
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Saya membaca perintah update status:",
          "",
          `Tugas: ${taskName}`,
          `Status baru: ${readableStatus}`,
          "",
          "Namun PIN belum disertakan.",
          "",
          "Gunakan:",
          `!jobdex update status ${taskName} menjadi ${statusVal} pin: 9703`
        ].join("\n");

        await updateDebugIntent("task_help", "update_status");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      const validatedUser = await validateCommandPin(pin);
      if (!validatedUser) {
        const errMessage = "[JobDex.in Status]\n\n❌ PIN yang Anda masukkan salah atau akun Anda tidak aktif.";
        const sendResult = await sendWhatsAppMessage(errMessage);
        await createWhatsAppLog({ message: errMessage, status: "failed", response: sendResult.responseText });
        return NextResponse.json({ ok: true });
      }

      const result = await handleUpdateTaskStatusCommand(taskName, pin, validatedUser, isCode, statusVal, notes);
      
      await updateDebugIntent("task_command", "update_status");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);

      await createWhatsAppLog({
        message: sanitizePinFromMessage(replyMessage),
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // Fase 15C: Edit Task
    if (intent === "edit_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const pin = String(parsedCommand.fields.pin || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!taskName) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Format edit task belum lengkap.",
          "",
          "Gunakan:",
          "!jobdex edit task Nama Task",
          "deadline: 5 Juni 2026",
          "pin: 9703"
        ].join("\n");

        await updateDebugIntent("task_help", "edit_task");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      if (!pin) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Saya membaca perintah edit task:",
          `Tugas: ${taskName}`,
          "",
          "Namun PIN belum disertakan.",
          "",
          "Gunakan:",
          `!jobdex edit task ${taskName}`,
          "deadline: 5 Juni 2026",
          "pin: 9703"
        ].join("\n");

        await updateDebugIntent("task_help", "edit_task");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      const validatedUser = await validateCommandPin(pin);
      if (!validatedUser) {
        const errMessage = "[JobDex.in Edit Task]\n\n❌ PIN yang Anda masukkan salah atau akun Anda tidak aktif.";
        const sendResult = await sendWhatsAppMessage(errMessage);
        await createWhatsAppLog({ message: errMessage, status: "failed", response: sendResult.responseText });
        return NextResponse.json({ ok: true });
      }

      const changesPayload: Record<string, string> = { ...parsedCommand.fields, rawText: incoming.message };
      delete changesPayload.task_name;
      delete changesPayload.pin;
      delete changesPayload.is_code;

      const result = await handleEditTaskCommand(taskName, pin, validatedUser, isCode, changesPayload);
      
      await updateDebugIntent("task_command", "edit_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);

      await createWhatsAppLog({
        message: sanitizePinFromMessage(replyMessage),
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // Fase 15C: Archive Task
    if (intent === "archive_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const pin = String(parsedCommand.fields.pin || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!taskName) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Format archive task belum lengkap.",
          "",
          "Gunakan:",
          "!jobdex archive task Nama Task pin: 9703"
        ].join("\n");

        await updateDebugIntent("task_help", "archive_task");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      if (!pin) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Saya membaca perintah archive task:",
          `Tugas: ${taskName}`,
          "",
          "Namun PIN belum disertakan.",
          "",
          "Gunakan:",
          `!jobdex archive task ${taskName} pin: 9703`
        ].join("\n");

        await updateDebugIntent("task_help", "archive_task");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      const validatedUser = await validateCommandPin(pin);
      if (!validatedUser) {
        const errMessage = "[JobDex.in Archive]\n\n❌ PIN yang Anda masukkan salah atau akun Anda tidak aktif.";
        const sendResult = await sendWhatsAppMessage(errMessage);
        await createWhatsAppLog({ message: errMessage, status: "failed", response: sendResult.responseText });
        return NextResponse.json({ ok: true });
      }

      const result = await handleArchiveTaskCommand(taskName, pin, validatedUser, isCode);
      
      await updateDebugIntent("task_command", "archive_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);

      await createWhatsAppLog({
        message: sanitizePinFromMessage(replyMessage),
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // Fase 15C: Checklist Task
    if (intent === "checklist_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const pin = String(parsedCommand.fields.pin || "");
      const item = String(parsedCommand.fields.item || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!taskName || !item) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Format checklist task belum lengkap.",
          "",
          "Gunakan:",
          "!jobdex checklist Nama Task redaksi selesai pin: 9703"
        ].join("\n");

        await updateDebugIntent("task_help", "checklist_task");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      if (!pin) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Saya membaca perintah checklist task:",
          `Tugas: ${taskName}`,
          "",
          "Namun PIN belum disertakan.",
          "",
          "Gunakan:",
          `!jobdex checklist ${taskName} ${item} selesai pin: 9703`
        ].join("\n");

        await updateDebugIntent("task_help", "checklist_task");

        const sendResult = await sendWhatsAppMessage(replyMessage);
        await createWhatsAppLog({
          message: replyMessage,
          status: "failed",
          response: sendResult.responseText,
        });
        return NextResponse.json({ ok: true });
      }

      const validatedUser = await validateCommandPin(pin);
      if (!validatedUser) {
        const errMessage = "[JobDex.in Checklist]\n\n❌ PIN yang Anda masukkan salah atau akun Anda tidak aktif.";
        const sendResult = await sendWhatsAppMessage(errMessage);
        await createWhatsAppLog({ message: errMessage, status: "failed", response: sendResult.responseText });
        return NextResponse.json({ ok: true });
      }

      const result = await handleChecklistCommand(taskName, pin, validatedUser, isCode, item);
      
      await updateDebugIntent("task_command", "checklist_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);

      await createWhatsAppLog({
        message: sanitizePinFromMessage(replyMessage),
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // Intercept if it looks like a task command but fell through (parser failed or incomplete)
    if (isTaskLike) {
      const replyMessage = [
        "[JobDex.in Task]",
        "",
        "Format perintah task tidak dikenali atau belum lengkap.",
        "",
        "Gunakan bantuan untuk melihat format yang benar:",
        "!jobdex bantuan task"
      ].join("\n");

      await updateDebugIntent("task_help", intent || "unknown");

      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: "failed",
        response: sendResult.responseText,
      });
      return NextResponse.json({ ok: true });
    }

    const isStructured =
      intent === "create_task_preview" ||
      intent === "create_event_preview" ||
      intent === "bulk_create_task_preview" ||
      intent === "approve_task_preview";

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

      await updateDebugIntent("task_command", parsedCommand.intent);
    }

    // --- Fase 14A: Reference Search Intent Detection ---
    if (isReferenceSearchQuestion(question)) {
      const searchResult = await searchDesignReferencesFromQuestion(question);

      const aiLogRef = getAdminDb().collection("ai_logs").doc();
      await aiLogRef.set({
        id: aiLogRef.id,
        organization_id: "main_org",
        asked_by: "whatsapp_bot",
        question: sanitizePinFromMessage(question),
        context_summary: "Reference search query - Firestore collection matched directly.",
        answer: searchResult,
        model_used: "firestore-reference-search",
        source: "whatsapp",
        whatsapp_sender: senderLabel,
        whatsapp_group_id: process.env.WABLAS_GROUP_ID ?? "",
        created_at: FieldValue.serverTimestamp(),
      });

      const replyMessage = searchResult;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: "sent",
        response: sendResult.responseText,
      });

      await updateDebugIntent("reference_search", null);
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

    await updateDebugIntent("gemini_fallback", null);
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
