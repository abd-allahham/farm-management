import { deleteDoc, doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import { httpsCallable, type Functions } from 'firebase/functions';
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app, auth, db, functions } from '../../lib/firebase';

// Separate scope from the Workbox PWA service worker at "/" — see
// public/firebase-messaging-sw.js for why they can't share one.
const SW_SCOPE = '/fcm-push/';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function requireDb(): Firestore {
  if (!db) throw new Error('Firestore is not configured.');
  return db;
}

function requireFunctions(): Functions {
  if (!functions) throw new Error('Cloud Functions are not configured.');
  return functions;
}

export async function isNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return false;
  }
  return isSupported();
}

export type EnableNotificationsResult = 'granted' | 'denied' | 'unsupported';

export async function enableNotifications(): Promise<EnableNotificationsResult> {
  if (!(await isNotificationSupported())) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: SW_SCOPE,
  });

  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) return 'denied';

  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error('Not signed in.');

  await setDoc(doc(requireDb(), 'fcmTokens', token), {
    uid,
    createdAt: serverTimestamp(),
  });

  return 'granted';
}

// Called from AuthContext.signOut, before the actual Firebase sign-out —
// deleting the Firestore doc needs an authenticated request. Best-effort:
// a failure here shouldn't block logout, so callers should swallow errors.
export async function cleanupNotificationToken(): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  if (!(await isNotificationSupported())) return;

  const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (!registration) return;

  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) return;

  await deleteDoc(doc(requireDb(), 'fcmTokens', token));
  await deleteToken(messaging);
}

// FCM delivers a push to the page's onMessage handler instead of the
// service worker's background handler whenever the tab is in the
// foreground — which is exactly the case right after tapping "Send test"
// from inside the app. Without this, that push arrives and is silently
// dropped: the server-side send succeeds, nothing visible happens.
export function listenForForegroundMessages(
  onNotification: (title: string, body: string) => void,
): () => void {
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    onNotification(payload.notification?.title ?? 'Farm Management', payload.notification?.body ?? '');
  });
}

// Runs the same scan the daily 08:00 UTC schedule does, right now — lets
// the app confirm the whole pipeline (query -> push -> device) works
// without waiting for the actual scheduled time.
export async function triggerVaccinationCheck(): Promise<{ dueCount: number; notified: number }> {
  const call = httpsCallable<undefined, { dueCount: number; notified: number }>(
    requireFunctions(),
    'triggerVaccinationCheck',
  );
  const result = await call();
  return result.data;
}
