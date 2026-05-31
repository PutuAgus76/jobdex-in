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
import { db } from "@/lib/firebase/client";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/seed-data";
import { isKoordinator, isKoordinatorAcara } from "@/lib/permissions";
import type {
  DesignReference,
  DesignReferenceInput,
  UserProfile,
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
