# NCERT Prep — Deployment & Configuration Guide

| | |
|---|---|
| **Scope** | Every setting needed to run NCERT Prep in production, and the order to deploy it |
| **Checked against** | The codebase on 22 September 2026 (`src/`, `functions/src/`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `amplify.yml`, `customHttp.yml`, `vite.config.ts`, `.env.example`) |
| **Stack** | React 19 + Vite SPA on **AWS Amplify Hosting** · Firebase Auth, Firestore, Storage, Cloud Functions (1st gen API, Node 22), App Check · Resend email · Google Sheet + Apps Script content sync |

> **Target architecture:** Firebase Authentication for sign-in and AWS (Amplify Gen 2, `ap-south-1`) for everything else. See `AWS_MIGRATION_PLAN.md`. This guide describes the **current** Firebase-backend setup, which stays valid until that migration is done.

**Deploy order:** Firebase project setup → rules and indexes → Cloud Functions → frontend → first admin → content → smoke test → App Check enforcement.
Rules and functions go first so the app never talks to a backend that is missing them.

---

## Contents

1. Decisions before you start
2. Accounts and services
3. Firebase console configuration
4. Frontend environment variables
5. Cloud Functions configuration
6. Firestore, indexes and Storage
7. Hosting (AWS Amplify)
8. Email (Resend)
9. Content sync (Google Sheet)
10. Deploy, step by step
11. First admin and first content
12. Smoke test
13. After launch: monitoring, backups, rollback
14. Known gaps before a public launch
15. Configuration audit log

---

## 1. Decisions before you start

| Decision | Current setting | Recommendation |
|---|---|---|
| Hosting | **AWS Amplify Hosting** (`amplify.yml`, `customHttp.yml`) for the frontend; Firebase stays the backend | Decided. Moving the backend to AWS (Cognito, DynamoDB, Lambda, SES) would be a rewrite and is not needed |
| Firestore location | Chosen when the database is created and **cannot be changed later** | `asia-south1` (Mumbai), since students are in India |
| Cloud Functions region | `us-central1` (default; no `.region()` in `functions/src`) | `asia-south1` for lower latency. See §5.4 for the three places to change |
| Production domain | Not set | Needed for Auth authorized domains, `APP_URL` and email links |
| XP and leaderboard | Written by the student's browser | Move server-side before a public launch (§14.1) |

## 2. Accounts and services

| Service | Plan | Used for |
|---|---|---|
| Firebase | **Blaze** (pay as you go). Scheduled functions and outbound email need it | Auth, Firestore, Storage, Functions, App Check |
| Google Cloud | Same project as Firebase | Secret Manager, Cloud Scheduler (created automatically) |
| AWS | Amplify Hosting (pay per build minute, storage and traffic; Route 53 optional for DNS) | Frontend hosting and CDN |
| Resend | Free tier is enough to start | Reminder and parental-consent emails |
| Domain registrar | – | Site domain and email-sending domain (SPF, DKIM, DMARC) |
| Google Sheets | The content team's Google account | Lesson catalogue (`scripts/google-apps-script-sync.js`) |

Set **budget alerts** in Google Cloud Billing and in AWS Billing (for example ₹2,000 per month each) before going live.

## 3. Firebase console configuration

### 3.1 Project and web app
1. Create the project, upgrade to Blaze.
2. Project settings → General → **Add app → Web**. Copy the six config values into the variables in §4.
3. In the repo: `firebase login`, then `firebase use --add` (alias `prod`). This creates `.firebaserc`, which is not committed yet.

### 3.2 Authentication
| Setting | Value |
|---|---|
| Sign-in method → **Google** | Enabled, with a support email |
| Sign-in method → **Email/Password** | Enabled (not "Email link"). The app sends its own verification email after sign-up |
| Settings → **Authorized domains** | Add the production domain and the Amplify domain (`<branch>.<app-id>.amplifyapp.com`). Keep `localhost` for development |
| Templates → Email address verification / Password reset | Set the sender name to "NCERT Prep" and, optionally, a custom action URL on your domain |
| User actions | Leave "Enable create (sign-up)" on |

Phone sign-in is **not** used by the current code, so leave it disabled.

### 3.3 Firestore
Create the database in **production mode** at the location chosen in §1. Rules and indexes come from the repo (§6).

### 3.4 Storage
Create the default bucket (same region family as Firestore). Rules come from `storage.rules`.

