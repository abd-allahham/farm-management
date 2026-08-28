import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { cleanupNotificationToken, enableNotifications, isNotificationSupported, listenForForegroundMessages } from './api';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// Browser permission alone can't tell "never asked" apart from "user
// deliberately turned it off in-app" — both leave Notification.permission
// at 'granted' once it's been granted once. Without this flag, the
// self-heal-on-mount effect below would silently re-register an opted-out
// user on their very next page load.
const OPT_OUT_KEY = 'notifications-opted-out';
function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}
function setOptedOut(value: boolean): void {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, '1');
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // ignore — worst case the self-heal silently re-enables on next load
  }
}

interface Message {
  title: string;
  body: string;
}

interface NotificationsContextValue {
  supported: boolean | null;
  // Browser permission alone isn't proof a token was ever saved (see the
  // bug this fixed) — `registered` only flips true once enableNotifications
  // has actually confirmed a token made it into Firestore.
  registered: boolean;
  permission: NotificationPermission;
  busy: boolean;
  error: string | null;
  retry: () => void;
  disable: () => void;
  // Enable/disable confirmations — rendered inline, banner-style
  // (NotificationToast, despite the name — see its own comment).
  actionMessage: Message | null;
  dismissActionMessage: () => void;
  // Real foreground FCM pushes — rendered as a floating card
  // (NotificationPushToast), kept visually distinct from the confirmations
  // above since actual push content deserves more attention/reading time.
  pushMessage: Message | null;
  dismissPushMessage: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

// Single source of truth for notification state, shared by NotificationBell
// (menu + manual retry/disable), NotificationBanner (persistent warning
// while disabled), NotificationToast (enable/disable confirmations), and
// NotificationPushToast (real foreground push display) — each reading the
// same context instead of duplicating registration/listener logic.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [registered, setRegistered] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [pushMessage, setPushMessage] = useState<Message | null>(null);

  const attempt = async (silent: boolean) => {
    setBusy(true);
    if (!silent) setError(null);
    try {
      const result = await enableNotifications();
      if (typeof Notification !== 'undefined') setPermission(Notification.permission);
      if (result === 'granted') {
        setRegistered(true);
        setError(null);
        setOptedOut(false);
        // Confirm the explicit enable action (bell/banner click) — not the
        // silent self-heal check that runs on every login, which would
        // otherwise show this on every visit rather than just the toggle.
        if (!silent) {
          setActionMessage({
            title: 'Notifications enabled',
            body: "You'll be notified when a vaccination is due.",
          });
        }
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

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      await cleanupNotificationToken();
      setRegistered(false);
      setOptedOut(true);
      // No confirmation here — NotificationBanner already shows "Vaccination
      // reminders are turned off." persistently once `registered` flips
      // false, so a separate confirmation on top would just be redundant.
    } catch {
      setError('Could not disable notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Runs once per authenticated session (AppShell, which mounts this
  // provider, doesn't remount on in-app navigation — only on login/logout).
  //
  // Already granted (and not opted out): self-heal (see the bug above) —
  // requestPermission() resolves trivially with no dialog when the
  // decision is already made, so this needs no user gesture.
  //
  // Never asked ('default'): browsers require a real click to show the
  // actual permission dialog — calling requestPermission() from here (no
  // gesture) gets silently auto-resolved as if denied, without ever
  // prompting. So instead of attempting it, just leave permission as
  // 'default' — NotificationBanner shows an immediate "Enable" prompt, and
  // that click is what satisfies the gesture requirement.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    isNotificationSupported().then((ok) => {
      if (cancelled) return;
      setSupported(ok);
      if (!ok || typeof Notification === 'undefined') return;
      const current = Notification.permission;
      setPermission(current);
      if (current === 'granted' && !isOptedOut()) void attempt(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!registered) return;
    return listenForForegroundMessages((title, body) => setPushMessage({ title, body }));
  }, [registered]);

  const value: NotificationsContextValue = {
    supported,
    registered,
    permission,
    busy,
    error,
    retry: () => void attempt(false),
    disable: () => void disable(),
    actionMessage,
    dismissActionMessage: () => setActionMessage(null),
    pushMessage,
    dismissPushMessage: () => setPushMessage(null),
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
