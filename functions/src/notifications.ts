import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const REGION = 'europe-central2';

// Scans every cow's vaccinations subcollection (via collection group) for
// still-pending entries whose dueDate has arrived, and pushes one summary
// notification per registered device if any are found. Shared by the daily
// schedule and the manual test-trigger callable below.
async function checkDueVaccinationsAndNotify(): Promise<{ dueCount: number; notified: number }> {
  const db = getFirestore();

  const dueSnap = await db
    .collectionGroup('vaccinations')
    .where('status', '==', 'pending')
    .where('dueDate', '<=', Date.now())
    .get();

  if (dueSnap.empty) {
    return { dueCount: 0, notified: 0 };
  }

  const tokensSnap = await db.collection('fcmTokens').get();
  if (tokensSnap.empty) {
    return { dueCount: dueSnap.size, notified: 0 };
  }

  const tokens = tokensSnap.docs.map((d) => d.id);
  const plural = dueSnap.size === 1 ? '' : 's';
  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: 'Vaccination reminders',
      body: `${dueSnap.size} vaccination${plural} due or overdue. Open the app to review.`,
    },
  });

  // Clean up tokens the device/browser has since revoked — otherwise every
  // future run keeps paying the (small) cost of a doomed send.
  const staleTokens = response.responses
    .map((r, i) => (!r.success && r.error?.code === 'messaging/registration-token-not-registered' ? tokens[i] : null))
    .filter((t): t is string => t !== null);
  await Promise.all(staleTokens.map((t) => db.collection('fcmTokens').doc(t).delete()));

  return { dueCount: dueSnap.size, notified: response.successCount };
}

// Daily 08:00 UTC — adjust the timeZone below if the farm is elsewhere.
export const dailyVaccinationCheck = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'UTC', region: REGION },
  async () => {
    const result = await checkDueVaccinationsAndNotify();
    console.log(`dailyVaccinationCheck: ${result.dueCount} due, ${result.notified} devices notified`);
  },
);

// Lets the app trigger a real run on demand (e.g. right after enabling
// notifications) instead of waiting until 08:00 UTC to confirm it works.
export const triggerVaccinationCheck = onCall({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  return checkDueVaccinationsAndNotify();
});
