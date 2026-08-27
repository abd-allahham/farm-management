import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';

initializeApp();

export const healthCheck = onRequest((_req, res) => {
  res.status(200).json({ ok: true, service: 'farm-management-functions' });
});

// M2: vaccine -> cow fan-out (background trigger; nothing in the UI is
// waiting on this, so trigger latency doesn't matter here).
export { onVaccineCreated, onVaccineUpdated, onVaccineDeleted } from './vaccines.js';

// M3: cow create/update, done as callables (not triggers) so the client
// awaits the vaccination fan-out completing in the same request — see
// cows.ts for why.
// Still to come: dailyVaccinationCheck (scheduled 08:00, M6) push notifications.
export { createCow, updateCow } from './cows.js';
