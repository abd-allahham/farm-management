import { useEffect, useState, type FormEvent } from 'react';
import { createYard, deleteYard, renameYard, subscribeToYards } from './api';
import type { Yard } from './types';

export function YardsPage() {
  const [yards, setYards] = useState<Yard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newYardName, setNewYardName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToYards(
      (nextYards) => {
        setYards(nextYards);
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
    const name = newYardName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      await createYard(name);
      setNewYardName('');
    } catch {
      setError('Could not create the yard. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (yard: Yard) => {
    setEditingId(yard.id);
    setEditingName(yard.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      await renameYard(id, name);
      cancelEditing();
    } catch {
      setError('Could not rename the yard. Please try again.');
    }
  };

  const handleDelete = async (yard: Yard) => {
    if (!window.confirm(`Delete yard "${yard.name}"? This cannot be undone.`)) return;
    try {
      await deleteYard(yard.id);
    } catch {
      setError('Could not delete the yard. Please try again.');
    }
  };

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900">Yards</h2>
      <p className="mt-1 text-sm text-slate-500">Group cows into yards around the farm.</p>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          value={newYardName}
          onChange={(e) => setNewYardName(e.target.value)}
          placeholder="New yard name"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
        />
        <button
          type="submit"
          disabled={creating || !newYardName.trim()}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {loading && <li className="px-4 py-3 text-sm text-slate-500">Loading yards…</li>}

        {!loading && yards.length === 0 && (
          <li className="px-4 py-3 text-sm text-slate-500">No yards yet — add one above.</li>
        )}

        {yards.map((yard) => (
          <li key={yard.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editingId === yard.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleRename(yard.id);
                  if (e.key === 'Escape') cancelEditing();
                }}
                autoFocus
                className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-green-600"
              />
            ) : (
              <span className="text-sm text-slate-800">{yard.name}</span>
            )}

            <div className="flex shrink-0 gap-2">
              {editingId === yard.id ? (
                <>
                  <button
                    onClick={() => void handleRename(yard.id)}
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
                    onClick={() => startEditing(yard)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => void handleDelete(yard)}
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