### 3.5 App Check
1. Create a **reCAPTCHA v3** key at <https://www.google.com/recaptcha/admin> for the production domain and the `amplifyapp.com` branch domain.
2. App Check → Apps → your web app → register with **reCAPTCHA v3** and that secret.
3. Put the *site key* in `VITE_RECAPTCHA_V3_SITE_KEY` (§4).
4. For local development: App Check → Manage debug tokens → add one, and put it in `VITE_APPCHECK_DEBUG_TOKEN` in `.env.local` only.
5. **Enforcement:** callables already enforce App Check in code (§5.3). Turn on enforcement for Firestore and Storage in the console **after** the smoke test (§12) passes, then run it again.

## 4. Frontend environment variables

Set these in **Amplify console → your app → Hosting → Environment variables** (per branch: `main` for production; use a separate Firebase project for any preview branch). Vite reads them at build time, so **redeploy after changing any value**. For local work copy `.env.example` to `.env.local`.

| Variable | Required | Where it comes from / value | Read in |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | **Yes** | Firebase web app config | `src/services/firebase.ts`, build guard in `vite.config.ts` |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | Firebase web app config (`<project>.firebaseapp.com`) | `firebase.ts` |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | Firebase web app config | `firebase.ts` |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Yes** | Firebase web app config | `firebase.ts` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | Firebase web app config | `firebase.ts` |
| `VITE_FIREBASE_APP_ID` | **Yes** | Firebase web app config | `firebase.ts` |
| `VITE_FIREBASE_FUNCTIONS_REGION` | Yes | Same region as the functions (`us-central1` today) | `firebase.ts` |
| `VITE_RECAPTCHA_V3_SITE_KEY` | **Yes** | App Check reCAPTCHA v3 site key. Without it App Check is off and enforced callables reject every request | `firebase.ts` |
| `VITE_GRIEVANCE_OFFICER_NAME` | **Yes** (DPDP) | Real grievance officer name | Privacy notice |
| `VITE_GRIEVANCE_EMAIL` | **Yes** (DPDP) | Monitored grievance mailbox | Privacy notice |
| `VITE_APPCHECK_DEBUG_TOKEN` | No | Local development only. **Never set in production** | `firebase.ts` (dev builds only) |
| `VITE_ALLOW_DEMO_BUILD` | No | Leave empty. `true` builds the offline demo | `vite.config.ts` |

**Build guard:** `npm run build` fails when `VITE_FIREBASE_API_KEY` is missing (unless `VITE_ALLOW_DEMO_BUILD=true`). Without it the app would silently run demo mode in production, with browser-only data and sample classmates.

These values are public by design (they ship in the JS bundle). Security comes from Firestore/Storage rules, App Check and Cloud Functions, not from hiding them.

## 5. Cloud Functions configuration

### 5.1 Runtime
| Setting | Value | Where |
|---|---|---|
| Node.js | **22** | `functions/package.json` → `engines.node` |
| Build | `tsc` to `functions/lib`, run automatically by `predeploy` | `firebase.json` |
| SDKs | `firebase-functions` ^5, `firebase-admin` ^12, `resend` ^3 | `functions/package.json` |

### 5.2 Secrets and parameters
| Name | Type | Value | Used by |
|---|---|---|---|
| `RESEND_API_KEY` | Secret (Secret Manager) | Resend API key (§8) | `reminderJob`, `requestParentalConsent` |
| `UNSUBSCRIBE_SECRET` | Secret | Long random string: `openssl rand -base64 48`. Changing it invalidates old unsubscribe links | `reminderJob`, `unsubscribe` |
| `APP_URL` | Parameter (string) | Production URL without a trailing slash, e.g. `https://ncertprep.in`. The code default `https://ncertprep.vercel.app` is outdated, so always set this | Links in reminder and consent emails |
| `EMAIL_FROM` | Parameter (string) | `NCERT Prep <revision@your-verified-domain>`. The default `@example.com` is rejected by Resend | All emails |

```bash
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set UNSUBSCRIBE_SECRET
```
`APP_URL` and `EMAIL_FROM` are asked for on the first `firebase deploy --only functions` and saved to `functions/.env.<project-id>`. Commit that file (it contains no secrets) or set the values again on each machine.

