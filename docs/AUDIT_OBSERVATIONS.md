# 📋 NCERT Prep App — Project Audit & Deployment Observations

**Date:** 23 September 2026  
**Audited By:** Antigravity AI  
**Project Path:** `D:\Ncert-prep-app`  
**Purpose:** Production readiness review + AWS deployment strategy

---

## 1. Project Overview

| Property | Value |
|---|---|
| App Type | React SPA (Single Page Application) |
| Framework | React 19 + TypeScript + Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | Firebase (Auth, Firestore, Functions, Storage) |
| Target Users | NCERT students (Classes 6–12), Admins |

---

## 2. Project File Structure Summary

```
D:\Ncert-prep-app\
├── src/
│   ├── App.tsx                   # Root router + all context providers
│   ├── main.tsx                  # React entry point
│   ├── services/                 # All backend communication (6 service files)
│   │   ├── firebase.ts           # Firebase SDK init + App Check
│   │   ├── firestore.ts          # DB CRUD: users, videos, progress, feedback
│   │   ├── content.ts            # Curriculum, Notes, Doubts, File uploads
│   │   ├── xpService.ts          # XP & leveling logic
│   │   ├── leaderboard.ts        # Class leaderboard queries
│   │   └── stats.ts              # Platform analytics counters
│   ├── context/                  # Global React state
│   │   ├── AuthContext.tsx       # Firebase Auth + Google Sign-In + DPDP consent
│   │   ├── CatalogContext.tsx    # Video catalog
│   │   ├── ProgressContext.tsx   # Watch progress
│   │   └── DoubtsContext.tsx     # Real-time doubts feed
│   ├── components/               # UI components (auth, player, admin, profile...)
│   ├── pages/                    # Public pages (Landing, Browse, Privacy, Admin)
│   ├── student/                  # Authenticated student pages
│   ├── types/index.ts            # All TypeScript interfaces
│   ├── hooks/                    # Custom React hooks
│   └── data/                     # Static data (gamification, themes, avatars)
├── amplify.yml                   # AWS Amplify CI/CD build config
├── customHttp.yml                # AWS security response headers
├── firebase.json                 # Firebase CLI config
├── firestore.rules               # Firestore security rules ⚠️
├── firestore.indexes.json        # Composite indexes
├── storage.rules                 # Firebase Storage access rules
├── vite.config.ts                # Build config, chunk splitting, prod guard
├── .env                          # Local secrets (gitignored)
└── .env.example                  # Template for environment variables
```

---

## 3. Tech Stack Deep Dive

### Frontend
| Package | Version | Role |
|---|---|---|
| react | 19.0.0 | UI framework |
| react-router-dom | 7.18.4 | Client-side routing |
| tailwindcss | 4.0.9 | Utility-first CSS |
| lucide-react | 1.16.0 | Icon library |
| fuse.js | 7.1.0 | Fuzzy search |
| clsx + tailwind-merge | latest | Conditional classNames |

### Backend (Firebase)
| Service | Usage |
|---|---|
| Firebase Auth | Google Sign-In + Email/Password + verification emails |
| Cloud Firestore | Primary database (NoSQL) |
| Cloud Functions | Server-side logic (consent, XP, doubts, account deletion) |
| Firebase Storage | Note attachment uploads (PDF, PNG, JPG, WEBP) |
| Firebase App Check | reCAPTCHA v3 anti-abuse protection |

---

## 4. Database Collections (Firestore)

| Collection | Purpose | Who Can Write |
|---|---|---|
| `users/{uid}` | User profile, settings, consent, XP | Client + Cloud Functions |
| `users/{uid}/user_progress/{ytId}` | Watch progress, completed, favorited | Client SDK |
| `users/{uid}/xp_transactions/{id}` | XP ledger per lesson/activity | Client + Cloud Functions |
| `videos/{youtubeId}` | Video catalog (synced from Google Sheet) | Admin dashboard |
| `doubts/{doubtId}` | Student Q&A with admin | Cloud Functions |
| `feedback/{id}` | Lesson ratings | Client SDK |
| `notes/{chapterKey}` | Revision notes + attachment metadata | Admin dashboard |
| `classes/` `subjects/` `chapters/` | Curriculum hierarchy | Admin dashboard |
| `leaderboard/{uid}` | XP rankings by class | Cloud Functions |
| `stats_daily/{date}` | Daily analytics | Cloud Functions |
| `stats/totals` | Lifetime platform counters | Cloud Functions |
| `platformConfig/main` | Dashboard config flags | Admin dashboard |

