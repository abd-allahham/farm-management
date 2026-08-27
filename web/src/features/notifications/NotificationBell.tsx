import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { triggerVaccinationCheck } from './api';
import { useNotifications } from './NotificationsContext';

interface Props {
  className?: string;
}

export function NotificationBell({ className = '' }: Props) {
  const { supported, registered, busy, error, retry, disable } = useNotifications();
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Nothing meaningful to offer where push isn't possible at all (e.g. iOS
  // Safari running in a regular tab, not installed) — don't clutter the UI.
  if (supported === false) return null;

  const handleTest = async () => {
    setTestBusy(true);
    setTestResult(null);
    try {
      const { dueCount, notified } = await triggerVaccinationCheck();
      setTestResult(
        dueCount === 0
          ? 'No vaccinations are due right now — nothing to send.'
          : `${dueCount} due — push sent to ${notified} device${notified === 1 ? '' : 's'}.`,
      );
    } catch {
      setTestResult('Test run failed. Please try again.');
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <button
          onClick={registered ? disable : retry}
          disabled={busy}
          title={registered ? 'Daily vaccination reminders enabled — tap to disable' : 'Enable daily vaccination reminders'}
          aria-label={registered ? 'Disable notifications' : 'Enable notifications'}
          aria-pressed={registered}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-default"
        >
          {registered ? (
            <BellRing size={18} className="text-green-700" aria-hidden />
          ) : (
            <Bell size={18} aria-hidden />
          )}
        </button>

        {registered && (
          <button
            onClick={() => void handleTest()}
            disabled={testBusy}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Send test
          </button>
        )}
      </div>

      {error && <p className="mt-1 max-w-52 text-xs text-red-600">{error}</p>}
      {testResult && <p className="mt-1 max-w-52 text-xs text-slate-500">{testResult}</p>}
    </div>
  );
}
