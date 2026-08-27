import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Cow, CowVaccination } from './types';

// This module only ever runs behind App's isFirebaseConfigured gate, so `db`
// is guaranteed non-null at call time despite its nullable type.
function requireDb(): Firestore {
  if (!db) throw new Error('Firestore is not configured.');
  return db;
}

const cowsCollection = () => collection(requireDb(), 'cows');

export function subscribeToCows(
  onChange: (cows: Cow[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(cowsCollection(), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const cows = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          barcode: data.barcode as string,
          birthDate: data.birthDate as number,
          yardId: data.yardId as string,
          status: data.status as Cow['status'],
          // Pending local writes haven't got a server timestamp yet.
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        };
      });
      onChange(cows);
    },
    onError,
  );
}

export function subscribeToCowVaccinations(
  cowId: string,
  onChange: (vaccinations: CowVaccination[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = collection(requireDb(), 'cows', cowId, 'vaccinations');
  return onSnapshot(
    q,
    (snapshot) => {
      const vaccinations = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          vaccineId: data.vaccineId as string,
          dueDate: data.dueDate as number,
          status: data.status as CowVaccination['status'],
        };
      });
      onChange(vaccinations);
    },
    onError,
  );
}

export async function createCow(barcode: string, birthDate: number, yardId: string): Promise<void> {
  const existing = await getDocs(query(cowsCollection(), where('barcode', '==', barcode)));
  if (!existing.empty) {
    throw new Error(`A cow with ear tag "${barcode}" already exists.`);
  }
  await addDoc(cowsCollection(), {
    barcode,
    birthDate,
    yardId,
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

// Ear tag (barcode) is treated as a permanent identifier and isn't editable
// here — birth date (correction) and yard (the "move to another yard"
// requirement) are.
export async function updateCow(id: string, birthDate: number, yardId: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'cows', id), { birthDate, yardId });
}
