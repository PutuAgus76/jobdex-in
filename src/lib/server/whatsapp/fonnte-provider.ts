import "server-only";
import type { WhatsAppSendPayload, WhatsAppSendResult } from "./provider";

export async function sendViaFonnte(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> {
  const token = process.env.FONNTE_API_TOKEN;
  const apiUrl = process.env.FONNTE_API_URL || "https://api.fonnte.com/send";
  const defaultCountryCode = process.env.FONNTE_DEFAULT_COUNTRY_CODE || "62";

  if (!token) {
    throw new Error("Konfigurasi FONNTE_API_TOKEN tidak ditemukan.");
  }

  let recipient = payload.target;
  const sendToGroup = payload.type === "group";

  if (!recipient) {
    if (sendToGroup) {
      recipient = process.env.FONNTE_DEFAULT_GROUP_ID || "";
    } else {
      recipient = process.env.FONNTE_DEFAULT_TARGET || "";
    }
  }

  // Safeguard: Redirect group messages to test group in development or testing environment
  if (process.env.NODE_ENV === "development" || process.env.TESTING === "true") {
    // If test target is configured, route there, otherwise route to a default test group ID
    if (sendToGroup) {
      recipient = process.env.FONNTE_DEFAULT_GROUP_ID || "120363406824082148";
    } else {
      recipient = process.env.FONNTE_TEST_TARGET || recipient;
    }
  }

  if (!recipient) {
    throw new Error("Penerima WhatsApp belum diatur (target kosong).");
  }

  let responseStatus = 200;
  let responseText = "";
  let responseOk = false;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: recipient,
        message: payload.message,
        countryCode: defaultCountryCode,
      }),
    });
    responseStatus = response.status;
    responseOk = response.ok;
    responseText = await response.text();
  } catch (fetchErr: unknown) {
    const errorMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    throw new Error(`FONNTE network fetch error: ${errorMsg}`);
  }

  let resData: { status?: boolean; reason?: string; message?: string } | null = null;
  try {
    resData = JSON.parse(responseText);
  } catch {
    resData = null;
  }

  if (!responseOk || (resData && resData.status === false)) {
    const errorDetail = resData?.reason || resData?.message || responseText || "Unknown error";
    throw new Error(`FONNTE gagal mengirim notifikasi (${responseStatus}): ${errorDetail}`);
  }

  return {
    ok: true,
    provider: "fonnte",
    target: recipient,
    responseText: responseText.slice(0, 1000),
    response: resData,
  };
}
