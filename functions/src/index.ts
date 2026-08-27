import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';

initializeApp();

// Placeholder so `firebase deploy --only functions` has something to ship
// from M0 onward. Replace/extend starting in M2:
//   - onVaccineCreated (Firestore trigger): fan vaccine out to all cows
//   - onCowCreated (Firestore trigger): seed vaccine list for the new cow
//   - dailyVaccinationCheck (scheduled, 08:00): push FCM notifications (M6)
export const healthCheck = onRequest((_req, res) => {
  res.status(200).json({ ok: true, service: 'farm-management-functions' });
});
