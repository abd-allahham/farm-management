import { useEffect, useState, type FormEvent } from 'react';
import { createVaccine, deleteVaccine, subscribeToVaccines, updateVaccine } from './api';
import type { DueAfterUnit, Vaccine } from './types';

const UNIT_OPTIONS: DueAfterUnit[] = ['days', 'weeks', 'months'];

function formatDueAfter(vaccine: Vaccine): string {
  const { dueAfterValue, dueAfterUnit } = vaccine;
  const unit = dueAfterValue === 1 ? dueAfterUnit.slice(0, -1) : dueAfterUnit;
  return `${dueAfterValue} ${unit} after birth`;
}

interface DraftState {
  name: string;
  value: string;
  unit: DueAfterUnit;
}

const emptyDraft: DraftState = { name: '', value: '', unit: 'days' };

export function VaccinesPage() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newVaccine, setNewVaccine] = useState<DraftState>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftState>(emptyDraft);

  useEffect(() => {
    const unsubscribe = subscribeToVaccines(
      (next) => {
        setVaccines(next);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const name = newVaccine.name.trim();
    const value = Number(newVaccine.value);
    if (!name || !Number.isFinite(value) || value <= 0) return;
    setCreating(true);
    setError(null);
    try {
      await createVaccine(name, value, newVaccine.unit);
      setNewVaccine(emptyDraft);
    } catch {
      setError('Could not create the vaccine. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (vaccine: Vaccine) => {
    setEditingId(vaccine.id);
    setEditDraft({
      name: vaccine.name,
      value: String(vaccine.dueAfterValue),
      unit: vaccine.dueAfterUnit,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(emptyDraft);
  };

  const handleSaveEdit = async (id: string) => {
    const name = editDraft.name.trim();
    const value = Number(editDraft.value);
    if (!name || !Number.isFinite(value) || value <= 0) return;
    try {
      await updateVaccine(id, name, value, editDraft.unit);
      cancelEditing();
    } catch {
      setError('Could not update the vaccine. Please try again.');
    }
  };

  const handleDelete = async (vaccine: Vaccine) => {
    if (
      !window.confirm(
        `Delete vaccine "${vaccine.name}"? It will be removed from every cow's vaccination list.`,
      )
    )
      return;
    try {
      await deleteVaccine(vaccine.id);
    } catch {
      setError('Could not delete the vaccine. Please try again.');
    }
  };

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900">Vaccines</h2>
      <p className="mt-1 text-sm text-slate-500">
        Define the vaccination schedule, relative to each cow's birth date.
      </p>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap gap-2">
        <input
          value={newVaccine.name}
          onChange={(e) => setNewVaccine((d) => ({ ...d, name: e.target.value }))}
          placeholder="Vaccine name"
          className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
        />
        <input
          value={newVaccine.value}
          onChange={(e) => setNewVaccine((d) => ({ ...d, value: e.target.value }))}
          type="number"
          min="1"
          placeholder="10"
          className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
        />
        <select
          value={newVaccine.unit}
          onChange={(e) => setNewVaccine((d) => ({ ...d, unit: e.target.value as DueAfterUnit }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
        >
          {UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating || !newVaccine.name.trim() || !newVaccine.value}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {loading && <li className="px-4 py-3 text-sm text-slate-500">Loading vaccines…</li>}

        {!loading && vaccines.length === 0 && (
          <li className="px-4 py-3 text-sm text-slate-500">No vaccines yet — add one above.</li>
        )}

        {vaccines.map((vaccine) => (
          <li key={vaccine.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editingId === vaccine.id ? (
              <div className="flex flex-1 flex-wrap gap-2">
                <input
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                  autoFocus
                  className="min-w-32 flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-green-600"
                />
                <input
                  value={editDraft.value}
                  onChange={(e) => setEditDraft((d) => ({ ...d, value: e.target.value }))}
                  type="number"
                  min="1"
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-green-600"
                />
                <select
                  value={editDraft.unit}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, unit: e.target.value as DueAfterUnit }))
                  }
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-green-600"
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-800">{vaccine.name}</p>
                <p className="text-xs text-slate-500">{formatDueAfter(vaccine)}</p>
              </div>
            )}

            <div className="flex shrink-0 gap-2">
              {editingId === vaccine.id ? (
                <>
                  <button
                    onClick={() => void handleSaveEdit(vaccine.id)}
                    className="text-xs font-medium text-green-700 hover:text-green-800"
                  >
                    Save
                  </button>
                  <button onClick={cancelEditing} className="text-xs font-medium text-slate-500 hover:text-slate-700">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEditing(vaccine)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(vaccine)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
