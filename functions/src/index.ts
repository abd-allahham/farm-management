import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';

initializeApp();

export const healthCheck = onRequest((_req, res) => {
  res.status(200).json({ ok: true, service: 'farm-management-functions' });
});

// M2: vaccine -> cow fan-out (background trigger; nothing in the UI is
// waiting on this, so trigger latency doesn't matter here).
export { onVaccineCreated, onVaccineUpdated, onVaccineDeleted } from './vaccines.js';

// M3/M5: cow create/update/delete, done as callables (not direct client
// writes) — create/update need the vaccination fan-out to run server-side
// in the same request, delete needs a recursive subcollection delete the
// client can't do itself. See cows.ts for details.
// Still to come: dailyVaccinationCheck (scheduled 08:00, M6) push notifications.
export { createCow, updateCow, deleteCow } from './cows.js';
