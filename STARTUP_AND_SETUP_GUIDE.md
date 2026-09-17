# NCERT Prep — Startup & Complete Setup Guide

> **Project:** NCERT Prep (Adaptive Video-Revision Web App for Class 1 to 12)  
> **Companion Documents:** [FRD.md](file:///D:/Ncert-prep-app/FRD.md) • [SRS.md](file:///D:/Ncert-prep-app/SRS.md)  
> **Last Updated:** 17 September 2026

---

## Table of Contents
1. [Quickstart (Zero-Config Demo Mode)](#1-quickstart-zero-config-demo-mode)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Commands](#3-local-development-commands)
4. [Firebase Backend Setup](#4-firebase-backend-setup)
   - [4.1 Create Firebase Project](#41-create-firebase-project)
   - [4.2 Configure Firebase Authentication](#42-configure-firebase-authentication)
   - [4.3 Configure Cloud Firestore](#43-configure-cloud-firestore)
   - [4.4 Deploy Security Rules & Indexes](#44-deploy-security-rules--indexes)
   - [4.5 Configure Local Frontend Environment Variables](#45-configure-local-frontend-environment-variables)
5. [Firebase Cloud Functions Setup](#5-firebase-cloud-functions-setup)
   - [5.1 Environment Configuration & Secrets](#51-environment-configuration--secrets)
   - [5.2 Deploying Cloud Functions](#52-deploying-cloud-functions)
   - [5.3 Verifying IST Scheduled Jobs](#53-verifying-ist-scheduled-jobs)
6. [Google Sheets Content Ingestion Sync](#6-google-sheets-content-ingestion-sync)
   - [6.1 Google Sheet Format](#61-google-sheet-format)
   - [6.2 Apps Script Deployment](#62-apps-script-deployment)
7. [Production Deployment (Vercel / Netlify)](#7-production-deployment-vercel--netlify)
8. [Architecture Constraints & Edge Case Checklist](#8-architecture-constraints--edge-case-checklist)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Quickstart (Zero-Config Demo Mode)

You can launch and evaluate ChapterPlay immediately without configuring live Firebase cloud accounts. The app comes equipped with an offline fallback engine and curated NCERT curriculum sample dataset covering Classes 1 to 12.

```bash
# 1. Navigate to the project directory
cd D:/Ncert-prep-app

# 2. Start the Vite development server
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

### What works in Demo Mode out of the box:
- **Interactive Navigation:** Class → Subject → Chapter exploration across Grade 1–12.
- **Distraction-Free Video Playback:** Privacy-enhanced YouTube player (`youtube-nocookie.com`) with related-video clutters stripped.
- **Client-Side Fuzzy Search:** Press `/` or tap the search bar to search topics, chapters, and subjects.
- **One-Click Student Demo Sign-In:** Test personalized sessions, progress checkmarks, and favorite pinning.
- **Deactivated Video Edge Case:** Live demonstration of how archived videos (`isActive = false`) render as "No longer available" without breaking user progress totals.
- **Rate-Limited Feedback:** Test private educator feedback with automatic 5/hour rate cap.

---

## 2. Prerequisites

Before setting up the live production environment, ensure you have:
- **Node.js:** v20.x or higher (tested on Node v24)
- **npm:** v10.x or higher
- **Firebase CLI:** Installed globally via `npm install -g firebase-tools`
- **Google Account:** For Firebase Console and Google Sheets content sync

---

## 3. Local Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server on `http://localhost:3000` |
| `npm test` | Runs the automated test suite (`test/app.test.mjs`) using native Node test runner |
| `npm run build` | Compiles TypeScript and builds optimized production bundles into `dist/` |
| `npm run preview` | Serves the production build locally for pre-release verification |

---

## 4. Firebase Backend Setup

When you are ready to connect ChapterPlay to live cloud infrastructure, follow these steps:

### 4.1 Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter a project name (e.g., `chapterplay-ncert`).
3. Under Billing, switch to the **Blaze (Pay as you go)** plan (required by Cloud Functions & Cloud Scheduler, per NFR-7).
   > **Budget Safety Net (SRS §3.3.7):** In Google Cloud Console Billing, set a budget alert of $1 to notify you of unexpected spikes.

### 4.2 Configure Firebase Authentication (FR-1)
1. In Firebase Console, go to **Build → Authentication**.
2. Click **Get Started**, then enable the following Sign-in providers:
   - **Google:** Enable and select your project support email.
   - **Phone:** Enable phone authentication for SMS OTP login (uses an invisible reCAPTCHA; SMS is billed on Blaze). Add test phone numbers for QA.
   - **Email/Password:** Enable email/password sign-in (the app uses password sign-in plus "Forgot password").
3. In the **Authorized domains** tab, add `localhost` and your production domain (e.g. `chapterplay.vercel.app`).

### 4.3 Configure Cloud Firestore (SRS §4.1)
1. Go to **Build → Firestore Database** and click **Create database**.
2. Select a location close to your primary audience (e.g., `asia-south1` Mumbai).
3. Start in **Production mode** (rules will be deployed via CLI).

### 4.4 Deploy Security Rules & Indexes
From your local project terminal:

```bash
# Log in to Firebase CLI
firebase login

# Link your local workspace to your Firebase project
firebase use --add

# Deploy security rules and composite indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

#### What this enforces:
- `videos`: Public read. Writes only by admins (`users.role == 'admin'`) and the Apps Script service account.
- `users`: Owner (or admin) read/write, but a student can never set or change their own `role`.
- `users/{uid}/user_progress`: Owner (or admin) only.
- `feedback`: No direct client writes — created only by the rate-limited `submitFeedback` function. Readable by admins only.
- `rate_limits`: Server-only.

To make someone an admin, edit their `users/{uid}` document in the Firebase Console and set `role` to `admin`.

- `classes`, `subjects`, `chapters`: public read, admin write.
- `notes`: published notes public, drafts admin-only; admin write.
- `doubts`: the asking student and admins can read; created only by the `askDoubt` function.
- Storage `notes/**` (`storage.rules`): admin-only uploads of PDF/PNG/JPEG/WEBP under 20 MB.

> Enable **Build → Storage** in the Firebase Console (same region as Firestore) before deploying `storage`.

### 4.4a App Check & Analytics (NFR-3, §2)
1. **App Check:** Build → App Check → register the web app with **reCAPTCHA v3**, copy the site key into `VITE_RECAPTCHA_V3_SITE_KEY`. For local development, add a debug token under *Manage debug tokens* and put it in `VITE_APPCHECK_DEBUG_TOKEN`. After verifying traffic in the App Check dashboard, click **Enforce** for Firestore and Authentication. The callable functions (`submitFeedback`, `deleteAccount`) already enforce App Check.
2. **Analytics:** Project settings → Integrations → Google Analytics → enable, then copy the web app `measurementId` into `VITE_FIREBASE_MEASUREMENT_ID`.

### 4.5 Configure Local Frontend Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. In Firebase Console, go to **Project Settings → General → Your apps** and click **Web app (</>)**.
3. Copy the configuration credentials into `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:...
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_FIREBASE_FUNCTIONS_REGION=us-central1
   VITE_RECAPTCHA_V3_SITE_KEY=...
   ```
4. Restart the dev server (`npm run dev`). ChapterPlay will automatically connect to your live Firestore and Auth services!

---

## 5. Firebase Cloud Functions Setup

The `functions/` directory contains Node.js microservices for:
1. **Automated Revision Reminders (FR-7):** Scheduled IST daily (7 PM IST) and weekly (Sunday 6 PM IST) emails suggesting the user's sequential next chapter.
2. **Rate-Limited Feedback API (NFR-3 & FR-9):** `submitFeedback` callable — the only way feedback is written; max 5 per user per hour, enforced in a Firestore transaction.
3. **Unsubscribe Endpoint (NFR-1):** `unsubscribe` — signed link from the email footer (GET) plus RFC 8058 one-click (POST).
4. **Account Deletion (NFR-1):** `deleteAccount` callable — deletes `users`, `user_progress`, the user's doubts, rate-limit state and the Auth record; requires a sign-in within the last 5 minutes.
5. **Doubts (FR-14):** `askDoubt` callable — the only way doubts are created; reads lesson details from `videos` and limits each student to 10 doubts per 24 hours.

### 5.1 Environment Configuration & Secrets
Inside `functions/`:

```bash
cd functions
npm install
```

Set the secrets (you will be prompted for each value):
```bash
firebase functions:secrets:set RESEND_API_KEY        # from https://resend.com
firebase functions:secrets:set UNSUBSCRIBE_SECRET    # any long random string, e.g. `openssl rand -hex 32`
```

Set the plain parameters in `functions/.env` (not secret; do not put API keys here):
```env
APP_URL=https://your-app.vercel.app
EMAIL_FROM=NCERT QuickPrep <revision@your-verified-domain.com>
```
`EMAIL_FROM` must use the domain you verified in Resend with SPF, DKIM and DMARC (NFR-6), otherwise reminders land in spam or are rejected.

### 5.2 Deploying Cloud Functions
From the root directory:
```bash
firebase deploy --only functions
```

### 5.3 Verifying IST Scheduled Jobs
In the Google Cloud Console, navigate to **Cloud Scheduler**. You will see:
- `firebase-schedule-dailyReminderJob`: Runs at `0 19 * * *` in timezone `Asia/Kolkata`.
- `firebase-schedule-weeklyReminderJob`: Runs at `0 18 * * 0` in timezone `Asia/Kolkata`.

---

## 6. Google Sheets Content Ingestion Sync

Educators and channel owners can manage video catalog rows directly in Google Sheets. The sync script in [`scripts/google-apps-script-sync.js`](file:///D:/Ncert-prep-app/scripts/google-apps-script-sync.js) batch-upserts rows into Firestore.

### 6.1 Google Sheet Format
Row 1 must contain these headers (SRS §4.1). Column order does not matter; names are matched case-insensitively:

| class | Class Numeral | subject | book | chapter | Chapter Title | YT Vid Title | YT Vid ID |
|---|---|---|---|---|---|---|---|
| Class X | Class 10 | Science | NCERT Science | CH-01 | Chemical Reactions and Equations | Full Chapter One-Shot Revision | `d4b_B295xY8` |

Stored as: `class` → `class_display`, `Class Numeral` → `class_sort`, `book` → `textbook`, `chapter` → `chapter_id`, `Chapter Title` → `chapter_name`, `YT Vid Title` → `video_title`, `YT Vid ID` → `youtube_id` (document ID). Chapters are ordered by `chapter` using natural number order (CH-2 before CH-10).

### 6.2 Apps Script Deployment
1. In your Google Sheet, click **Extensions → Apps Script**.
2. Copy the code from `scripts/google-apps-script-sync.js` into `Code.gs`.
3. In Google Cloud Console → IAM → Service Accounts, create a service account with the **Cloud Datastore User** role and download a JSON key.
4. In Apps Script → **Project Settings → Script Properties**, add `FIREBASE_PROJECT_ID`, `SA_CLIENT_EMAIL` (`client_email` from the JSON) and `SA_PRIVATE_KEY` (`private_key` from the JSON). Never paste the key into the code.
5. Reload the sheet and use **QuickPrep → Sync videos to Firestore** (or run `syncSheetToFirestore()`).
6. *(Optional)* Add a time-driven trigger (e.g. hourly).

Rows with a missing or malformed YT Vid ID are skipped and logged; duplicate IDs keep the last row.

> [!IMPORTANT]
> **`isActive` Immutability Guarantee (SRS §4.2):**  
> For existing documents the sync's `updateMask` lists only the sheet columns, so re-running it **never** overwrites `isActive` (or `isPremium`). Brand-new videos are created with `isActive: true` and `isPremium: false`.

---

## 7. Production Deployment (Vercel / Netlify)

ChapterPlay is designed as a static client application with BaaS backend.

### Deploying to Vercel:
1. Push your repository to GitHub / GitLab.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. In **Build and Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. In **Environment Variables**, add the `VITE_FIREBASE_*` variables from your `.env`.
6. Click **Deploy**.

---

## 8. Architecture Constraints & Edge Case Checklist

| Requirement | How ChapterPlay Meets It | Source Code Location |
|---|---|---|
| **No YouTube API Quota Usage** | Playback uses iframe embeds (`youtube-nocookie.com`) with `youtube_id`. Never calls YouTube Data API. | [`DistractionFreePlayer.tsx`](file:///D:/Ncert-prep-app/src/components/player/DistractionFreePlayer.tsx) |
| **Accessible Rotating Palette** | Classes 1–6 cycle through defined WCAG AA compliant pastel backgrounds and dark readable text. | [`colorTokens.ts`](file:///D:/Ncert-prep-app/src/data/colorTokens.ts) |
| **Offline-First Resilience (FR-4)** | Video catalog & `last_watched_video` cached in `localStorage`; skeleton loaders render under 300ms. | [`useCatalog.ts`](file:///D:/Ncert-prep-app/src/hooks/useCatalog.ts), [`storage.ts`](file:///D:/Ncert-prep-app/src/services/storage.ts) |
| **Deactivated Video Handling (SRS §4.3)** | When `isActive = false`, video is excluded from browse/search, but renders in user's favorites/history as "No longer available" (disabled click) and counts in progress totals. | [`JumpBackInCard.tsx`](file:///D:/Ncert-prep-app/src/components/home/JumpBackInCard.tsx), [`ChapterList.tsx`](file:///D:/Ncert-prep-app/src/components/navigation/ChapterList.tsx) |
| **Rate-Limited Feedback (NFR-3)** | Max 5 feedback submissions per hour per user. Beyond that, clear rejection message is shown. | [`feedback.ts`](file:///D:/Ncert-prep-app/src/services/feedback.ts) |
| **DPDP Act (2023) Compliance (NFR-11)** | Clear privacy policy and self-service account deletion permanently purging Auth, Firestore user profile, and all progress records. | [`PrivacyPage.tsx`](file:///D:/Ncert-prep-app/src/pages/PrivacyPage.tsx), [`ProfileSettings.tsx`](file:///D:/Ncert-prep-app/src/components/profile/ProfileSettings.tsx) |

---

## 9. Troubleshooting

### 1. `Property 'env' does not exist on type 'ImportMeta'`
- **Fix:** Ensure [`src/vite-env.d.ts`](file:///D:/Ncert-prep-app/src/vite-env.d.ts) exists with `/// <reference types="vite/client" />`.

### 2. Video Player shows "Video Unavailable"
- **Reason:** The YouTube ID may be restricted by region or marked private.
- **Handling:** ChapterPlay displays the friendly error panel with a button back to the chapter list (FR-3).

### 3. Feedback submission rejected
- **Reason:** Rate limit reached (5 submissions per hour per user).
- **Handling:** Wait for the 1-hour window to reset or sign in with another test account.

### 4. Scheduled Reminders not firing
- **Reason:** Make sure your Firebase project is on the **Blaze** plan and Cloud Scheduler jobs are enabled with `Asia/Kolkata` timezone.
