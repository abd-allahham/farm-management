import { useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { useNotifications } from './NotificationsContext';

const AUTO_DISMISS_MS = 6000;

export function NotificationToast() {
  const { received, dismissReceived } = useNotifications();

  useEffect(() => {
    if (!received) return;
    const timer = setTimeout(dismissReceived, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [received, dismissReceived]);

  if (!received) return null;

  return (
    // Bottom on mobile (clears the fixed bottom tab bar), bottom-right on
    // desktop — a floating card instead of squeezed text next to the bell.
    <div
      role="status"
      className="animate-toast-in fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:inset-x-auto sm:bottom-4 sm:right-4 sm:mx-0"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-green-100 p-1.5 text-green-700">
          <BellRing size={16} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{received.title}</p>
          {received.body && <p className="mt-0.5 text-sm text-slate-600">{received.body}</p>}
        </div>
        <button
          onClick={dismissReceived}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
