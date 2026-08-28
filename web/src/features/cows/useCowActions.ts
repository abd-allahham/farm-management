import { useState } from 'react';
import { deleteCow, slaughterCow, updateCow } from './api';
import { fromDateInputValue, toDateInputValue } from './dateUtils';
import type { Cow } from './types';

export interface EditDraft {
  birthDate: string;
  yardId: string;
}

// Behavior shared by CowsPage's compact row and CowDetailPage's full-page
// view — same API calls, same confirmation text, same error handling.
// Presentation (compact vs. full-size buttons) is left to each caller.
export function useCowActions(cow: Cow, options?: { onDeleted?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    birthDate: toDateInputValue(cow.birthDate),
    yardId: cow.yardId,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setEditDraft({ birthDate: toDateInputValue(cow.birthDate), yardId: cow.yardId });
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveEdit = async () => {
    if (!editDraft.birthDate || !editDraft.yardId) return;
    try {
      await updateCow(cow.id, fromDateInputValue(editDraft.birthDate), editDraft.yardId);
      setEditing(false);
    } catch {
      setError('Could not update the cow. Please try again.');
    }
  };

  const slaughter = async () => {
    if (!window.confirm(`Mark "${cow.barcode}" as slaughtered? It stays in the system but leaves active duty.`)) {
      return;
    }
    try {
      await slaughterCow(cow.id);
    } catch {
      setError('Could not update the cow. Please try again.');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteCow(cow.id);
      setDeleteConfirmOpen(false);
      options?.onDeleted?.();
    } catch {
      setError('Could not delete the cow. Please try again.');
      setDeleteConfirmOpen(false);
    }
  };

  return {
    editing,
    editDraft,
    setEditDraft,
    startEditing,
    cancelEditing,
    saveEdit: () => void saveEdit(),
    slaughter: () => void slaughter(),
    deleteConfirmOpen,
    openDeleteConfirm: () => setDeleteConfirmOpen(true),
    cancelDeleteConfirm: () => setDeleteConfirmOpen(false),
    confirmDelete: () => void confirmDelete(),
    error,
  };
}
