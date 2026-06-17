import "server-only";
import { getAdminDb, FieldValue } from "./firebase-admin";

export class WhatsAppRateLimitError extends Error {
  status: "skipped_min_interval" | "skipped_hourly_limit" | "skipped_cooldown" | "rate_limited" | "failed";
  cooldownUntil: Date | null;

  constructor(
    status: "skipped_min_interval" | "skipped_hourly_limit" | "skipped_cooldown" | "rate_limited" | "failed",
    message: string,
    cooldownUntil: Date | null = null
  ) {
    super(message);
    this.name = "WhatsAppRateLimitError";
    this.status = status;
    this.cooldownUntil = cooldownUntil;
  }
}

type SendWhatsAppResult = {
  responseText: string;
};

type SendWhatsAppOptions = {
  mentions?: string[];
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

export async function sendWhatsAppMessage(
  message: string,
  customPhone?: string,
  customGroupId?: string,
  options: SendWhatsAppOptions = {},
) {
  const apiUrl = process.env.WABLAS_API_URL;
  const token = process.env.WABLAS_API_TOKEN;
  const secret = process.env.WABLAS_SECRET_KEY;
  const deviceId = process.env.WABLAS_DEVICE_ID;
  
  let recipient = "";
  let sendToGroup = false;

  if (customPhone) {
    recipient = customPhone;
    sendToGroup = false;
  } else if (customGroupId) {
    recipient = customGroupId;
    sendToGroup = true;
  } else {
    recipient = process.env.WABLAS_DEFAULT_GROUP_ID || process.env.WABLAS_GROUP_ID || "";
    sendToGroup = isWhatsAppGroupRecipient();
  }
  
  // Safeguard: Redirect group messages to test group in development or testing environment
  if (process.env.NODE_ENV === "development" || process.env.TESTING === "true") {
    if (sendToGroup) {
      recipient = "120363406824082148";
    }
  }

  if (!recipient) {
    throw new Error("Penerima WhatsApp belum diatur (groupId, customPhone, dan customGroupId kosong).");
  }

  if (!apiUrl || !token || !secret) {
    throw new Error("Konfigurasi Wablas belum lengkap.");
  }

  // --- Rate Limit Guard ---
  const minInterval = parseInt(process.env.WABLAS_MIN_SEND_INTERVAL_SECONDS || "60", 10);
  const cooldownMin = parseInt(process.env.WABLAS_RATE_LIMIT_COOLDOWN_MINUTES || "60", 10);
  const maxSendsHour = parseInt(process.env.WABLAS_MAX_SENDS_PER_HOUR || "25", 10);

  const db = getAdminDb();
  const stateRef = db.collection("whatsapp_rate_limit_state").doc("wablas_default");
  const stateDoc = await stateRef.get();

  const now = new Date();
  let lastSentAt: Date | null = null;
  let cooldownUntil: Date | null = null;
  let sentCountHour = 0;
  let sentCountHourWindowStart: Date | null = null;

  if (stateDoc.exists) {
    const data = stateDoc.data() || {};
    if (data.last_sent_at) lastSentAt = data.last_sent_at.toDate();
    if (data.cooldown_until) cooldownUntil = data.cooldown_until.toDate();
    sentCountHour = data.sent_count_hour || 0;
    if (data.sent_count_hour_window_start) sentCountHourWindowStart = data.sent_count_hour_window_start.toDate();
  }

  // 1. Cooldown Check
  if (cooldownUntil && cooldownUntil.getTime() > now.getTime()) {
    throw new WhatsAppRateLimitError("skipped_cooldown", "Skipped: Rate limit cooldown active.", cooldownUntil);
  }

  // 2. Minimum Interval Check
  if (lastSentAt && now.getTime() - lastSentAt.getTime() < minInterval * 1000) {
    throw new WhatsAppRateLimitError("skipped_min_interval", "Skipped: Minimum send interval not met.");
  }

  // 3. Hourly Limit Check
  let nextSentCountHour = sentCountHour + 1;
  let nextSentCountHourWindowStart = sentCountHourWindowStart || now;

  if (!sentCountHourWindowStart || now.getTime() - sentCountHourWindowStart.getTime() > 60 * 60 * 1000) {
    nextSentCountHourWindowStart = now;
    nextSentCountHour = 1;
  } else if (sentCountHour >= maxSendsHour) {
    throw new WhatsAppRateLimitError("skipped_hourly_limit", "Skipped: Hourly limit exceeded.");
  }

  const endpoint = apiUrl.includes("/send-message")
    ? apiUrl
    : `${normalizeBaseUrl(apiUrl)}/send-message`;
  const mentions = Array.from(new Set(options.mentions ?? [])).filter(Boolean);
  const mentionMetadataEnabled =
    process.env.WABLAS_SEND_MENTION_METADATA?.toLowerCase() === "true";

  let responseStatus = 200;
  let responseText = "";
  let responseOk = false;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `${token}.${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: recipient,
        message,
        isGroup: sendToGroup ? "true" : "false",
        ...(sendToGroup && mentionMetadataEnabled && mentions.length
          ? { mentions }
          : {}),
        ...(deviceId ? { device_id: deviceId } : {}),
      }),
    });
    responseStatus = response.status;
    responseOk = response.ok;
    responseText = await response.text();
  } catch (fetchErr: unknown) {
    // Network errors
    const errorMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    throw new Error(`Wablas network fetch error: ${errorMsg}`);
  }

  // Check for Wablas Error 463 or rate limit keywords
  const lowerText = responseText.toLowerCase();
  const isRateLimit =
    responseStatus === 463 ||
    lowerText.includes("rate") ||
    lowerText.includes("overlimit") ||
    lowerText.includes("too fast") ||
    lowerText.includes("dropped") ||
    lowerText.includes("sending too fast") ||
    lowerText.includes("too many messages");

  if (isRateLimit) {
    const cooldownUntilTime = new Date(now.getTime() + cooldownMin * 60 * 1000);
    await stateRef.set({
      cooldown_until: cooldownUntilTime,
      last_error_code: responseStatus,
      last_error_message: responseText.slice(0, 1000),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    throw new WhatsAppRateLimitError("rate_limited", `Rate limited by Wablas: ${responseText}`, cooldownUntilTime);
  }

  if (!responseOk) {
    const safeBody = responseText ? `: ${responseText.slice(0, 500)}` : "";
    throw new Error(`Wablas gagal mengirim notifikasi (${responseStatus})${safeBody}`);
  }

  // Update success state
  await stateRef.set({
    last_sent_at: now,
    cooldown_until: null,
    sent_count_hour: nextSentCountHour,
    sent_count_hour_window_start: nextSentCountHourWindowStart,
    updated_at: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    responseText: responseText.slice(0, 1000),
  } satisfies SendWhatsAppResult;
}

export function getWhatsAppRecipient() {
  return process.env.WABLAS_DEFAULT_GROUP_ID || process.env.WABLAS_GROUP_ID || "";
}

export function getWhatsAppRecipientType() {
  return isWhatsAppGroupRecipient() ? "group" : "personal";
}

export function isWhatsAppGroupRecipient() {
  return process.env.WABLAS_SEND_TO_GROUP?.toLowerCase() !== "false";
}
