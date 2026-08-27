import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Populated from web/.env (copy web/.env.example -> web/.env and fill in
// the values from Firebase console > Project settings > General > Your apps).
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

if (!isFirebaseConfigured) {
  // Loud, early failure instead of a cryptic Firebase SDK error later.
  // eslint-disable-next-line no-console
  console.error(
    'Missing Firebase config. Copy web/.env.example to web/.env and fill in ' +
      'your Firebase project values (Project settings > General > Your apps).',
  );
}

export const app = initializeApp(firebaseConfig);
// getAuth()/getFirestore() throw synchronously on an invalid/empty API key,
// which would otherwise crash the whole app before it can render a helpful
// "not configured yet" screen. Only initialize them once real config exists.
export const auth = isFirebaseConfigured ? getAuth(app) : null;
export const db = isFirebaseConfigured ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
