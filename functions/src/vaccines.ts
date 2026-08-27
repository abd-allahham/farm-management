import { getFirestore } from 'firebase-admin/firestore';
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { addDays } from './lib/dates.js';
import { writeInChunks } from './lib/batch.js';

// Cows collection lands in M3 — documenting the shape now since this module
// depends on it: cows/{cowId} has a `birthDate` field (epoch-ms number).
// Each cow's cows/{cowId}/vaccinations/{vaccineId} doc mirrors that
// birthDate so a vaccine's own schedule can be recomputed later without an
// extra read of the parent cow.
interface VaccinationDoc {
  vaccineId: string;
  birthDate: number;
  dueDate: number;
  status: 'pending' | 'done';
}

// M2: when a vaccine is created, add a "not taken" entry to every existing
// cow's vaccinations subcollection. M3 seeds it the other way — when a cow
// is created, from every existing vaccine.
export const onVaccineCreated = onDocumentCreated('vaccines/{vaccineId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const vaccine = snap.data() as { dueAfterDays: number };
  const vaccineId = event.params.vaccineId;

  const db = getFirestore();
  const cowsSnap = await db.collection('cows').get();

  await writeInChunks(db, cowsSnap.docs, (batch, cow) => {
    const birthDate = cow.data().birthDate as number | undefined;
    if (birthDate == null) return;
    const ref = cow.ref.collection('vaccinations').doc(vaccineId);
    const doc: VaccinationDoc = {
      vaccineId,
      birthDate,
      dueDate: addDays(birthDate, vaccine.dueAfterDays),
      status: 'pending',
    };
    batch.set(ref, doc);
  });
});

// If the schedule (dueAfterDays) changes, recompute due dates for cows that
// haven't taken this vaccine yet — leave "done" records alone as history.
export const onVaccineUpdated = onDocumentUpdated('vaccines/{vaccineId}', async (event) => {
  const before = event.data?.before.data() as { dueAfterDays: number } | undefined;
  const after = event.data?.after.data() as { dueAfterDays: number } | undefined;
  if (!before || !after || before.dueAfterDays === after.dueAfterDays) return;

  const vaccineId = event.params.vaccineId;
  const db = getFirestore();
  const pendingSnap = await db
    .collectionGroup('vaccinations')
    .where('vaccineId', '==', vaccineId)
    .where('status', '==', 'pending')
    .get();

  await writeInChunks(db, pendingSnap.docs, (batch, docSnap) => {
    const birthDate = docSnap.data().birthDate as number | undefined;
    if (birthDate == null) return;
    batch.update(docSnap.ref, { dueDate: addDays(birthDate, after.dueAfterDays) });
  });
});

// Deleting a vaccine removes its entry from every cow's vaccinations list —
// nothing should reference a schedule that no longer exists.
export const onVaccineDeleted = onDocumentDeleted('vaccines/{vaccineId}', async (event) => {
  const vaccineId = event.params.vaccineId;
  const db = getFirestore();
  const entriesSnap = await db
    .collectionGroup('vaccinations')
    .where('vaccineId', '==', vaccineId)
    .get();

  await writeInChunks(db, entriesSnap.docs, (batch, docSnap) => {
    batch.delete(docSnap.ref);
  });
});
