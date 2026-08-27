import { FieldValue, getFirestore, type DocumentReference } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { addDays } from './lib/dates.js';
import { writeInChunks } from './lib/batch.js';

// Same region as the Firestore-adjacent trigger functions in vaccines.ts —
// keep the client's `getFunctions(app, region)` call in sync with this.
const REGION = 'europe-central2';

interface VaccinationDoc {
  vaccineId: string;
  birthDate: number;
  dueDate: number;
  status: 'pending' | 'done';
}

async function seedVaccinations(cowRef: DocumentReference, birthDate: number): Promise<void> {
  const db = getFirestore();
  const vaccinesSnap = await db.collection('vaccines').get();

  await writeInChunks(db, vaccinesSnap.docs, (batch, vaccineDoc) => {
    const vaccine = vaccineDoc.data() as { dueAfterDays: number };
    const ref = cowRef.collection('vaccinations').doc(vaccineDoc.id);
    const doc: VaccinationDoc = {
      vaccineId: vaccineDoc.id,
      birthDate,
      dueDate: addDays(birthDate, vaccine.dueAfterDays),
      status: 'pending',
    };
    batch.set(ref, doc);
  });
}

interface CreateCowInput {
  barcode: string;
  birthDate: number;
  yardId: string;
}

// Callable rather than a Firestore trigger (M3 originally used
// onDocumentCreated) so the client awaits the vaccination fan-out completing
// in the same request instead of a background trigger landing moments
// later — the UI has the full picture the instant this resolves.
export const createCow = onCall<CreateCowInput>({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  const { barcode, birthDate, yardId } = request.data ?? {};
  if (!barcode?.trim() || !birthDate || !yardId) {
    throw new HttpsError('invalid-argument', 'barcode, birthDate and yardId are required.');
  }

  const db = getFirestore();
  const existing = await db.collection('cows').where('barcode', '==', barcode).limit(1).get();
  if (!existing.empty) {
    throw new HttpsError('already-exists', `A cow with ear tag "${barcode}" already exists.`);
  }

  const cowRef = await db.collection('cows').add({
    barcode,
    birthDate,
    yardId,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
  });
  await seedVaccinations(cowRef, birthDate);

  return { id: cowRef.id };
});

interface UpdateCowInput {
  id: string;
  birthDate: number;
  yardId: string;
}

// Same reasoning as createCow: does the birth-date-shift fan-out (M3's
// onDocumentUpdated) inline so the client sees updated due dates immediately.
export const updateCow = onCall<UpdateCowInput>({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  const { id, birthDate, yardId } = request.data ?? {};
  if (!id || !birthDate || !yardId) {
    throw new HttpsError('invalid-argument', 'id, birthDate and yardId are required.');
  }

  const db = getFirestore();
  const cowRef = db.collection('cows').doc(id);
  const cowSnap = await cowRef.get();
  if (!cowSnap.exists) throw new HttpsError('not-found', 'Cow not found.');
  const before = cowSnap.data() as { birthDate: number };

  await cowRef.update({ birthDate, yardId });

  if (before.birthDate !== birthDate) {
    const deltaMs = birthDate - before.birthDate;
    const pendingSnap = await cowRef.collection('vaccinations').where('status', '==', 'pending').get();
    await writeInChunks(db, pendingSnap.docs, (batch, docSnap) => {
      const dueDate = docSnap.data().dueDate as number;
      batch.update(docSnap.ref, { birthDate, dueDate: dueDate + deltaMs });
    });
  }

  return { ok: true };
});
