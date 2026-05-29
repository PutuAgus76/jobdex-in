import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { defaultDivision } from "@/lib/seed-data";

export async function createDefaultDivision() {
  await setDoc(
    doc(db, "divisions", defaultDivision.id),
    {
      ...defaultDivision,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}
