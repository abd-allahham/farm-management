import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Camera } from 'lucide-react';
import { subscribeToYards } from '../yards/api';
import type { Yard } from '../yards/types';
import { subscribeToVaccines } from '../vaccines/api';
import type { Vaccine } from '../vaccines/types';
import { CowListRow } from './CowListRow';
import { createCow, subscribeToCows } from './api';
import { fromDateInputValue } from './dateUtils';
import type { Cow } from './types';

// zxing is a sizeable dependency and most visits never open the scanner, so
// it's only fetched once the user actually taps the camera button.
const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'));

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
          <CowListRow
            key={cow.id}
            cow={cow}
            yards={yards}
            vaccines={vaccines}
            expanded={expandedId === cow.id}
            onToggleExpand={() => setExpandedId(expandedId === cow.id ? null : cow.id)}
          />
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
