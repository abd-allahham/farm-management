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
import type { Yard } from './types';

// This module only ever runs behind App's isFirebaseConfigured gate, so `db`
// is guaranteed non-null at call time despite its nullable type.
function requireDb(): Firestore {
  if (!db) throw new Error('Firestore is not configured.');
  return db;
}

const yardsCollection = () => collection(requireDb(), 'yards');

export function subscribeToYards(
  onChange: (yards: Yard[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(yardsCollection(), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const yards = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name as string,
          // Pending local writes haven't got a server timestamp yet.
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        };
      });
      onChange(yards);
    },
    onError,
  );
}

export async function createYard(name: string): Promise<void> {
  await addDoc(yardsCollection(), { name, createdAt: serverTimestamp() });
}

export async function renameYard(id: string, name: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'yards', id), { name });
}

export async function deleteYard(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'yards', id));
}
