import "server-only";

import { getAdminDb, FieldValue } from "@/lib/server/firebase-admin";
import crypto from "crypto";

const DEFAULT_TTL_MINUTES = 60;

function getHashKey(input: string, feature: string): string {
  const hash = crypto.createHash("sha256").update(`${feature}:${input}`).digest("hex");
  return hash.substring(0, 32);
}

function isCacheEnabled(): boolean {
  return process.env.AI_CACHE_ENABLED?.toLowerCase() !== "false";
}

function getCacheTTL(): number {
  const val = parseInt(process.env.AI_CACHE_TTL_MINUTES || "", 10);
  return val > 0 ? val : DEFAULT_TTL_MINUTES;
}

export async function getCachedResponse(
  input: string,
  feature: string
): Promise<string | null> {
  if (!isCacheEnabled()) return null;

  const hashKey = getHashKey(input, feature);
  const db = getAdminDb();

  try {
    const doc = await db.collection("ai_cache").doc(hashKey).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    // Check TTL
    if (data.expires_at) {
      const expiresAt =
        typeof data.expires_at === "object" && "toDate" in data.expires_at
          ? (data.expires_at as { toDate: () => Date }).toDate()
          : new Date(data.expires_at as string);

      if (expiresAt.getTime() < Date.now()) {
        // Expired — clean up async
        doc.ref.delete().catch(() => {});
        return null;
      }
    }

    return (data.response as string) || null;
  } catch (err) {
    console.error("[AI Cache] Failed to read cache:", err);
    return null;
  }
}

export async function setCachedResponse(
  input: string,
  feature: string,
  response: string,
  ttlMinutes?: number
): Promise<void> {
  if (!isCacheEnabled()) return;

  const hashKey = getHashKey(input, feature);
  const ttl = ttlMinutes ?? getCacheTTL();
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);
  const db = getAdminDb();

  try {
    await db.collection("ai_cache").doc(hashKey).set({
      hash_key: hashKey,
      feature,
      input_preview: input.substring(0, 200),
      response,
      expires_at: expiresAt,
      created_at: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[AI Cache] Failed to write cache:", err);
  }
}
