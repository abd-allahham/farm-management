import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';

initializeApp();

export const healthCheck = onRequest((_req, res) => {
  res.status(200).json({ ok: true, service: 'farm-management-functions' });
});

// M2/M3: vaccine <-> cow fan-out, both directions, plus recompute on edit.
// Still to come: dailyVaccinationCheck (scheduled 08:00, M6) push notifications.
export { onVaccineCreated, onVaccineUpdated, onVaccineDeleted } from './vaccines.js';
export { onCowCreated, onCowUpdated } from './cows.js';
