import "server-only";
import { sendViaWablas } from "./wablas-provider";
import { sendViaFonnte } from "./fonnte-provider";
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

export async function sendWhatsAppMessage(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> {
  const provider = (process.env.WHATSAPP_PROVIDER || "wablas") as WhatsAppProviderName;

  if (process.env.WHATSAPP_ENABLED === "false") {
    throw new Error("WhatsApp sending is disabled by WHATSAPP_ENABLED=false");
  }

  if (provider === "fonnte") {
    return sendViaFonnte(payload);
  }

  if (provider === "wablas") {
    if (process.env.WABLAS_ENABLED === "false") {
      throw new Error("Wablas is disabled by WABLAS_ENABLED=false");
    }
    return sendViaWablas(payload);
  }

  throw new Error(`Unsupported WhatsApp provider: ${provider}`);
}

export function getWhatsAppRecipient() {
  const provider = process.env.WHATSAPP_PROVIDER || "wablas";
  if (provider === "fonnte") {
    return process.env.FONNTE_DEFAULT_GROUP_ID || process.env.FONNTE_DEFAULT_TARGET || "";
  }
  return process.env.WABLAS_DEFAULT_GROUP_ID || process.env.WABLAS_GROUP_ID || "";
}

export function getWhatsAppRecipientType() {
  return isWhatsAppGroupRecipient() ? "group" : "personal";
}

export function isWhatsAppGroupRecipient() {
  const provider = process.env.WHATSAPP_PROVIDER || "wablas";
  if (provider === "fonnte") {
    return Boolean(process.env.FONNTE_DEFAULT_GROUP_ID);
  }
  return process.env.WABLAS_SEND_TO_GROUP?.toLowerCase() !== "false";
}
