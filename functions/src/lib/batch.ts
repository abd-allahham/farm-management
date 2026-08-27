import type { Firestore, QueryDocumentSnapshot, WriteBatch } from 'firebase-admin/firestore';

// Firestore batched writes cap at 500 mutations; chunk defensively even
// though a single farm's cow/vaccination count won't come close in practice.
const BATCH_LIMIT = 400;

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export async function writeInChunks(
  db: Firestore,
  docs: QueryDocumentSnapshot[],
  apply: (batch: WriteBatch, doc: QueryDocumentSnapshot) => void,
): Promise<void> {
  for (const group of chunk(docs, BATCH_LIMIT)) {
    const batch = db.batch();
    for (const docSnap of group) apply(batch, docSnap);
    await batch.commit();
  }
}
