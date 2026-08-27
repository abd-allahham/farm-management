import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Search } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { subscribeToYards } from '../yards/api';
import type { Yard } from '../yards/types';
import { subscribeToVaccines } from '../vaccines/api';
import type { Vaccine } from '../vaccines/types';
import {
  createCow,
  deleteCow,
  setVaccinationTaken,
  slaughterCow,
  subscribeToCowVaccinations,
  subscribeToCows,
  updateCow,
} from './api';
import type { Cow, CowVaccination } from './types';

// zxing is a sizeable dependency and most visits never open the scanner, so
// it's only fetched once the user actually taps the camera button.
const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'));

function toDateInputValue(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString();
}

interface CreateDraft {
  barcode: string;
  birthDate: string;
  yardId: string;
}

const emptyDraft: CreateDraft = { barcode: '', birthDate: '', yardId: '' };

export function CowsPage() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [yards, setYards] = useState<Yard[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CreateDraft>(emptyDraft);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deletingCow, setDeletingCow] = useState<Cow | null>(null);

  useEffect(() => {
    const unsubCows = subscribeToCows(
      (next) => {
        setCows(next);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    const unsubYards = subscribeToYards(setYards, () => {});
    const unsubVaccines = subscribeToVaccines(setVaccines, () => {});
    return () => {
      unsubCows();
      unsubYards();
      unsubVaccines();
    };
  }, []);

  const yardName = (yardId: string) => yards.find((y) => y.id === yardId)?.name ?? '—';

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const barcode = draft.barcode.trim();
    if (!barcode || !draft.birthDate || !draft.yardId) return;
    setCreating(true);
    setError(null);
    try {
      await createCow(barcode, fromDateInputValue(draft.birthDate), draft.yardId);
      setDraft(emptyDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the cow. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (cow: Cow) => {
    setEditingId(cow.id);
    setEditDraft({
      barcode: cow.barcode,
      birthDate: toDateInputValue(cow.birthDate),
      yardId: cow.yardId,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(emptyDraft);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editDraft.birthDate || !editDraft.yardId) return;
    try {
      await updateCow(id, fromDateInputValue(editDraft.birthDate), editDraft.yardId);
      cancelEditing();
    } catch {
      setError('Could not update the cow. Please try again.');
    }
  };

  const handleSlaughter = async (cow: Cow) => {
    if (!window.confirm(`Mark "${cow.barcode}" as slaughtered? It stays in the system but leaves active duty.`))
      return;
    try {
      await slaughterCow(cow.id);
    } catch {
      setError('Could not update the cow. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCow) return;
    try {
      await deleteCow(deletingCow.id);
      setDeletingCow(null);
    } catch {
      setError('Could not delete the cow. Please try again.');
      setDeletingCow(null);
    }
  };

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900">Cows</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add a cow by entering its ear tag number, birth date, and yard.
      </p>

      {/* Stacked full-width on mobile, row layout from sm: up — native date/
          select controls don't reliably shrink-to-fit inside flex-wrap on
          mobile browsers (Safari in particular), which was overlapping the
          camera button. */}
      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="flex gap-2 sm:min-w-40 sm:flex-1">
          <input
            value={draft.barcode}
            onChange={(e) => setDraft((d) => ({ ...d, barcode: e.target.value }))}
            placeholder="Ear tag / barcode"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
          />
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            title="Scan barcode with camera"
            aria-label="Scan barcode with camera"
            className="rounded-lg border border-slate-300 px-3 text-slate-600 transition hover:bg-slate-50"
          >
            <Camera size={18} aria-hidden />
          </button>
        </div>
        <input
          value={draft.birthDate}
          onChange={(e) => setDraft((d) => ({ ...d, birthDate: e.target.value }))}
          type="date"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600 sm:w-auto"
        />
        <select
          value={draft.yardId}
          onChange={(e) => setDraft((d) => ({ ...d, yardId: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600 sm:w-auto"
        >
          <option value="">Select yard…</option>
          {yards.map((yard) => (
            <option key={yard.id} value={yard.id}>
              {yard.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating || !draft.barcode.trim() || !draft.birthDate || !draft.yardId}
          className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Add cow
        </button>
      </form>

      {yards.length === 0 && (
        <p className="mt-3 text-sm text-amber-600">Add a yard first before adding cows.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {loading && <li className="px-4 py-3 text-sm text-slate-500">Loading cows…</li>}

        {!loading && cows.length === 0 && (
          <li className="px-4 py-3 text-sm text-slate-500">No cows yet — add one above.</li>
        )}

        {cows.map((cow) => (
          <li key={cow.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {editingId === cow.id ? (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <input
                    value={editDraft.barcode}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-500 sm:w-auto sm:min-w-32 sm:flex-1"
                  />
                  <input
                    value={editDraft.birthDate}
                    onChange={(e) => setEditDraft((d) => ({ ...d, birthDate: e.target.value }))}
                    type="date"
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-green-600 sm:w-auto"
                  />
                  <select
                    value={editDraft.yardId}
                    onChange={(e) => setEditDraft((d) => ({ ...d, yardId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-green-600 sm:w-auto"
                  >
                    {yards.map((yard) => (
                      <option key={yard.id} value={yard.id}>
                        {yard.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  onClick={() => setExpandedId(expandedId === cow.id ? null : cow.id)}
                  className="flex-1 text-left"
                >
                  <p className="flex items-center gap-2 text-sm text-slate-800">
                    {cow.barcode}
                    {cow.status === 'slaughtered' && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        Slaughtered
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Born {formatDate(cow.birthDate)} · {yardName(cow.yardId)}
                  </p>
                </button>
              )}

              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                {editingId === cow.id ? (
                  <>
                    <button
                      onClick={() => void handleSaveEdit(cow.id)}
                      className="text-xs font-medium text-green-700 hover:text-green-800"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {cow.status === 'active' && (
                      <>
                        <button
                          onClick={() => startEditing(cow)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleSlaughter(cow)}
                          className="text-xs font-medium text-amber-600 hover:text-amber-700"
                        >
                          Slaughter
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeletingCow(cow)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {expandedId === cow.id && editingId !== cow.id && (
              <CowVaccinationList cowId={cow.id} vaccines={vaccines} />
            )}
          </li>
        ))}
      </ul>

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            onDetected={(barcode) => {
              setDraft((d) => ({ ...d, barcode }));
              setScannerOpen(false);
            }}
            onClose={() => setScannerOpen(false)}
          />
        </Suspense>
      )}

      {deletingCow && (
        <ConfirmDialog
          title={`Delete "${deletingCow.barcode}"?`}
          message="This permanently deletes the cow and its vaccination history — it will no longer appear anywhere, including reports and statistics. This cannot be undone."
          confirmLabel="Delete permanently"
          danger
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setDeletingCow(null)}
        />
      )}
    </section>
  );
}

function CowVaccinationList({ cowId, vaccines }: { cowId: string; vaccines: Vaccine[] }) {
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