---

## 5. Authentication Flow

- **Google Sign-In** → `signInWithPopup()` → Firebase Auth → Firestore `createOrGetUser()`
- **Email/Password** → `createUserWithEmailAndPassword()` → email verification sent
- **Password Reset** → `sendPasswordResetEmail()`
- **DPDP Consent** (India Digital Personal Data Protection Act):
  - Adults: self-consent via `recordAdultConsent` Cloud Function
  - Children (minors): parent email approval via `requestParentalConsent` Cloud Function
- **Demo Mode**: When Firebase keys are absent, a local browser-only demo account is created (disabled in production builds by `vite.config.ts` guard)

---

## 6. Key Observations — Current State

### ✅ What Is Working Well

| Observation | Detail |
|---|---|
| Production build guard | `vite.config.ts` throws at build time if `VITE_FIREBASE_API_KEY` is missing |
| AWS Amplify pipeline ready | `amplify.yml` correctly runs `npm test → npm run build`, artifacts from `dist/` |
| Security headers configured | `customHttp.yml` has HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| Asset caching strategy | 1-year immutable for `/assets/**`, no-cache for `index.html` |
| Firebase App Check enabled | reCAPTCHA v3 protects Firestore + Functions from unauthorized clients |
| Offline fallback | LocalStorage fallback for catalog, progress, and user profile |
| Code splitting | React, Firebase, utils, and icons in separate vendor chunks |
| Storage rules | Admin-only write for notes, public read-only |
| DPDP compliance | Consent flow implemented (adult + parental), no Google Analytics |
| TypeScript coverage | All types defined in `src/types/index.ts` |
| Admin role protection | `AdminRoute` checks `user.role === 'admin'` before rendering |

---

### 🚨 Critical Issues Found

#### Issue 1: Firestore Security Rules Expire in < 30 Days
**File:** `firestore.rules` — Line 15  
**Current rule:**
```
allow read, write: if request.time < timestamp.date(2026, 10, 22);
```
**Impact:** Until Oct 22, 2026 — **anyone** can read and write all data. After Oct 22 — **all requests denied**, app goes down.  
**Action Required:** Replace with proper role-based rules immediately and run `firebase deploy --only firestore:rules`.

---

#### Issue 2: Cloud Functions Not Yet Deployed
The app depends on Cloud Functions for:
- `askDoubt` — student doubts submission
- `recordAdultConsent` / `requestParentalConsent` — DPDP consent
- `deleteAccount` — GDPR/DPDP right to erasure
- `trackVisit` — analytics
- `awardXp` — XP on lesson completion

Without these deployed, core features break silently (app falls back to demo mode).

---

#### Issue 3: Missing Content-Security-Policy Header
`customHttp.yml` is missing a CSP header. Without it, the app is vulnerable to cross-site scripting (XSS) injection.

---

### 🟡 Medium Priority Issues

| Issue | Impact | Fix |
|---|---|---|
| No error tracking (Sentry/Datadog) | Blind to production errors | Add Sentry with 1-line setup |
| YouTube API key unrestricted | Key exposed in JS bundle, risk of quota theft | Restrict to your domain in Google Cloud Console |
| Functions region `us-central1` | High latency for Indian users (~180ms extra) | Redeploy to `asia-south1` (Mumbai) |
| No SPA rewrite rule documented | Direct URL visits (e.g. `/app/lesson/xyz`) return 404 | Add rewrite in Amplify Console |
| Firestore indexes not deployed | Some queries will fail with `FAILED_PRECONDITION` | Run `firebase deploy --only firestore:indexes` |

---

## 7. Deployment Architecture — Option A (Recommended)

### Hybrid: AWS Frontend + Firebase Backend

```
User Browser
    ↓ HTTPS
AWS Amplify (CloudFront CDN)
    → Hosts compiled React SPA
    ↓ Firebase SDK calls
Firebase Services
    ├── Auth (Google Sign-In + Email)
    ├── Firestore (Database)
    ├── Cloud Functions (Backend logic)
    └── Storage (File uploads)
```

