import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { enableNotifications, isNotificationSupported, triggerVaccinationCheck } from './api';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

interface Props {
  className?: string;
}

export function NotificationBell({ className = '' }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<NotificationPermission>('default');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    isNotificationSupported().then(setSupported);
    if (typeof Notification !== 'undefined') setStatus(Notification.permission);
  }, []);

  // Nothing meaningful to offer where push isn't possible at all (e.g. iOS
  // Safari running in a regular tab, not installed) — don't clutter the UI.
  if (supported === false) return null;

  const handleClick = async () => {
    if (status === 'granted' || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await enableNotifications();
      if (result === 'granted') {
        setStatus('granted');
      } else if (result === 'denied') {
        setError('Notifications were blocked. Check your browser/OS notification settings for this app.');
      } else {
        setError(
          isIos()
            ? 'Install the app to your home screen first (see "Download the app" on the login screen), then try again from there.'
            : "Notifications aren't supported in this browser.",
        );
      }
    } catch {
      setError('Could not enable notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setError(null);
    setTestResult(null);
    try {
      const { dueCount, notified } = await triggerVaccinationCheck();
      setTestResult(
        dueCount === 0
          ? 'No vaccinations are due right now — nothing to send.'
          : `${dueCount} due — push sent to ${notified} device${notified === 1 ? '' : 's'}.`,
      );
    } catch {
      setError('Test run failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => void handleClick()}
          disabled={busy || status === 'granted'}
          title={status === 'granted' ? 'Daily vaccination reminders enabled' : 'Enable daily vaccination reminders'}
          aria-label={status === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-default disabled:hover:bg-transparent"
        >
          {status === 'granted' ? (
            <BellRing size={18} className="text-green-700" aria-hidden />
          ) : (
            <Bell size={18} aria-hidden />
          )}
        </button>

        {status === 'granted' && (
          <button
            onClick={() => void handleTest()}
            disabled={busy}
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
