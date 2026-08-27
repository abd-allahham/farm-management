import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';

initializeApp();

export const healthCheck = onRequest((_req, res) => {
  res.status(200).json({ ok: true, service: 'farm-management-functions' });
});

// M2: vaccine <-> cow fan-out (create/update/delete).
// Still to come:
//   - onCowCreated (Firestore trigger, M3): seed vaccine list for a new cow
//   - dailyVaccinationCheck (scheduled 08:00, M6): push FCM notifications
export { onVaccineCreated, onVaccineUpdated, onVaccineDeleted } from './vaccines.js';
