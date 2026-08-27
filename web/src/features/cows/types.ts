export type CowStatus = 'active' | 'slaughtered' | 'deleted';

export interface Cow {
  id: string;
  barcode: string;
  birthDate: number; // epoch ms — see functions/src/lib/dates.ts for why
  yardId: string;
  status: CowStatus;
  slaughteredAt?: number;
  // 'deleted' is a soft delete — the record stays for audit purposes but is
  // hidden from the working list and (from M7) reports/statistics.
  deletedAt?: number;
  createdAt: number;
}

export interface CowVaccination {
  vaccineId: string;
  dueDate: number;
  status: 'pending' | 'done';
  takenAt?: number;
}
