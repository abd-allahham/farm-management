export type DueAfterUnit = 'days' | 'weeks' | 'months';

export const UNIT_TO_DAYS: Record<DueAfterUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30,
};

export function computeDueAfterDays(value: number, unit: DueAfterUnit): number {
  return Math.round(value * UNIT_TO_DAYS[unit]);
}

export interface Vaccine {
  id: string;
  name: string;
  dueAfterValue: number;
  dueAfterUnit: DueAfterUnit;
  dueAfterDays: number; // derived from value+unit, used for all date math
  createdAt: number;
}
