import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Camera } from 'lucide-react';
import { subscribeToYards } from '../yards/api';
import type { Yard } from '../yards/types';
import { subscribeToVaccines } from '../vaccines/api';
import type { Vaccine } from '../vaccines/types';
import { createCow, subscribeToCowVaccinations, subscribeToCows, updateCow } from './api';
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
                  <p className="text-sm text-slate-800">{cow.barcode}</p>
                  <p className="text-xs text-slate-500">
                    Born {formatDate(cow.birthDate)} · {yardName(cow.yardId)}
                  </p>
                </button>
              )}

              <div className="flex shrink-0 gap-2">
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
                  <button
                    onClick={() => startEditing(cow)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Edit
                  </button>
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
    </section>
  );
}

function CowVaccinationList({ cowId, vaccines }: { cowId: string; vaccines: Vaccine[] }) {
  const [vaccinations, setVaccinations] = useState<CowVaccination[] | null>(null);

  useEffect(() => {
    setVaccinations(null);
    return subscribeToCowVaccinations(cowId, setVaccinations, () => setVaccinations([]));
  }, [cowId]);

  const vaccineName = (vaccineId: string) =>
    vaccines.find((v) => v.id === vaccineId)?.name ?? 'Unknown vaccine';

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">Vaccinations</p>
      {vaccinations === null && <p className="mt-1 text-xs text-slate-400">Loading…</p>}
      {vaccinations !== null && vaccinations.length === 0 && (
        <p className="mt-1 text-xs text-slate-400">No vaccines defined yet.</p>
      )}
      <ul className="mt-1 space-y-1">
        {vaccinations?.map((v) => (
          <li key={v.vaccineId} className="flex items-center justify-between text-xs">
            <span className="text-slate-700">{vaccineName(v.vaccineId)}</span>
            <span
              className={
                v.status === 'done'
                  ? 'font-medium text-green-700'
                  : 'font-medium text-amber-600'
              }
            >
              {v.status === 'done' ? 'Done' : `Due ${formatDate(v.dueDate)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