### 5.3 Functions deployed
| Function | Trigger | App Check | Secrets | Purpose |
|---|---|---|---|---|
| `recordAdultConsent` | Callable | Enforced | – | Records DPDP consent for adults |
| `requestParentalConsent` | Callable | Enforced | `RESEND_API_KEY` | Emails the parent an approval link |
| `getParentalConsentRequest` | Callable | Not enforced (parent may open the link on any device) | – | Shows the request to the parent |
| `decideParentalConsent` | Callable | Enforced | – | Parent approves or declines. Decline erases the child's data |
| `purgeUnconsentedChildren` | Schedule `30 3 * * *` Asia/Kolkata | – | – | Erases child accounts whose consent request expired |
| `askDoubt` | Callable | Enforced | – | Creates a doubt (10 per student per day) |
| `submitFeedback` | Callable | Enforced | – | Stores feedback (5 per student per hour) |
| `deleteAccount` | Callable | Enforced | – | Self-service deletion (sign-in within 5 minutes required) |
| `trackVisit` | Callable | Enforced | – | Anonymous visitor counter |
| `countRegistration` | Auth user created | – | – | Registration counter |
| `countLessonProgress` | Firestore write `users/{uid}/user_progress/{videoId}` | – | – | Lesson-completion counter |
| `reminderJob` | Schedule `0 * * * *` Asia/Kolkata, 540 s timeout | – | `RESEND_API_KEY`, `UNSUBSCRIBE_SECRET` | Hourly reminder emails |
| `unsubscribe` | HTTPS | – | `UNSUBSCRIBE_SECRET` | One-click unsubscribe link |

Cloud Scheduler jobs for the two scheduled functions are created automatically on deploy.

### 5.4 Changing the functions region
All three must match:
1. Add `.region('asia-south1')` to every function in `functions/src/*.ts`.
2. `REGION` in `functions/src/reminders.ts` (it builds the unsubscribe URL).
3. `VITE_FIREBASE_FUNCTIONS_REGION` in Amplify, then redeploy the frontend.

Deploy the new region first, switch the frontend, then delete the old-region functions.

## 6. Firestore, indexes and Storage

### 6.1 Collections and who writes them (`firestore.rules`)
| Collection | Written by | Read by |
|---|---|---|
| `videos` | Admins, Sheet sync | Everyone |
| `classes`, `subjects`, `chapters` | Admins | Everyone |
| `notes` | Admins | Published: everyone; drafts: admins |
| `settings` (announcement, spotlights, access policy) | Admins | Everyone |
| `users/{uid}` | Owner (not `role` or `consent`), admins | Owner, admins |
| `users/{uid}/user_progress` | Owner after consent, admins | Owner, admins |
| `users/{uid}/xp_transactions` | Owner, admins (see §14.1) | Owner, admins |
| `leaderboard/{uid}` | Owner (see §14.1) | Any signed-in user |
| `doubts` | `askDoubt` function; owner may mark read/close; admins reply | Owner, admins |
| `feedback` | `submitFeedback` function; admins review | Admins |
| `stats`, `stats_daily`, `visitors`, `consent_requests`, `rate_limits` | Functions only | Admins (stats) / nobody |

### 6.2 Composite indexes (`firestore.indexes.json`)
| Collection | Fields | Needed by |
|---|---|---|
| `users` | `reminders_enabled` ↑, `reminder_frequency` ↑ | `reminderJob` |
| `doubts` | `userId` ↑, `created_at` ↓ | Student "My doubts" live list |
| `consent_requests` | `status` ↑, `expires_at` ↑ | `purgeUnconsentedChildren` |

All other queries use single-field indexes Firestore creates automatically. If a query fails in production with "requires an index", the error contains a link that creates it. Add it to `firestore.indexes.json` afterwards.

### 6.3 Storage (`storage.rules`)
Only `notes/{chapterKey}/{file}`: public read (by URL), admin upload of PDF/PNG/JPEG/WEBP under 20 MB. Everything else is denied.

## 7. Hosting (AWS Amplify)

### 7.1 Create the app
1. AWS console → **Amplify** → *Create new app* → connect the Git repository and the production branch (`main`).
2. Amplify detects `amplify.yml` in the repo root. Keep it; do not replace it with the auto-generated spec.
3. Add the environment variables from §4, then *Save and deploy*.

