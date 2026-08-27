import { BellOff } from 'lucide-react';
import { useNotifications } from './NotificationsContext';

// Persistent (not dismissible) until notifications are actually enabled —
// deliberately not a toast the user can shrug off, since missing a
// vaccination due date has real consequences.
export function NotificationBanner() {
  const { supported, registered, permission, busy, retry } = useNotifications();

  if (supported === false || registered || permission !== 'denied') return null;

  return (
    <div className="mb-4 flex flex-col items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <BellOff size={16} className="shrink-0" aria-hidden />
        <span>Vaccination reminders are off — you won't be notified about due vaccines.</span>
      </div>
      <button
        onClick={retry}
        disabled={busy}
        className="shrink-0 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
      >
        Enable
      </button>
    </div>
  );
}
