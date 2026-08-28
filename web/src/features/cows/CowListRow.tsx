import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Yard } from '../yards/types';
import type { Vaccine } from '../vaccines/types';
import { CowStatusBadge } from './CowStatusBadge';
import { CowVaccinationList } from './CowVaccinationList';
import { formatDate } from './dateUtils';
import { useCowActions } from './useCowActions';
import type { Cow } from './types';

interface Props {
  cow: Cow;
  yards: Yard[];
  vaccines: Vaccine[];
  expanded: boolean;
  onToggleExpand: () => void;
}

export function CowListRow({ cow, yards, vaccines, expanded, onToggleExpand }: Props) {
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
  } = useCowActions(cow);

  const yardName = (yardId: string) => yards.find((y) => y.id === yardId)?.name ?? '—';

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {editing ? (
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              value={cow.barcode}
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
          <div className="flex flex-1 items-center gap-2">
            <button
              onClick={onToggleExpand}
              aria-expanded={expanded}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <ChevronDown
                size={16}
                className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm text-slate-800">
                  {cow.barcode}
                  <CowStatusBadge status={cow.status} />
                </p>
                <p className="text-xs text-slate-500">
                  Born {formatDate(cow.birthDate)} · {yardName(cow.yardId)}
                </p>
              </span>
            </button>
            <Link to={`/cows/${cow.id}`} className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-700">
              Details
            </Link>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {editing ? (
            <>
              <button onClick={saveEdit} className="text-xs font-medium text-green-700 hover:text-green-800">
                Save
              </button>
              <button onClick={cancelEditing} className="text-xs font-medium text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            </>
          ) : (
            <>
              {cow.status === 'active' && (
                <>
                  <button onClick={startEditing} className="text-xs font-medium text-slate-500 hover:text-slate-700">
                    Edit
                  </button>
                  <button onClick={slaughter} className="text-xs font-medium text-amber-600 hover:text-amber-700">
                    Slaughter
                  </button>
                </>
              )}
              <button onClick={openDeleteConfirm} className="text-xs font-medium text-red-600 hover:text-red-700">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {expanded && !editing && (
        <CowVaccinationList cowId={cow.id} vaccines={vaccines} disabled={cow.status !== 'active'} />
      )}

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
    </li>
  );
}
