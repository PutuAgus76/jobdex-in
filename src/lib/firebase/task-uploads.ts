import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { TaskUpload } from "@/types";

export async function getTaskUploads(taskId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "tasks", taskId, "uploads"),
      orderBy("version_number", "desc"),
    ),
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as TaskUpload[];
}
