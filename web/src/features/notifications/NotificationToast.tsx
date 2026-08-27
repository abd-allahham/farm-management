import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationsContext';

const AUTO_DISMISS_MS = 2500;

// Same visual language as NotificationBanner (border/bg/icon/text), rendered
// inline in the content flow rather than a floating overlay card — just
// without the Enable button, since this is a transient confirmation that
// dismisses itself rather than something needing an action.
export function NotificationToast() {
  const { received, dismissReceived } = useNotifications();

  useEffect(() => {
    if (!received) return;
    const timer = setTimeout(dismissReceived, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [received, dismissReceived]);

  if (!received) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      <Bell size={16} className="shrink-0" aria-hidden />
      <span>
        {received.title}
        {received.body && ` ${received.body}`}
      </span>
    </div>
  );
}
