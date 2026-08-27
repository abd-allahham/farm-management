export interface Yard {
  id: string;
  name: string;
  createdAt: number; // ms epoch, set via Firestore serverTimestamp on read-back
}
