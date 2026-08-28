import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import type { Vaccine } from '../vaccines/types';
import { setVaccinationTaken, subscribeToCowVaccinations } from './api';
import { formatDate } from './dateUtils';
import type { CowVaccination } from './types';

// Shared by CowsPage (per-row, expandable) and CowDetailPage (always shown).
export function CowVaccinationList({ cowId, vaccines }: { cowId: string; vaccines: Vaccine[] }) {
  const [vaccinations, setVaccinations] = useState<CowVaccination[] | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setVaccinations(null);
    return subscribeToCowVaccinations(cowId, setVaccinations, () => setVaccinations([]));
  }, [cowId]);

  const vaccineName = (vaccineId: string) =>
    vaccines.find((v) => v.id === vaccineId)?.name ?? 'Unknown vaccine';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vaccinations ?? [];
    return (vaccinations ?? []).filter((v) => vaccineName(v.vaccineId).toLowerCase().includes(q));
  }, [vaccinations, search, vaccines]);

  const toggle = async (v: CowVaccination) => {
    setSaving((s) => new Set(s).add(v.vaccineId));
    setError(null);
    try {
      await setVaccinationTaken(cowId, v.vaccineId, v.status !== 'done');
    } catch {
      setError('Could not update this vaccine. Please try again.');
    } finally {
      setSaving((s) => {
        const next = new Set(s);
        next.delete(v.vaccineId);
        return next;
      });
    }
  };

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">Vaccinations</p>

      {vaccinations === null && <p className="mt-1 text-xs text-slate-400">Loading…</p>}

      {vaccinations !== null && vaccinations.length === 0 && (
        <p className="mt-1 text-xs text-slate-400">No vaccines defined yet.</p>
      )}

      {vaccinations !== null && vaccinations.length > 0 && (
        <div className="relative mt-2">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vaccines…"
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs outline-none focus:border-green-600"
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {vaccinations !== null && vaccinations.length > 0 && filtered.length === 0 && (
        <p className="mt-2 text-xs text-slate-400">No vaccines match "{search}".</p>
      )}

      <ul className="mt-2 divide-y divide-slate-200">
        {filtered.map((v) => {
          const isDone = v.status === 'done';
          const isDue = !isDone && v.dueDate <= Date.now();
          return (
            <li
              key={v.vaccineId}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm leading-relaxed text-slate-800">{vaccineName(v.vaccineId)}</p>
                <p className="text-xs leading-relaxed text-slate-500">
                  {isDone
                    ? `Taken ${v.takenAt ? formatDate(v.takenAt) : ''}`.trim()
                    : `Due ${formatDate(v.dueDate)}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isDone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 size={14} aria-hidden />
                    Taken
                  </span>
                )}
                {isDue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <AlertTriangle size={14} aria-hidden />
                    Due
                  </span>
                )}

                <button
                  onClick={() => void toggle(v)}
                  disabled={saving.has(v.vaccineId)}
                  className={
                    isDone
                      ? 'rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50'
                      : 'rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-50'
                  }
                >
                  {isDone ? 'Undo' : 'Vaccinate'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
