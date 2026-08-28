import { deleteDoc, doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app, auth, db } from '../../lib/firebase';

// Separate scope from the Workbox PWA service worker at "/" — see
// public/firebase-messaging-sw.js for why they can't share one.
const SW_SCOPE = '/fcm-push/';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function requireDb(): Firestore {
  if (!db) throw new Error('Firestore is not configured.');
  return db;
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
// foreground. Without this, a push arriving while the app is open would be
// silently dropped: the server-side send succeeds, nothing visible happens.
export function listenForForegroundMessages(
  onNotification: (title: string, body: string) => void,
): () => void {
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    onNotification(payload.notification?.title ?? 'Farm Management', payload.notification?.body ?? '');
  });
}
