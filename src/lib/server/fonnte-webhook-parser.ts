import "server-only";
import type { NormalizedIncomingWhatsAppMessage } from "@/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function stringValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

/**
 * Normalizes the incoming webhook payload from Fonnte.
 * Fonnte webhook parameters for messages:
 * - sender: contains the Group ID (e.g. 120xxx@g.us) if sent in a group, or the sender's phone number if personal chat.
 * - member: contains the sender's phone number if sent in a group, empty/absent otherwise.
 * - name: contains the sender's display name.
 * - message: contains the message content.
 */
export function normalizeFonnteWebhookPayload(payload: unknown): NormalizedIncomingWhatsAppMessage | null {
  if (!payload || typeof payload !== "object") return null;

  const root = asRecord(payload);
  
  const message = stringValue(root.message);
  const senderField = stringValue(root.sender);
  const memberField = stringValue(root.member);
  const nameField = stringValue(root.name);

  // If sender is empty, it's not a valid message event (could be a status update)
  if (!senderField) {
    return null;
  }

  // Determine if it is a group message
  // Fonnte sends Group ID in the 'sender' field for group chats, ending with @g.us
  const isGroup = senderField.endsWith("@g.us") || senderField.includes("-") || !!memberField;

  let sender = "";
  let groupId: string | undefined = undefined;

  if (isGroup) {
    groupId = senderField;
    // In a group, Fonnte puts the sender's individual phone number in 'member'
    sender = memberField || senderField;
  } else {
    sender = senderField;
  }

  // Ensure sender is clean of any suffix just in case
  sender = sender.replace(/@s\.whatsapp\.net$/i, "").replace(/@c\.us$/i, "");

  return {
    provider: "fonnte",
    message,
    sender,
    senderName: nameField || undefined,
    groupId,
    isGroup,
  } satisfies NormalizedIncomingWhatsAppMessage;
}
