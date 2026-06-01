import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/seed-data";
import type { DesignReferenceInput, UserProfile } from "@/types";

export async function bulkCreateDesignReferences(
  items: DesignReferenceInput[],
  currentUser: UserProfile,
): Promise<void> {
  if (items.length === 0) return;
  if (items.length > 100) {
    throw new Error("Import maksimal 100 arsip sekali simpan.");
  }

  const batch = writeBatch(db);
  const referencesRef = collection(db, "design_references");

  for (const item of items) {
    const referenceDocRef = doc(referencesRef);
    batch.set(referenceDocRef, {
      id: referenceDocRef.id,
      organization_id: DEFAULT_ORGANIZATION_ID,
      title: item.title,
      event_name: item.event_name,
      design_type: item.design_type,
      year: item.year,
      drive_url: item.drive_url || "",
      thumbnail_url: item.thumbnail_url || "",
      style_notes: item.style_notes || "",
      color_palette: item.color_palette || [],
      notes: item.notes || "",
      is_archived: false,
      created_by: currentUser.id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      
      // New expanded fields
      scope: item.scope || "divisi",
      category: item.category || "lainnya",
      event_id: item.event_id || "",
      drive_links: item.drive_links || [],
      canva_links: item.canva_links || [],
      doc_links: item.doc_links || [],
      other_links: item.other_links || [],
      summary_notes: item.summary_notes || "",
      file_inventory_notes: item.file_inventory_notes || "",
    });
  }

  await batch.commit();
}
