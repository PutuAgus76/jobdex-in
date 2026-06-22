import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/seed-data";
import { isKoordinator, isKoordinatorAcara } from "@/lib/permissions";
import type {
  DesignReference,
  DesignReferenceInput,
  UserProfile,
  ReferenceListItem,
  DesignType,
} from "@/types";

function sortReferences(references: DesignReference[]) {
  return references.sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }

    return a.title.localeCompare(b.title);
  });
}

export async function getDesignReferencesForProfile(profile: UserProfile) {
  const referencesRef = collection(db, "design_references");
  const referencesQuery = isKoordinator(profile)
    ? query(referencesRef)
    : query(
        referencesRef,
        where("is_archived", "==", false),
      );

  const snapshot = await getDocs(referencesQuery);
  const references = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as DesignReference[];

  return sortReferences(
    isKoordinator(profile)
      ? references
      : references.filter((reference) => !reference.is_archived),
  );
}

export async function createDesignReference(
  input: DesignReferenceInput,
  createdBy: string,
) {
  const referenceRef = doc(collection(db, "design_references"));

  await setDoc(referenceRef, {
    id: referenceRef.id,
    organization_id: DEFAULT_ORGANIZATION_ID,
    title: input.title,
    event_name: input.event_name,
    design_type: input.design_type,
    year: input.year,
    drive_url: input.drive_url,
    thumbnail_url: input.thumbnail_url,
    style_notes: input.style_notes,
    color_palette: input.color_palette,
    notes: input.notes,
    is_archived: false,
    created_by: createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    
    // New fields
    scope: input.scope || "divisi",
    category: input.category || "lainnya",
    event_id: input.event_id || "",
    drive_links: input.drive_links || [],
    canva_links: input.canva_links || [],
    doc_links: input.doc_links || [],
    other_links: input.other_links || [],
    summary_notes: input.summary_notes || "",
    file_inventory_notes: input.file_inventory_notes || "",
    file_inventory: input.file_inventory || [],
  });

  return referenceRef.id;
}

export async function updateDesignReference(
  referenceId: string,
  input: DesignReferenceInput,
) {
  await updateDoc(doc(db, "design_references", referenceId), {
    title: input.title,
    event_name: input.event_name,
    design_type: input.design_type,
    year: input.year,
    drive_url: input.drive_url,
    thumbnail_url: input.thumbnail_url,
    style_notes: input.style_notes,
    color_palette: input.color_palette,
    notes: input.notes,
    updated_at: serverTimestamp(),

    // New fields
    scope: input.scope || "divisi",
    category: input.category || "lainnya",
    event_id: input.event_id || "",
    drive_links: input.drive_links || [],
    canva_links: input.canva_links || [],
    doc_links: input.doc_links || [],
    other_links: input.other_links || [],
    summary_notes: input.summary_notes || "",
    file_inventory_notes: input.file_inventory_notes || "",
    file_inventory: input.file_inventory || [],
  });
}

export async function archiveDesignReference(referenceId: string) {
  await updateDoc(doc(db, "design_references", referenceId), {
    is_archived: true,
    updated_at: serverTimestamp(),
  });
}

export function canCreateDesignReference(profile: UserProfile | null) {
  return isKoordinator(profile);
}

export function canEditDesignReference(
  profile: UserProfile | null,
  reference: DesignReference | null,
) {
  if (!profile || !reference) {
    return false;
  }

  if (profile.role === "super_admin" || profile.role === "koordinator_divisi") {
    return true;
  }

  return isKoordinatorAcara(profile) && reference.created_by === profile.id;
}

export function mapTaskSubcategoryToDesignType(subcategoryKey?: string): DesignType {
  if (!subcategoryKey) return "lainnya";
  const key = subcategoryKey.toLowerCase();
  if (key === "poster") return "poster";
  if (key === "name_tag" || key === "id_card" || key === "kartu_panitia" || key === "badge_peserta") return "name_tag";
  if (key === "twibbon") return "twibbon";
  if (key.includes("feed")) return "feed_ig";
  if (key.includes("story")) return "story_ig";
  if (key.includes("banner") || key.includes("spanduk") || key.includes("backdrop") || key.includes("baliho")) return "banner";
  if (key === "sertifikat" || key === "piagam") return "sertifikat";
  if (key.includes("foto") || key.includes("dokumentasi")) return "dokumentasi";
  if (key.includes("video") || key.includes("animasi")) return "animasi";
  if (key.includes("merchandise") || key.includes("kaos") || key.includes("baju") || key.includes("plakat")) return "merchandise";
  return "lainnya";
}

export async function getCombinedReferencesForDashboard(profile: UserProfile): Promise<ReferenceListItem[]> {
  if (!profile) return [];
  const currentUser = auth.currentUser;
  const token = currentUser ? await currentUser.getIdToken() : "";

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch("/api/references", { headers });
  if (!res.ok) {
    const err = new Error(`Gagal mengambil referensi. (Status ${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.references || [];
}
