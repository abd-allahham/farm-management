import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { addDays } from './lib/dates.js';
import { writeInChunks } from './lib/batch.js';

interface VaccinationDoc {
  vaccineId: string;
  birthDate: number;
  dueDate: number;
  status: 'pending' | 'done';
}

// M3: when a cow is created, seed its vaccinations subcollection from every
// existing vaccine as 'pending'. Mirrors M2's onVaccineCreated (which fans a
// new vaccine out to every existing cow) so both directions stay in sync.
export const onCowCreated = onDocumentCreated('cows/{cowId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const cow = snap.data() as { birthDate: number };

  const db = getFirestore();
  const vaccinesSnap = await db.collection('vaccines').get();

  await writeInChunks(db, vaccinesSnap.docs, (batch, vaccineDoc) => {
    const vaccine = vaccineDoc.data() as { dueAfterDays: number };
    const ref = snap.ref.collection('vaccinations').doc(vaccineDoc.id);
    const doc: VaccinationDoc = {
      vaccineId: vaccineDoc.id,
      birthDate: cow.birthDate,
      dueDate: addDays(cow.birthDate, vaccine.dueAfterDays),
      status: 'pending',
    };
    batch.set(ref, doc);
  });
});

// If a cow's birth date is corrected after creation, shift dueDate for its
// still-pending vaccinations by the same delta (done ones are left as
// history). Shifting by delta — rather than re-deriving from each vaccine's
// dueAfterDays — avoids a second read of the vaccines collection here.
export const onCowUpdated = onDocumentUpdated('cows/{cowId}', async (event) => {
  const before = event.data?.before.data() as { birthDate: number } | undefined;
  const after = event.data?.after.data() as { birthDate: number } | undefined;
  if (!before || !after || before.birthDate === after.birthDate) return;

  const deltaMs = after.birthDate - before.birthDate;
  const db = getFirestore();
  const pendingSnap = await event.data!.after.ref
    .collection('vaccinations')
    .where('status', '==', 'pending')
    .get();

  await writeInChunks(db, pendingSnap.docs, (batch, docSnap) => {
    const dueDate = docSnap.data().dueDate as number;
    batch.update(docSnap.ref, { birthDate: after.birthDate, dueDate: dueDate + deltaMs });
  });
});
