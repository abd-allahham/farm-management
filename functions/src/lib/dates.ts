const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Cow birthDate and vaccination dueDate are both stored as epoch-ms numbers
// (not Firestore Timestamps) so this stays plain arithmetic and the values
// are directly comparable/sortable in range queries (M6's due-date scan).
export function addDays(baseMs: number, days: number): number {
  return baseMs + days * MS_PER_DAY;
}
