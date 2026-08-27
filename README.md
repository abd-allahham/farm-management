# Farm Management

Progressive web app for managing farm yards, cattle, and vaccination schedules.

## Structure

```
web/         React + TypeScript + Vite PWA (frontend)
functions/   Cloud Functions (TypeScript) — triggers & scheduled jobs
firebase.json, .firebaserc, firestore.rules, firestore.indexes.json
```

## Stack

- React + TypeScript + Vite, packaged as an installable PWA (`vite-plugin-pwa`)
- Tailwind CSS
- Firebase: Authentication (Google), Firestore, Cloud Functions, Hosting, Cloud Messaging

## One-time setup

### 1. Create the Firebase project (console)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Sign-in method** → enable **Google**.
3. **Build → Firestore Database → Create database** (production mode, pick a region).
4. Add a **Web app** (`</>` icon on the project overview page) → copy the config values shown.
5. **Project settings → Cloud Messaging** → generate a **Web Push certificate** (VAPID key) — needed starting at the notifications milestone.
6. Upgrade the project to the **Blaze (pay-as-you-go)** plan — required for Cloud Functions (scheduled functions and outbound calls don't work on the free Spark plan). Cost stays effectively $0 at this scale.

### 2. Local setup

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project, alias it "default"
```

```bash
cp web/.env.example web/.env
# fill web/.env with the values from step 1.4
```

```bash
cd web && npm install
cd ../functions && npm install
```

### 3. Run locally

```bash
cd web && npm run dev          # http://localhost:5173
```

Or against the Firebase emulators (Auth/Firestore/Functions/Hosting all local):

```bash
firebase emulators:start
```

## Deploying a milestone

Each milestone is deployed to its own **Hosting preview channel** first, so it can be tested on a real device via a shareable URL before going live:

```bash
cd web && npm run build
cd ..
firebase hosting:channel:deploy <milestone-name>   # e.g. m0-auth-shell
```

Once verified, promote to production:

```bash
firebase deploy --only hosting
```

Cloud Functions deploy separately once they exist (from M2 onward):

```bash
firebase deploy --only functions
```

## Milestones

| # | Milestone | Status |
|---|---|---|
| M0 | Skeleton PWA + Google Auth | ✅ scaffolded |
| M1 | Yards CRUD | planned |
| M2 | Vaccines CRUD + cow fan-out function | planned |
| M3 | Cows CRUD (manual barcode) + yard assign/move | planned |
| M4 | Barcode camera scanning | planned |
| M5 | Vaccination workflow + cow lifecycle (slaughter/delete) | planned |
| M6 | Scheduled push notifications (daily 08:00) | planned |
| M7 | Reports/stats + offline + cross-device polish | planned |

## Notes

- Single farm, single/testing user for now — Firestore rules currently deny all reads/writes; M1 opens them to `request.auth != null`. A `role` field and per-farm scoping can be layered on later without a data model rewrite.
- "Download the app" = installable PWA (Add to Home Screen), not an App Store/Play Store build.
- iOS push notifications only work once the PWA has been added to the home screen (iOS 16.4+) — Safari-tab notifications aren't supported.
