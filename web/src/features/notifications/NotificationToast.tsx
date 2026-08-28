import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationsContext';

const AUTO_DISMISS_MS = 2500;

// Enable/disable confirmations only — real foreground pushes use
// NotificationPushToast instead (floating card, more reading time).
// Same visual language as NotificationBanner (border/bg/icon/text),
// rendered inline in the content flow rather than a floating overlay card —
// no button, since this is a transient confirmation that dismisses itself.
export function NotificationToast() {
  const { actionMessage, dismissActionMessage } = useNotifications();

  useEffect(() => {
    if (!actionMessage) return;
    const timer = setTimeout(dismissActionMessage, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [actionMessage, dismissActionMessage]);

  if (!actionMessage) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      <Bell size={16} className="shrink-0" aria-hidden />
      <span>
        {actionMessage.title}
        {actionMessage.body && ` ${actionMessage.body}`}
      </span>
    </div>
  );
}
