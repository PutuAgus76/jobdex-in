import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { defaultOrganization } from "@/lib/seed-data";

export async function createDefaultOrganization() {
  await setDoc(
    doc(db, "organizations", defaultOrganization.id),
    {
      ...defaultOrganization,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}
