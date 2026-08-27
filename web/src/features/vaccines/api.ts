import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { computeDueAfterDays, type DueAfterUnit, type Vaccine } from './types';

// This module only ever runs behind App's isFirebaseConfigured gate, so `db`
// is guaranteed non-null at call time despite its nullable type.
function requireDb(): Firestore {
  if (!db) throw new Error('Firestore is not configured.');
  return db;
}

const vaccinesCollection = () => collection(requireDb(), 'vaccines');

export function subscribeToVaccines(
  onChange: (vaccines: Vaccine[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(vaccinesCollection(), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const vaccines = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name as string,
          dueAfterValue: data.dueAfterValue as number,
          dueAfterUnit: data.dueAfterUnit as DueAfterUnit,
          dueAfterDays: data.dueAfterDays as number,
          // Pending local writes haven't got a server timestamp yet.
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        };
      });
      onChange(vaccines);
    },
    onError,
  );
}

export async function createVaccine(
  name: string,
  dueAfterValue: number,
  dueAfterUnit: DueAfterUnit,
): Promise<void> {
  await addDoc(vaccinesCollection(), {
    name,
    dueAfterValue,
    dueAfterUnit,
    dueAfterDays: computeDueAfterDays(dueAfterValue, dueAfterUnit),
    createdAt: serverTimestamp(),
  });
}

export async function updateVaccine(
  id: string,
  name: string,
  dueAfterValue: number,
  dueAfterUnit: DueAfterUnit,
): Promise<void> {
  await updateDoc(doc(requireDb(), 'vaccines', id), {
    name,
    dueAfterValue,
    dueAfterUnit,
    dueAfterDays: computeDueAfterDays(dueAfterValue, dueAfterUnit),
  });
}

export async function deleteVaccine(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'vaccines', id));
}
