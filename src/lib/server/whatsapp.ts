import "server-only";

type SendWhatsAppResult = {
  responseText: string;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

export async function sendWhatsAppMessage(message: string, customPhone?: string) {
  const apiUrl = process.env.WABLAS_API_URL;
  const token = process.env.WABLAS_API_TOKEN;
  const secret = process.env.WABLAS_SECRET_KEY;
  const groupId = process.env.WABLAS_GROUP_ID;
  const deviceId = process.env.WABLAS_DEVICE_ID;
  const sendToGroup = customPhone ? false : isWhatsAppGroupRecipient();
  const recipient = customPhone ? customPhone : groupId;

  if (!recipient) {
    throw new Error("Penerima WhatsApp belum diatur (groupId dan customPhone kosong).");
  }

  if (!apiUrl || !token || !secret) {
    throw new Error("Konfigurasi Wablas belum lengkap.");
  }

  const endpoint = apiUrl.includes("/send-message")
    ? apiUrl
    : `${normalizeBaseUrl(apiUrl)}/send-message`;

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
      ...(deviceId ? { device_id: deviceId } : {}),
    }),
  });
  const responseText = await response.text();

  if (!response.ok) {
    const safeBody = responseText ? `: ${responseText.slice(0, 500)}` : "";

    throw new Error(
      `Wablas gagal mengirim notifikasi (${response.status})${safeBody}`,
    );
  }

  return {
    responseText: responseText.slice(0, 1000),
  } satisfies SendWhatsAppResult;
}

export function getWhatsAppRecipient() {
  return process.env.WABLAS_GROUP_ID ?? "";
}

export function getWhatsAppRecipientType() {
  return isWhatsAppGroupRecipient() ? "group" : "personal";
}

export function isWhatsAppGroupRecipient() {
  return process.env.WABLAS_SEND_TO_GROUP?.toLowerCase() !== "false";
}
