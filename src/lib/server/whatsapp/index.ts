import "server-only";
import { sendViaWablas } from "./wablas-provider";
import { sendViaFonnte } from "./fonnte-provider";
import { getWhatsAppSystemSettings } from "../whatsapp-settings";
import type { WhatsAppSendPayload, WhatsAppSendResult, WhatsAppProviderName, WhatsAppSendTarget } from "./provider";

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

export type { WhatsAppProviderName, WhatsAppSendTarget, WhatsAppSendPayload, WhatsAppSendResult };

export function isGroupRecipient(target: string): boolean {
  if (!target) return false;
  return target.endsWith("@g.us") || target.includes("-") || target.startsWith("120363");
}

export function normalizeWhatsAppGroupId(groupId: string, provider: "fonnte" | "wablas"): string {
  const trimmed = groupId.trim();

  if (!trimmed) return "";

  if (provider === "fonnte") {
    if (trimmed.endsWith("@g.us")) return trimmed;
    return `${trimmed}@g.us`;
  }

  if (provider === "wablas") {
    return trimmed.replace(/@g\.us$/i, "");
  }

  return trimmed;
}

export function getAllowedGroupIds(): string[] {
  const provider = (process.env.WHATSAPP_PROVIDER || "wablas") as "fonnte" | "wablas";
  const allowedStr =
    process.env.WHATSAPP_ALLOWED_GROUP_IDS ||
    process.env.FONNTE_ALLOWED_GROUP_IDS ||
    process.env.WABLAS_ALLOWED_GROUP_IDS ||
    "";
    
  const allowed = allowedStr
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => normalizeWhatsAppGroupId(id, provider));

  const defaultId = getWhatsAppRecipient();
  if (defaultId && !allowed.includes(defaultId)) {
    allowed.push(defaultId);
  }
  return allowed;
}

export async function sendWhatsAppMessage(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> {
  const provider = (process.env.WHATSAPP_PROVIDER || "wablas") as WhatsAppProviderName;

  if (process.env.WHATSAPP_ENABLED === "false") {
    throw new Error("WhatsApp sending is disabled by WHATSAPP_ENABLED=false");
  }

  // --- Global WhatsApp Sandbox / Test Mode Guard ---
  let effectivePayload = payload;
  try {
    const settings = await getWhatsAppSystemSettings();
    if (settings.isTestMode) {
      const originalTarget = payload.target || "Grup/Nomor Default";
      const sandboxTarget = settings.testGroupId || "120363406824082148@g.us";

      const sandboxBanner = [
        "🧪 *[TEST / SANDBOX MODE]*",
        `_(Aslinya ditujukan ke: ${originalTarget})_`,
        "",
        payload.message,
      ].join("\n");

      console.info(`[WHATSAPP SANDBOX] Intercepting dispatch: redirecting ${originalTarget} -> ${sandboxTarget}`);

      effectivePayload = {
        ...payload,
        target: sandboxTarget,
        message: sandboxBanner,
        type: "group",
      };
    }
  } catch (settingsErr) {
    console.warn("[WHATSAPP SANDBOX] Failed to check sandbox settings, proceeding with original payload:", settingsErr);
  }

  if (provider === "fonnte") {
    return sendViaFonnte(effectivePayload);
  }

  if (provider === "wablas") {
    if (process.env.WABLAS_ENABLED === "false") {
      throw new Error("Wablas is disabled by WABLAS_ENABLED=false");
    }
    return sendViaWablas(effectivePayload);
  }

  throw new Error(`Unsupported WhatsApp provider: ${provider}`);
}

export function getWhatsAppRecipient(): string {
  const provider = (process.env.WHATSAPP_PROVIDER || "wablas") as "fonnte" | "wablas";
  let rawRecipient = "";

  if (provider === "fonnte") {
    rawRecipient = 
      process.env.FONNTE_DEFAULT_GROUP_ID || 
      process.env.WHATSAPP_DEFAULT_GROUP_ID || 
      process.env.FONNTE_DEFAULT_TARGET || 
      "";
  } else {
    rawRecipient = 
      process.env.WABLAS_DEFAULT_GROUP_ID || 
      process.env.WABLAS_GROUP_ID || 
      process.env.WHATSAPP_DEFAULT_GROUP_ID || 
      "";
  }

  const isGroup = isGroupRecipient(rawRecipient);

  if (isGroup) {
    return normalizeWhatsAppGroupId(rawRecipient, provider);
  }

  return rawRecipient;
}

export function getWhatsAppRecipientType(): string {
  return isWhatsAppGroupRecipient() ? "group" : "personal";
}

export function isWhatsAppGroupRecipient(): boolean {
  const provider = process.env.WHATSAPP_PROVIDER || "wablas";
  if (provider === "fonnte") {
    const rawRecipient = process.env.FONNTE_DEFAULT_GROUP_ID || process.env.WHATSAPP_DEFAULT_GROUP_ID || "";
    return isGroupRecipient(rawRecipient);
  }
  return process.env.WABLAS_SEND_TO_GROUP?.toLowerCase() !== "false";
}