| Setting | Value | Where |
|---|---|---|
| Build spec | `npm ci` → `npm test` → `npm run build`; output `dist`; `node_modules` cached | `amplify.yml` |
| Node.js | 22 (`nvm install 22 && nvm use 22` in `preBuild`) | `amplify.yml` |
| Response headers | HSTS, `nosniff`, `X-Frame-Options: DENY`, referrer and permissions policies on every path; `/assets/**` cached for a year (hashed names); `/index.html` `no-cache` | `customHttp.yml` |
| Environment variables | §4 | Amplify console |

A failing test or the missing-keys build guard (§4) stops the deploy, so a broken build never goes live.

### 7.2 Single-page-app rewrite (console, one time)
Amplify cannot read rewrites from the repo. Add this in **Hosting → Rewrites and redirects → Manage → Open text editor**:

```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|xml)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200",
    "condition": null
  }
]
```

Without it, opening `/app`, `/browse` or a lesson link directly returns a 404.

### 7.3 Custom domain
Hosting → **Custom domains** → add the domain (Route 53 is automatic; for another registrar add the CNAME records Amplify shows). Amplify issues the TLS certificate. Then add the domain to Firebase Auth authorized domains (§3.2), the reCAPTCHA key (§3.5) and `APP_URL` (§5.2).

Also shipped with the build: `public/robots.txt` (keeps `/app`, `/admin`, `/parent-consent` out of search), favicon and logo `public/logo-mark.svg`, Open Graph tags in `index.html`.

## 8. Email (Resend)

1. Resend → Domains → add your sending domain (e.g. `mail.ncertprep.in`) and create the DNS records it shows: **SPF** (TXT), **DKIM** (TXT/CNAME) and a **DMARC** TXT record (start with `v=DMARC1; p=none; rua=mailto:dmarc@your-domain`).
2. Wait for "Verified", then create an API key with sending access only. Store it as `RESEND_API_KEY` (§5.2).
3. Set `EMAIL_FROM` to an address on that domain.

Emails sent: reminder emails (hourly job, with `List-Unsubscribe` headers) and parental-consent requests.

## 9. Content sync (Google Sheet)

1. Google Cloud → IAM → create a service account with **only** the *Cloud Datastore User* role. Create a JSON key.
2. In the content sheet: Extensions → Apps Script → paste `scripts/google-apps-script-sync.js`.
3. Project Settings → **Script Properties**:

| Property | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | Project id |
| `SA_CLIENT_EMAIL` | Service account email |
| `SA_PRIVATE_KEY` | The `private_key` value from the JSON key |
| `SHEET_NAME` | Optional: the tab to read (default: first tab) |

4. Reload the sheet → menu **NCERT Prep → Sync videos to Firestore**.

The key lives only in Script Properties. Never commit it, and delete the downloaded JSON file afterwards. The sheet contract (columns) is in `docs/PROJECT_SPECIFICATION.md` §C10.

## 10. Deploy, step by step

```bash
# 0. Clean install and checks
npm ci && npm --prefix functions ci
npm test
npm run build                      # needs the §4 variables in .env.production.local or the shell
npm --prefix functions run build

# 1. Select the project
firebase use prod

# 2. Security rules and indexes first
firebase deploy --only firestore:rules,firestore:indexes,storage

# 3. Secrets, then functions (answers APP_URL and EMAIL_FROM prompts on first run)
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set UNSUBSCRIBE_SECRET
firebase deploy --only functions

# 4. Frontend
git push origin main               # Amplify builds and deploys the connected branch automatically
```

Indexes can take a few minutes to build. The doubts list shows an index error until the `doubts` index finishes.

## 11. First admin and first content

1. Open the production site and sign in with the educator's Google account. Accept the consent notice.
2. Firebase Console → Firestore → `users/{uid}` → add field `role` = `"admin"` (string). Roles can only be set here, never from the app.
3. Reload the site. The admin console appears at `/app`.
4. Run the Sheet sync (§9), then Admin console → **Data & Sync → Create missing records**. There is **no bundled sample catalogue**: until the first sync the site shows "Lessons are being added" and students see "Lessons for your class are coming soon".
5. Admin console → **Profile & settings** → set the name students will see on doubt replies.

## 12. Smoke test (production URL, real accounts)

