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
  sendWhatsAppMessage as baseSendWhatsAppMessage,
  WhatsAppRateLimitError,
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
  handleTugasSayaCommand,
  handleDetailTaskCommand,
  handleUploadHasilCommand,
  handleMintaRevisiCommand,
  handleCekChecklistCommand,
  handleTambahCatatanCommand,
  handleGantiPicCommand,
} from "@/lib/server/whatsapp-task-command-executor";
import type { UserProfile } from "@/types";
import { USER_ROLE_LABELS } from "@/lib/roles";
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

function getAllowedGroupIds(): string[] {
  const allowedStr = process.env.WABLAS_ALLOWED_GROUP_IDS || "";
  const allowed = allowedStr
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const defaultId = process.env.WABLAS_DEFAULT_GROUP_ID || process.env.WABLAS_GROUP_ID || "";
  if (defaultId && !allowed.includes(defaultId)) {
    allowed.push(defaultId);
  }
  return allowed;
}

function isAllowedGroup(groupId: string): boolean {
  if (!groupId) return false;
  const allowed = getAllowedGroupIds();
  return allowed.includes(groupId);
}

function getDefaultGroupId(): string {
  return process.env.WABLAS_DEFAULT_GROUP_ID || process.env.WABLAS_GROUP_ID || "";
}

