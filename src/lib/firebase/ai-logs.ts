import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { AILog } from "@/types";

export async function getRecentAILogs() {
  const snapshot = await getDocs(
    query(collection(db, "ai_logs"), orderBy("created_at", "desc"), limit(50)),
  );

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .reverse() as AILog[];
}