- [ ] Landing page: logo, favicon, live counters show real numbers, "Try demo" opens the visitor page
- [ ] Google sign-in → adult consent → onboarding → home shows only the chosen class, in the right age theme
- [ ] Email sign-up → verification email arrives → sign-in works
- [ ] Under-18 sign-up → parent email arrives → approve link unlocks the account; decline erases it
- [ ] Lesson plays, completes, progress and XP update; the leaderboard shows the student
- [ ] Ask a doubt → admin replies → the student's bell and Doubts page show it
- [ ] Feedback submits; the admin sees it
- [ ] Reminders on → at the chosen hour `reminderJob` logs a send → email arrives → unsubscribe link works
- [ ] Admin: publish an announcement, hide a lesson, upload a note PDF
- [ ] Profile → Delete account → user doc, progress, XP, doubts, feedback and leaderboard entry are gone
- [ ] Turn on App Check enforcement for Firestore and Storage (§3.5), then repeat sign-in, lesson and doubt

## 13. After launch: monitoring, backups, rollback

| Area | Set up |
|---|---|
| Function errors | Cloud Logging → create an alert on `severity>=ERROR` for the functions |
| Scheduled jobs | Alert if `reminderJob` or `purgeUnconsentedChildren` fails |
| Backups | Firestore → enable **point-in-time recovery** and a daily **scheduled backup** (NFR-12) |
| Costs | Budget alert (§2); check Firestore reads weekly for the first month |
| Uptime | Any external uptime check on the production URL |

**Rollback:**
- Frontend: Amplify → your app → the `main` branch → *Deployments* → pick the previous successful build → *Redeploy this version*.
- Functions: check out the previous commit, `firebase deploy --only functions`.
- Rules: check out the previous `firestore.rules` / `storage.rules`, redeploy.
- Data: restore from point-in-time recovery or the daily backup.

## 14. Known gaps before a public launch

1. **XP and leaderboard are client-written.** Rules let a student write their own `xp_transactions` and `leaderboard/{uid}`, so scores can be faked from the browser, and any signed-in user can read every class's leaderboard (children's names). Move XP to Cloud Functions and limit reads to the student's own class (tracked as a separate task).
2. **Functions dependencies:** `npm --prefix functions audit` reports 9 moderate advisories (transitive `uuid`). Upgrade `firebase-admin` when a fix is released.
3. **No Content-Security-Policy yet.** Add one in report-only mode first; it must allow YouTube (nocookie), Firebase, Google Fonts and reCAPTCHA.
4. **Bundle size:** the main JS chunk is about 585 kB (170 kB gzip) after removing the sample catalogue. Route-level code splitting would cut it further.
5. **Brand:** "NCERT" is used in the name and logo. Confirm trademark clearance before launch.
6. **Uncommitted work:** most of the current code is not committed to git yet. Commit and tag the release before deploying so rollback (§13) has something to roll back to.

## 15. Configuration audit log (22 September 2026)

Checked the previous runbook against the code and fixed:

| Finding | Change |
|---|---|
| Account deletion left the student's **leaderboard entry** (name, avatar, XP visible to classmates) and their **feedback** (includes email) behind. This breaks the DPDP erasure promise and also affected declined or expired parental consent | `eraseUserData` in `functions/src/account.ts` now also deletes `leaderboard/{uid}` and the user's `feedback`. XP history was already covered by the recursive delete of `users/{uid}` |
| `.env.example` had a stray "Firebase Analytics" heading and did not list `VITE_ALLOW_DEMO_BUILD` | Cleaned up and documented |
| Runbook listed only 5 frontend variables, no function inventory, no index list, no Auth/App Check/Storage details | This guide covers all 12 variables, 13 functions, 3 indexes, 2 secrets and 2 parameters |
| Phone sign-in was implied in older docs | The code uses Google and Email/Password only (§3.2) |
| **Sample data could reach production.** In live mode the catalogue fell back to a bundled 1,055-lesson sample whenever Firestore was empty or a fetch failed, and Data & Sync had a "Seed sample curriculum" button that wrote those samples into the production database | Removed all seeded and dummy data: `src/data/curriculumData.ts`, `seedSyllabus.ts`, `chapterNotes.ts`, sample feedback, sample dashboard announcement and spotlight, sample leaderboard classmates, and the seed button. The catalogue now comes only from Firestore; a successful empty answer also clears any stale cached catalogue, and the cache is used only when a fetch fails |
| Hosting moved to AWS Amplify | Added `amplify.yml` and `customHttp.yml`; removed `vercel.json` and `public/_redirects`; §7, §10 and §13 updated |
