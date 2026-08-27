import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import {
  enableNotifications,
  isNotificationSupported,
  listenForForegroundMessages,
  triggerVaccinationCheck,
} from './api';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

interface Props {
  className?: string;
}

export function NotificationBell({ className = '' }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  // Browser-level permission is NOT proof a token was ever saved — e.g. if
  // getToken()/setDoc failed after the permission prompt, Notification.
  // permission stays 'granted' forever with nothing actually registered.
  // `registered` only flips true once enableNotifications() has actually
  // confirmed a token made it into Firestore.
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [received, setReceived] = useState<{ title: string; body: string } | null>(null);

  const attemptRegister = async (silent: boolean) => {
    setBusy(true);
    if (!silent) setError(null);
    try {
      const result = await enableNotifications();
      if (result === 'granted') {
        setRegistered(true);
        setError(null);
      } else if (!silent) {
        setError(
          result === 'denied'
            ? 'Notifications were blocked. Check your browser/OS notification settings for this app.'
            : isIos()
              ? 'Install the app to your home screen first (see "Download the app" on the login screen), then try again from there.'
              : "Notifications aren't supported in this browser.",
        );
      }
    } catch {
      if (!silent) setError('Could not enable notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    isNotificationSupported().then((ok) => {
      setSupported(ok);
      // Self-heal: permission already granted from a previous visit, but we
      // can't tell from here whether a token actually made it to Firestore
      // that time — silently redo it (idempotent, no prompt shown again).
      if (ok && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        void attemptRegister(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!registered) return;
    return listenForForegroundMessages((title, body) => {
      setReceived({ title, body });
      // Best-effort: some browsers/OSes suppress this while the tab has
      // focus. The in-app banner below is the reliable fallback.
      try {
        new Notification(title, { body, icon: '/pwa-192.png' });
      } catch {
        // ignore
      }
    });
  }, [registered]);

  // Nothing meaningful to offer where push isn't possible at all (e.g. iOS
  // Safari running in a regular tab, not installed) — don't clutter the UI.
  if (supported === false) return null;

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
          onClick={() => void attemptRegister(false)}
          disabled={busy}
          title={registered ? 'Daily vaccination reminders enabled (tap to re-check)' : 'Enable daily vaccination reminders'}
          aria-label={registered ? 'Notifications enabled' : 'Enable notifications'}
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
            disabled={busy}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Send test
          </button>
        )}
      </div>

      {error && <p className="mt-1 max-w-52 text-xs text-red-600">{error}</p>}
      {testResult && <p className="mt-1 max-w-52 text-xs text-slate-500">{testResult}</p>}
      {received && (
        <p className="mt-1 max-w-52 rounded-lg bg-green-50 px-2 py-1.5 text-xs text-green-800">
          🔔 <span className="font-medium">{received.title}</span>
          {received.body && <>: {received.body}</>}
        </p>
      )}
    </div>
  );
}