function isTargetGroup(groupId: string, sender: string) {
  return isAllowedGroup(groupId) || isAllowedGroup(sender);
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

async function baseCreateWhatsAppLog({
  message,
  status,
  response,
  errorMessage,
  recipient,
  isGroup,
  errorCode,
  cooldownUntil,
  rateLimitReason,
}: {
  message: string;
  status: string;
  response?: string;
  errorMessage?: string;
  recipient?: string;
  isGroup?: boolean;
  errorCode?: string | number;
  cooldownUntil?: Date | null;
  rateLimitReason?: string;
}) {
  const logRef = getAdminDb().collection("whatsapp_logs").doc();

  await logRef.set({
    id: logRef.id,
    organization_id: "main_org",
    event_type: "whatsapp_ai_bot_reply",
    message_content: message,
    recipient: recipient ?? getWhatsAppRecipient(),
    recipient_type: isGroup !== undefined ? (isGroup ? "group" : "personal") : getWhatsAppRecipientType(),
    is_group: isGroup !== undefined ? isGroup : isWhatsAppGroupRecipient(),
    status,
    send_status: status,
    error_code: errorCode || null,
    error_message: errorMessage || null,
    cooldown_until: cooldownUntil || null,
    message_length: message.length,
    rate_limit_reason: rateLimitReason || null,
    ...(response ? { wablas_response: response } : {}),
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

function _formatStatusVal(status: string): string {
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
  
  const approvedKeywords = [
    "approve",
    "approved",
    "acc",
    "approve task",
    "setujui",
    "disetujui",
    "sudah approve",
    "sudah approved",
    "selesai approve",
    "final approve",
  ];
  if (
    approvedKeywords.some(kw => clean === kw || clean.includes(kw)) ||
    clean.includes("selesai") ||
    clean === "approved"
  ) {
    return "Approved";
  }

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

function getNestedProperty(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
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

  const allSenders: string[] = [];
  for (let i = 0; i < participants.length; i++) {
    const p = getRecord(participants[i]);
    if (p) {
      const rawSender = getString(p.sender);
      const s = normalizePhone(rawSender);
      const isLid = rawSender.toLowerCase().includes("@lid");
      
      candidates[`group.participants[${i}].sender`] = s;
      
      if (s && !isLid) {
        allSenders.push(s);
      }
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

export async function POST(request: NextRequest) {
  const configuredSecret = getWebhookSecret();
  const requestSecret = request.nextUrl.searchParams.get("secret") ?? "";

  if (!configuredSecret || requestSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  const payload = await parseRequestBody(request);
  const incoming = parseWablasIncomingPayload(payload);

  const message = incoming.message || "";
  if (!message.trim().toLowerCase().startsWith("!jobdex")) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: "non_jobdex_message",
    });
  }

  const question = extractJobDexQuestion(incoming.message);

  const sendWhatsAppMessage = async (message: string, customPhone?: string) => {
    return baseSendWhatsAppMessage(message, customPhone, incoming.groupId);
  };

  const createWhatsAppLog = async (args: {
    message: string;
    status: "sent" | "failed";
    response?: string;
    errorMessage?: string;
  }) => {
    return baseCreateWhatsAppLog({
      ...args,
      recipient: incoming.groupId || getDefaultGroupId(),
      isGroup: true,
    });
  };

  interface EvaluatedCandidate {
    source: string;
    raw: string;
    normalized: string;
    accepted: boolean;
    reason: string;
  }

  const rootObj = getRecord(payload) || {};
  const dataPayloadObj = getRecord(rootObj.data) || {};

  const group = getRecord(rootObj.group) ?? getRecord(dataPayloadObj.group);
  const participants = getArray(group?.participants);

  const devicePhoneEnv = process.env.WABLAS_DEVICE_PHONE || "6287798799068";
  const deviceSender = normalizePhone(devicePhoneEnv);

  const allowedGroupIds = getAllowedGroupIds();
  const defaultGroupId = getDefaultGroupId();

  const groupOwnerRaw = getString(
    getNestedProperty(payload, "group.owner") || 
    getNestedProperty(payload, "data.group.owner") ||
    getNestedProperty(payload, "raw_body_sanitized.group.owner")
  );
  const groupOwner = groupOwnerRaw ? normalizePhone(groupOwnerRaw) : "";

  const candidatesList: { source: string; raw: string; normalized: string }[] = [];

  // 1. Group sender fields (Tugas 2)
  const priorityPaths = [
    "group.sender",
    "data.group.sender",
    "raw_body_sanitized.group.sender",
    "body.group.sender",
    "body.data.group.sender"
  ];
  for (const path of priorityPaths) {
    const rawVal = getString(getNestedProperty(payload, path));
    if (rawVal) {
      candidatesList.push({
        source: path,
        raw: rawVal,
        normalized: normalizePhone(rawVal)
      });
    }
  }

  // 2. Group participants
  for (let i = 0; i < participants.length; i++) {
    const participant = getRecord(participants[i]);
    if (participant) {
      const rawSender = getString(participant.sender);
      if (rawSender) {
        candidatesList.push({
          source: `group.participants[${i}].sender`,
          raw: rawSender,
          normalized: normalizePhone(rawSender)
        });
      }
    }
  }

  // 3. Fallbacks
  const fallbackPaths = [
    "participant",
    "author",
    "key.participant",
    "data.participant",
    "data.author",
    "data.key.participant",
    "sender",
    "from",
    "phone",
    "sender_number",
    "phone_number",
    "key.remoteJid",
    "data.sender",
    "data.from",
    "data.phone",
    "data.key.remoteJid"
  ];
  for (const path of fallbackPaths) {
    const rawVal = getString(getNestedProperty(payload, path));
    if (rawVal) {
      candidatesList.push({
        source: path,
        raw: rawVal,
        normalized: normalizePhone(rawVal)
      });
    }
  }

  // 4. incoming.sender and incoming.groupId as fallback candidates
  if (incoming.sender) {
    candidatesList.push({
      source: "incoming.sender",
      raw: incoming.sender,
      normalized: normalizePhone(incoming.sender)
    });
  }
  if (incoming.groupId) {
    candidatesList.push({
      source: "incoming.groupId",
      raw: incoming.groupId,
      normalized: normalizePhone(incoming.groupId)
    });
  }

  const evaluatedCandidates: EvaluatedCandidate[] = [];
  const seenCandidates = new Set<string>();

  for (const cand of candidatesList) {
    const key = `${cand.source}:${cand.normalized}`;
    if (seenCandidates.has(key)) continue;
    seenCandidates.add(key);

    let accepted = true;
    let reason = "valid_candidate";

    if (!cand.normalized) {
      accepted = false;
      reason = "empty";
    } else if (cand.normalized === deviceSender) {
      accepted = false;
      reason = "wablas_device_phone";
    } else if (groupOwner && cand.normalized === groupOwner && incoming.isGroup) {
      accepted = false;
      reason = "group_owner";
    } else if (cand.normalized === defaultGroupId || allowedGroupIds.includes(cand.normalized)) {
      accepted = false;
      reason = "group_id";
    } else if (cand.normalized.startsWith("120363")) {
      accepted = false;
      reason = "group_id";
    } else if (cand.raw.toLowerCase().includes("@lid")) {
      accepted = false;
      reason = "contains_lid";
    }

    evaluatedCandidates.push({
      source: cand.source,
      raw: cand.raw,
      normalized: cand.normalized,
      accepted,
      reason
    });
  }

  const selectedSenderObj = evaluatedCandidates.find((c) => c.accepted);
  let resolvedSenderNumber = "";
  let senderSource = "";

  if (selectedSenderObj) {
    resolvedSenderNumber = selectedSenderObj.normalized;
    senderSource = selectedSenderObj.source;
    if (priorityPaths.includes(selectedSenderObj.source)) {
      selectedSenderObj.reason = "group_sender_priority";
    } else if (selectedSenderObj.source.startsWith("group.participants")) {
      selectedSenderObj.reason = "group_participant";
    } else {
      selectedSenderObj.reason = "fallback_priority";
    }
  } else {
    const normalizedIncomingSender = normalizePhone(incoming.sender);
    if (normalizedIncomingSender === deviceSender) {
      resolvedSenderNumber = "";
      senderSource = "fallback_rejected_device";
    } else {
      resolvedSenderNumber = normalizedIncomingSender;
      senderSource = "fallback";
    }
  }

  if (resolvedSenderNumber === deviceSender) {
    resolvedSenderNumber = "";
  }
  if (resolvedSenderNumber === defaultGroupId || allowedGroupIds.includes(resolvedSenderNumber) || resolvedSenderNumber.startsWith("120363")) {
    resolvedSenderNumber = "";
  }

  // Firestore user lookup with multi-field normalized check (Tugas 5)
  let senderUserProfile: UserProfile | null = null;
  let isSenderMatched = false;

  if (resolvedSenderNumber) {
    const usersSnap = await getAdminDb().collection("users").get();
    for (const doc of usersSnap.docs) {
      const u = doc.data() as UserProfile;
      const fieldsToCheck = [
        (u as Record<string, unknown>).whatsapp,
        u.whatsapp_number,
        (u as Record<string, unknown>).phone,
        (u as Record<string, unknown>).phone_number
      ];
      for (const f of fieldsToCheck) {
        if (f) {
          const norm = normalizePhone(String(f));
          if (norm === resolvedSenderNumber) {
            senderUserProfile = { ...u, id: doc.id };
            isSenderMatched = true;
            break;
          }
        }
      }
      if (isSenderMatched) break;
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

    const isSelectedSenderDevice = resolvedSenderNumber === deviceSender;
    const isSelectedSenderGroupId = 
      resolvedSenderNumber === defaultGroupId || 
      allowedGroupIds.includes(resolvedSenderNumber) || 
      resolvedSenderNumber.startsWith("120363");

    await debugRef.set({
      created_at: FieldValue.serverTimestamp(),
      raw_body_sanitized: JSON.parse(JSON.stringify(sanitizedBody)),
      extracted_candidates: candidatesDump,
      raw_sender_candidates: evaluatedCandidates,
      selected_sender: resolvedSenderNumber,
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
      intent_debug: null,
      incoming_group_id: incoming.groupId || "",
      allowed_group_ids: allowedGroupIds,
      is_allowed_group: isAllowedGroup(incoming.groupId),
      reply_target_group_id: incoming.groupId || defaultGroupId,
      is_jobdex_command: true,
      is_group_message: incoming.isGroup,
      is_sender_matched: isSenderMatched,
      is_selected_sender_device_phone: isSelectedSenderDevice,
      is_selected_sender_group_id: isSelectedSenderGroupId,
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
      parsedTaskIntent: string | null,
      refQuery: string | null = null
    ) => {
      if (!debugRefId) return;
      try {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          intent_debug: {
            is_task_command_like: isTaskLike,
            parsed_task_intent: parsedTaskIntent,
            is_reference_search: isRefSearch,
            routed_to: routedTo,
            reference_query: refQuery,
          }
        });
      } catch (err) {
        console.error("Failed to update intent_debug in wablas_incoming_debug:", err);
      }
    };

    const parsedCommand = parseWhatsAppCommand(incoming.message);
    const intent = parsedCommand.intent;
    const isCekPengirim = intent === "cek_pengirim";

    // Tugas 8: Cek Pengirim Command
    if (isCekPengirim) {
      const replyMessage = [
        "[JobDex.in Debug Pengirim]",
        "",
        `Nomor terdeteksi: ${resolvedSenderNumber || "Tidak terdeteksi"}`,
        `Sumber: ${senderSource || "Tidak diketahui"}`,
        `User: ${senderUserProfile ? senderUserProfile.name : "Tidak terdaftar"}`,
        `Role: ${senderUserProfile ? (USER_ROLE_LABELS[senderUserProfile.role] || senderUserProfile.role) : "Tidak terdaftar"}`,
        `Group ID: ${incoming.groupId || "Personal Chat"}`
      ].join("\n");

      await updateDebugIntent("task_command", "cek_pengirim");

      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: "sent",
        response: sendResult.responseText,
      });
      return NextResponse.json({ ok: true });
    }

    const isBantuan = intent === "bantuan_task" || intent === "template_help";
    const requiresAuth = intent !== "unknown" && !isBantuan && !isCekPengirim;

    if (requiresAuth && !isSenderMatched) {
      const replyMessage = [
        "[JobDex.in Auth]",
        "",
        `Nomor WhatsApp kamu terdeteksi: ${resolvedSenderNumber || incoming.sender}`,
        "",
        "Namun nomor ini belum terhubung dengan akun JobDex.in.",
        "Silakan hubungi admin untuk menambahkan nomor WhatsApp ke profil akun."
      ].join("\n");

      await updateDebugIntent("task_help", intent || "unauthorized");

      if (debugRefId) {
        try {
          await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
            auth_mode: "sender_identity",
            pin_required: false,
            sender_user_id: "",
            sender_user_role: "",
            authorization_result: "unmatched_user",
            command_intent: intent,
            target_task_id: "",
            target_task_name: "",
          });
        } catch (err) {
          console.error("Failed to update debug unmatched:", err);
        }
      }

      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: "failed",
        response: sendResult.responseText,
      });
      return NextResponse.json({ ok: true });
    }

    const authMode = "sender_identity";
    const pinRequired = false;
    const senderUserId = senderUserProfile?.id || "";
    const senderUserRole = senderUserProfile?.role || "";
    let authorizationResult = "allowed";
    let targetTaskId = "";
    let targetTaskName = "";

    // 1. Bantuan Task Command
    if (intent === "bantuan_task") {
      const replyMessage = [
        "[JobDex.in Bantuan]",
        "",
        "Command utama:",
        "- !jobdex tugas saya",
        "- !jobdex detail task [nama task]",
        "- !jobdex update status [nama task] menjadi [status]",
        "- !jobdex upload hasil [nama task]",
        "  link: ...",
        "  catatan: ...",
        "- !jobdex minta revisi [nama task]",
        "  catatan: ...",
        "- !jobdex cek checklist [nama task]",
        "- !jobdex checklist [nama task] redaksi selesai",
        "- !jobdex tambah catatan [nama task]",
        "  catatan: ...",
        "- !jobdex ganti pic [nama task] ke [nama anggota]",
        "- !jobdex cari referensi desain [keyword]",
        "- !jobdex tambah referensi",
        "  nama: ...",
        "  jenis: ...",
        "  acara: ...",
        "  tahun: ...",
        "  link: ..."
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

    // 2. Read-only Deadline & Risk Queries
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

    // 3. Tugas Saya
    if (intent === "tugas_saya") {
      const variation = String(parsedCommand.fields.variation || "all");
      const result = await handleTugasSayaCommand(senderUserProfile!, variation);
      
      await updateDebugIntent("task_command", "tugas_saya");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });
      return NextResponse.json({ ok: true });
    }

    // 4. Detail Task
    if (intent === "detail_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";
      const result = await handleDetailTaskCommand(taskName, isCode, senderUserProfile!);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "detail_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 5. Upload Hasil
    if (intent === "upload_hasil") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";
      const link = String(parsedCommand.fields.link || "");
      const catatan = String(parsedCommand.fields.catatan || "");
      const result = await handleUploadHasilCommand(taskName, isCode, link, catatan, senderUserProfile!);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "upload_hasil");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 6. Minta Revisi
    if (intent === "minta_revisi") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";
      const catatan = String(parsedCommand.fields.catatan || "");
      const result = await handleMintaRevisiCommand(taskName, isCode, catatan, senderUserProfile!);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "minta_revisi");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 7. Cek Checklist
    if (intent === "cek_checklist") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";
      const result = await handleCekChecklistCommand(taskName, isCode, senderUserProfile!);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "cek_checklist");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 8. Tambah Catatan
    if (intent === "tambah_catatan") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";
      const catatan = String(parsedCommand.fields.catatan || "");
      const result = await handleTambahCatatanCommand(taskName, isCode, catatan, senderUserProfile!);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "tambah_catatan");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 9. Ganti PIC
    if (intent === "ganti_pic") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";
      const picName = String(parsedCommand.fields.pic_name || "");
      const result = await handleGantiPicCommand(taskName, isCode, picName, senderUserProfile!);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "ganti_pic");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 10. Confirm Command & Cancel Command
    if (intent === "confirm_command" || intent === "cancel_command") {
      const code = String(parsedCommand.fields.code || "").toUpperCase();

      let result;
      if (intent === "confirm_command") {
        result = await confirmPreviewCommand(code, senderUserProfile!);
      } else {
        result = await cancelPreviewCommand(code, senderUserProfile!);
      }

      await updateDebugIntent("task_command", intent);

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      return NextResponse.json({ ok: true });
    }

    // 11. Confirm Edit & Cancel Edit & Confirm Archive
    if (intent === "confirm_edit" || intent === "cancel_edit" || intent === "confirm_archive") {
      const code = String(parsedCommand.fields.code || "").toUpperCase();

      let result;
      if (intent === "confirm_edit") {
        result = await handleConfirmEditTaskCommand(code, senderUserProfile!);
      } else if (intent === "cancel_edit") {
        result = await handleCancelEditTaskCommand(code, senderUserProfile!);
      } else {
        result = await handleConfirmArchiveCommand(code, senderUserProfile!);
      }

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", intent);

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 12. Approve Task
    if (intent === "approve_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";

      const result = await handleApproveTaskCommand(taskName, senderUserProfile!, isCode);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "approve_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 13. Update Status
    if (intent === "update_status") {
      const taskName = String(parsedCommand.fields.task_name || "");
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
          "!jobdex update status [nama task] menjadi [status]"
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

      const result = await handleUpdateTaskStatusCommand(taskName, senderUserProfile!, isCode, statusVal, notes);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "update_status");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 14. Edit Task
    if (intent === "edit_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!taskName) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Format edit task belum lengkap.",
          "",
          "Gunakan:",
          "!jobdex edit task [nama task]",
          "deadline: 5 Juni 2026"
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

      const changesPayload: Record<string, string> = { ...parsedCommand.fields, rawText: incoming.message };
      delete changesPayload.task_name;
      delete changesPayload.pin;
      delete changesPayload.is_code;

      const result = await handleEditTaskCommand(taskName, senderUserProfile!, isCode, changesPayload);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "edit_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 15. Archive Task
    if (intent === "archive_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!taskName) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Format archive task belum lengkap.",
          "",
          "Gunakan:",
          "!jobdex archive task [nama task]"
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

      const result = await handleArchiveTaskCommand(taskName, senderUserProfile!, isCode);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "archive_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 16. Checklist Task
    if (intent === "checklist_task") {
      const taskName = String(parsedCommand.fields.task_name || "");
      const item = String(parsedCommand.fields.item || "");
      const isCode = parsedCommand.fields.is_code === "true";

      if (!taskName || !item) {
        const replyMessage = [
          "[JobDex.in Task]",
          "",
          "Format checklist task belum lengkap.",
          "",
          "Gunakan:",
          "!jobdex checklist [nama task] [item] selesai"
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

      const result = await handleChecklistCommand(taskName, senderUserProfile!, isCode, item);

      if (result.replyText.startsWith("[JobDex.in Akses Ditolak]")) {
        authorizationResult = "denied";
      }
      targetTaskId = result.taskId || "";
      targetTaskName = result.taskName || "";

      await updateDebugIntent("task_command", "checklist_task");

      const replyMessage = result.replyText;
      const sendResult = await sendWhatsAppMessage(replyMessage);
      await createWhatsAppLog({
        message: replyMessage,
        status: result.success ? "sent" : "failed",
        response: sendResult.responseText,
      });

      // Update deep debug metadata
      if (debugRefId) {
        await getAdminDb().collection("wablas_incoming_debug").doc(debugRefId).update({
          auth_mode: authMode,
          pin_required: pinRequired,
          sender_user_id: senderUserId,
          sender_user_role: senderUserRole,
          authorization_result: authorizationResult,
          command_intent: intent,
          target_task_id: targetTaskId,
          target_task_name: targetTaskName,
        });
      }

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
      intent === "approve_task_preview" ||
      intent === "create_reference_preview";

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
        const isReference = parsedCommand.intent === "create_reference_preview";
        const confirmCmd = isReference 
          ? `!jobdex konfirmasi referensi ${confirmationCode}` 
          : `!jobdex konfirmasi ${confirmationCode}`;

        const instruction = [
          `Preview ID: ${confirmationCode}`,
          `Untuk menyimpan ke database, balas:`,
          confirmCmd
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

      await updateDebugIntent("reference_search", null, question);
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
    if (error instanceof WhatsAppRateLimitError) {
      try {
        await baseCreateWhatsAppLog({
          message: incoming.message || "",
          status: error.status,
          errorMessage: error.message,
          recipient: incoming.groupId || getDefaultGroupId(),
          isGroup: true,
          cooldownUntil: error.cooldownUntil,
          rateLimitReason: error.message,
        });
      } catch (logErr) {
        console.error("Failed to write rate limit log:", logErr);
      }

      return NextResponse.json({
        ok: false,
        error: error.message,
        status: error.status,
      });
    }

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
      let status = "failed";
      let errorMsg = sendError instanceof Error ? sendError.message : "Gagal mengirim error reply ke WhatsApp.";
      let cooldownUntil: Date | null = null;
      
      if (sendError instanceof WhatsAppRateLimitError) {
        status = sendError.status;
        errorMsg = sendError.message;
        cooldownUntil = sendError.cooldownUntil;
      }

      await baseCreateWhatsAppLog({
        message: errorReply,
        status,
        errorMessage: errorMsg,
        recipient: incoming.groupId || getDefaultGroupId(),
        isGroup: true,
        cooldownUntil,
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
