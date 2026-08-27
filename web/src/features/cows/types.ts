// Delete is a hard delete (the doc and its vaccinations subcollection are
// actually removed via the deleteCow callable), so there's no 'deleted'
// status to represent here — a deleted cow simply no longer exists.
export type CowStatus = 'active' | 'slaughtered';

export interface Cow {
  id: string;
  barcode: string;
  birthDate: number; // epoch ms — see functions/src/lib/dates.ts for why
  yardId: string;
  status: CowStatus;
  slaughteredAt?: number;
  createdAt: number;
}

export interface CowVaccination {
  vaccineId: string;
  dueDate: number;
  status: 'pending' | 'done';
  takenAt?: number;
}
