import { useEffect, useRef, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { triggerVaccinationCheck } from './api';
import { useNotifications } from './NotificationsContext';

interface Props {
  className?: string;
}

export function NotificationBell({ className = '' }: Props) {
  const { supported, registered, busy, error, retry, disable } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Nothing meaningful to offer where push isn't possible at all (e.g. iOS
  // Safari running in a regular tab, not installed) — don't clutter the UI.
  if (supported === false) return null;

  const handleToggle = () => {
    setMenuOpen(false);
    if (registered) disable();
    else retry();
  };

  const handleTest = async () => {
    setMenuOpen(false);
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
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        title="Notification settings"
        aria-label="Notification settings"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
        {registered ? (
          <BellRing size={18} className="text-green-700" aria-hidden />
        ) : (
          <Bell size={18} aria-hidden />
        )}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            role="menuitem"
            onClick={handleToggle}
            disabled={busy}
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {registered ? 'Disable notifications' : 'Enable notifications'}
          </button>
          {registered && (
            <button
              role="menuitem"
              onClick={() => void handleTest()}
              disabled={testBusy}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Send test
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1 max-w-52 text-xs text-red-600">{error}</p>}
      {testResult && <p className="mt-1 max-w-52 text-xs text-slate-500">{testResult}</p>}
    </div>
  );
}
