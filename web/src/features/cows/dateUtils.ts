export function toDateInputValue(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function fromDateInputValue(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString();
}