**Effort to deploy:** ~1 day  
**Monthly cost:** AWS ~$1–6 + Firebase Blaze ~$20–50 = **~$25–56/month** at 10K users  
**Status:** `amplify.yml` already configured, ready to connect to GitHub

---

## 8. Deployment Architecture — Option B (Full AWS)

### Everything on AWS — complete Firebase replacement

| Firebase Service | AWS Replacement | Migration Effort |
|---|---|---|
| Firebase Auth + Google Sign-In | Amazon Cognito + Google IdP | 🔴 Hard (redirect vs popup flow) |
| Cloud Firestore | Amazon DynamoDB | 🔴 Hard (schema redesign required) |
| Cloud Functions | AWS Lambda + API Gateway | 🟡 Medium (15+ functions to rewrite) |
| Firebase Storage | Amazon S3 + pre-signed URLs | 🟢 Easy |
| `onSnapshot` real-time | API Gateway WebSockets | 🔴 Hard |
| Firebase App Check | AWS WAF | 🟡 Medium |
| Email sending | Amazon SES | 🟢 Easy |

**Effort to migrate:** ~6–10 weeks  
**Monthly cost at 10K users:** ~$30–80/month (slightly more expensive than hybrid)  
**Code files requiring full rewrite:** `firebase.ts`, `AuthContext.tsx`, `firestore.ts`, `content.ts`, `xpService.ts`, `leaderboard.ts`, `stats.ts`

---

## 9. Cost Comparison

| Scale | Hybrid (Firebase + AWS) | Full AWS |
|---|---|---|
| 5K users | ~$10–25/month | ~$20–40/month |
| 10K users | ~$25–56/month | ~$30–80/month |
| 50K users | ~$80–150/month | ~$100–180/month |
| 500K users | ~$500–800/month | ~$400–600/month |

> AWS becomes cost-competitive only at **500K+ users**. For current and near-term scale, Firebase + AWS Amplify hosting is more economical.

---

## 10. Environment Variables Required (Production)

All must be set in AWS Amplify Console → Environment variables:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FUNCTIONS_REGION     (use asia-south1 for India)
VITE_RECAPTCHA_V3_SITE_KEY
VITE_GRIEVANCE_OFFICER_NAME        (DPDP required)
VITE_GRIEVANCE_EMAIL               (DPDP required)
```

---

## 11. Pre-Launch Checklist

### 🔴 Must Do Before Go-Live
- [ ] Fix Firestore security rules (expire Oct 22, 2026)
- [ ] Deploy Cloud Functions (`firebase deploy --only functions`)
- [ ] Deploy Firestore indexes (`firebase deploy --only firestore:indexes`)
- [ ] Set all `VITE_*` env vars in AWS Amplify Console
- [ ] Add production domain to Firebase Authorized Domains
- [ ] Add CSP header to `customHttp.yml`
- [ ] Add production domain to Google reCAPTCHA admin
- [ ] Verify Google OAuth consent screen + authorized domain

### 🟡 Should Do Before Go-Live
- [ ] Add Sentry error tracking
- [ ] Restrict YouTube API key to production domain
- [ ] Add SPA rewrite rule in Amplify Console
- [ ] Switch Cloud Functions region to `asia-south1`
- [ ] Test Google Sign-In end-to-end on staging

### 🟢 Nice to Have
- [ ] Set up CloudWatch or Firebase Monitoring alerts
- [ ] Add custom domain in Amplify Console + Route 53
- [ ] Set up Firebase Firestore daily backups

---

## 12. Final Recommendation

**Go with Option A (Hybrid) for now.**

- The app is already 95% ready for production on the hybrid model
- `amplify.yml` is configured and working
- The only blockers are the Firestore rules fix and Cloud Functions deployment
- Full AWS migration can be considered at **500K+ users** or if enterprise compliance (MEITY, SOC 2) is required

> **Immediate priority:** Fix Firestore security rules before October 22, 2026 — this is the only issue that will take the entire app offline if missed.

---

*Document generated: 23 September 2026 | Project: NCERT Prep App | Auditor: Antigravity AI*
