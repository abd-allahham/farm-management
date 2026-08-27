import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from './NotificationsContext';

// Persistent (not dismissible) until notifications are actually enabled —
// deliberately not a toast the user can shrug off, since missing a
// vaccination due date has real consequences. Also doubles as the "auto
// prompt on login" trigger: browsers require a real click to show the
// actual permission dialog, so this banner's Enable button — not a
// background effect — is what satisfies that gesture requirement.
export function NotificationBanner() {
  const { supported, registered, permission, busy, retry } = useNotifications();

  if (supported === false || registered || permission === 'granted') return null;

  const denied = permission === 'denied';

  return (
    <div
      className={`mb-4 flex flex-col items-start gap-2 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
        denied ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <div className="flex items-center gap-2">
        {denied ? <BellOff size={16} className="shrink-0" aria-hidden /> : <Bell size={16} className="shrink-0" aria-hidden />}
        <span>
          {denied
            ? "Vaccination reminders are off — you won't be notified about due vaccines."
            : 'Get notified when a vaccination is due — enable reminders for this app.'}
        </span>
      </div>
      <button
        onClick={retry}
        disabled={busy}
        className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          denied
            ? 'border-amber-300 text-amber-800 hover:bg-amber-100'
            : 'border-slate-300 text-slate-700 hover:bg-slate-100'
        }`}
      >
        Enable
      </button>
    </div>
  );
}
