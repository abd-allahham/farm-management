import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { subscribeToYards } from '../yards/api';
import type { Yard } from '../yards/types';
import { subscribeToVaccines } from '../vaccines/api';
import type { Vaccine } from '../vaccines/types';
import { subscribeToCow } from './api';
import { CowStatusBadge } from './CowStatusBadge';
import { CowVaccinationList } from './CowVaccinationList';
import { formatDate } from './dateUtils';
import { useCowActions } from './useCowActions';
import type { Cow } from './types';

export function CowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cow, setCow] = useState<Cow | null | undefined>(undefined); // undefined = loading
  const [yards, setYards] = useState<Yard[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCow(undefined);
    const unsubCow = subscribeToCow(
      id,
      setCow,
      (err) => setLoadError(err.message),
    );
    const unsubYards = subscribeToYards(setYards, () => {});
    const unsubVaccines = subscribeToVaccines(setVaccines, () => {});
    return () => {
      unsubCow();
      unsubYards();
      unsubVaccines();
    };
  }, [id]);

  if (cow === undefined) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (cow === null) {
    return (
      <div>
        <p className="text-sm text-slate-600">
          {loadError ?? "This cow doesn't exist — it may have been deleted."}
        </p>
        <Link to="/cows" className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-800">
          Back to Cows
        </Link>
      </div>
    );
  }

  return <CowDetail cow={cow} yards={yards} vaccines={vaccines} onNavigateAfterDelete={() => navigate('/cows')} />;
}

function CowDetail({
  cow,
  yards,
  vaccines,
  onNavigateAfterDelete,
}: {
  cow: Cow;
  yards: Yard[];
  vaccines: Vaccine[];
  onNavigateAfterDelete: () => void;
}) {
  const {
    editing,
    editDraft,
    setEditDraft,
    startEditing,
    cancelEditing,
    saveEdit,
    slaughter,
    deleteConfirmOpen,
    openDeleteConfirm,
    cancelDeleteConfirm,
    confirmDelete,
    error,
  } = useCowActions(cow, { onDeleted: onNavigateAfterDelete });

  const yardName = (yardId: string) => yards.find((y) => y.id === yardId)?.name ?? '—';

  return (
    <section>
      <Link to="/cows" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} aria-hidden />
        Cows
      </Link>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
        {editing ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Ear tag / barcode</label>
              <input value={cow.barcode} disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Birth date</label>
              <input
                value={editDraft.birthDate}
                onChange={(e) => setEditDraft((d) => ({ ...d, birthDate: e.target.value }))}
                type="date"
                autoFocus
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Yard</label>
              <select
                value={editDraft.yardId}
                onChange={(e) => setEditDraft((d) => ({ ...d, yardId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
              >
                {yards.map((yard) => (
                  <option key={yard.id} value={yard.id}>
                    {yard.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800"
              >
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{cow.barcode}</h2>
              <CowStatusBadge status={cow.status} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Born</dt>
              <dd className="text-slate-800">{formatDate(cow.birthDate)}</dd>
              <dt className="text-slate-500">Yard</dt>
              <dd className="text-slate-800">{yardName(cow.yardId)}</dd>
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {cow.status === 'active' && (
                <>
                  <button
                    onClick={startEditing}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Update
                  </button>
                  <button
                    onClick={slaughter}
                    className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                  >
                    Slaughter
                  </button>
                </>
              )}
              {/* Smaller/lighter than Update and Slaughter — delete is the
                  one destructive, rarely-used action here. */}
              <button
                onClick={openDeleteConfirm}
                className="ml-auto text-xs font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <CowVaccinationList cowId={cow.id} vaccines={vaccines} disabled={cow.status !== 'active'} />

      {deleteConfirmOpen && (
        <ConfirmDialog
          title={`Delete "${cow.barcode}"?`}
          message="This permanently deletes the cow and its vaccination history — it will no longer appear anywhere, including reports and statistics. This cannot be undone."
          confirmLabel="Delete permanently"
          danger
          onConfirm={confirmDelete}
          onCancel={cancelDeleteConfirm}
        />
      )}
    </section>
  );
}
