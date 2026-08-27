import { collection, onSnapshot, orderBy, query, type Firestore } from 'firebase/firestore';
import { httpsCallable, type Functions } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import type { Cow, CowVaccination } from './types';

// This module only ever runs behind App's isFirebaseConfigured gate, so
// these are guaranteed non-null at call time despite their nullable types.
function requireDb(): Firestore {
  if (!db) throw new Error('Firestore is not configured.');
  return db;
}

function requireFunctions(): Functions {
  if (!functions) throw new Error('Cloud Functions are not configured.');
  return functions;
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

// createCow/updateCow are Cloud Functions callables, not direct Firestore
// writes: the vaccination fan-out (seed on create, shift due dates on birth
// date edit) happens server-side in the same request, so by the time these
// resolve the UI already has the full picture — see functions/src/cows.ts.
// This also means Firestore rules deny client writes to cows/* directly.

export async function createCow(barcode: string, birthDate: number, yardId: string): Promise<void> {
  const call = httpsCallable<{ barcode: string; birthDate: number; yardId: string }, { id: string }>(
    requireFunctions(),
    'createCow',
  );
  await call({ barcode, birthDate, yardId });
}

// Ear tag (barcode) is treated as a permanent identifier and isn't editable
// here — birth date (correction) and yard (the "move to another yard"
// requirement) are.
export async function updateCow(id: string, birthDate: number, yardId: string): Promise<void> {
  const call = httpsCallable<{ id: string; birthDate: number; yardId: string }, { ok: true }>(
    requireFunctions(),
    'updateCow',
  );
  await call({ id, birthDate, yardId });
}
