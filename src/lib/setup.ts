import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  defaultDivision,
  defaultOrganization,
  DEFAULT_DIVISION_ID,
  DEFAULT_ORGANIZATION_ID,
} from "@/lib/seed-data";

export type InitialSetupStatus = {
  organizationExists: boolean;
  divisionExists: boolean;
};

export async function getInitialSetupStatus(): Promise<InitialSetupStatus> {
  const [organizationSnapshot, divisionSnapshot] = await Promise.all([
    getDoc(doc(db, "organizations", DEFAULT_ORGANIZATION_ID)),
    getDoc(doc(db, "divisions", DEFAULT_DIVISION_ID)),
  ]);

  return {
    organizationExists: organizationSnapshot.exists(),
    divisionExists: divisionSnapshot.exists(),
  };
}

export async function ensureInitialData() {
  const status = await getInitialSetupStatus();

  const operations: Array<Promise<void>> = [];

  if (!status.organizationExists) {
    operations.push(
      setDoc(doc(db, "organizations", DEFAULT_ORGANIZATION_ID), {
        ...defaultOrganization,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }),
    );
  }

  if (!status.divisionExists) {
    operations.push(
      setDoc(doc(db, "divisions", DEFAULT_DIVISION_ID), {
        ...defaultDivision,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }),
    );
  }

  await Promise.all(operations);

  return getInitialSetupStatus();
}
