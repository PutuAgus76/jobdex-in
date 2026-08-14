import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { WhatsAppSystemSettings } from "@/types";

export const DEFAULT_SANDBOX_TEST_GROUP_ID = "120363406824082148@g.us";

export async function getWhatsAppSystemSettingsClient(): Promise<WhatsAppSystemSettings> {
  try {
    const docRef = doc(db, "system_settings", "whatsapp");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        isTestMode: Boolean(data.isTestMode),
        testGroupId: data.testGroupId || DEFAULT_SANDBOX_TEST_GROUP_ID,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
        updatedByName: data.updatedByName,
      };
    }

    return {
      isTestMode: false,
      testGroupId: DEFAULT_SANDBOX_TEST_GROUP_ID,
    };
  } catch (err) {
    console.error("Error reading whatsapp system settings:", err);
    return {
      isTestMode: false,
      testGroupId: DEFAULT_SANDBOX_TEST_GROUP_ID,
    };
  }
}

export async function updateWhatsAppSystemSettingsClient(
  settings: Partial<WhatsAppSystemSettings>,
  userId?: string,
  userName?: string
): Promise<void> {
  const docRef = doc(db, "system_settings", "whatsapp");
  const payload: Record<string, unknown> = {
    ...settings,
    updatedAt: serverTimestamp(),
  };

  if (userId) payload.updatedBy = userId;
  if (userName) payload.updatedByName = userName;

  await setDoc(docRef, payload, { merge: true });
}

export function subscribeWhatsAppSystemSettings(
  callback: (settings: WhatsAppSystemSettings) => void
): () => void {
  const docRef = doc(db, "system_settings", "whatsapp");
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          isTestMode: Boolean(data.isTestMode),
          testGroupId: data.testGroupId || DEFAULT_SANDBOX_TEST_GROUP_ID,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
          updatedByName: data.updatedByName,
        });
      } else {
        callback({
          isTestMode: false,
          testGroupId: DEFAULT_SANDBOX_TEST_GROUP_ID,
        });
      }
    },
    (err) => {
      console.warn("Real-time settings listener fallback:", err);
      callback({
        isTestMode: false,
        testGroupId: DEFAULT_SANDBOX_TEST_GROUP_ID,
      });
    }
  );
}
