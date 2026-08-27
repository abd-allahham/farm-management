// 'slaughtered' and 'deleted' are introduced in M5 (lifecycle) — the field
// exists from the start so that milestone is a pure status transition, not a
// schema migration.
export type CowStatus = 'active' | 'slaughtered' | 'deleted';

export interface Cow {
  id: string;
  barcode: string;
  birthDate: number; // epoch ms — see functions/src/lib/dates.ts for why
  yardId: string;
  status: CowStatus;
  createdAt: number;
}

export interface CowVaccination {
  vaccineId: string;
  dueDate: number;
  status: 'pending' | 'done';
}
