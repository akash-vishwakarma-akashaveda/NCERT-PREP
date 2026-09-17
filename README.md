# NCERT Prep — Structured NCERT Video-Revision Web App

A structured, distraction-free educational web application that organizes NCERT educational content into a clean **Class → Subject → Chapter** hierarchy, featuring distraction-free video playback, watch-progress tracking, favourites, revision cheat sheets, and opt-in revision reminders.

📖 **Detailed Walkthrough:** See [STARTUP_AND_SETUP_GUIDE.md](file:///D:/Ncert-prep-app/STARTUP_AND_SETUP_GUIDE.md) for full step-by-step instructions on zero-config local demo mode, live Firebase backend configuration, Cloud Functions deployment, and Google Sheets sync setup.

---

## Key Features

- **Adaptive Developmental UI (3 Stages):**
  - **Primary (Classes 1–5):** Kid-friendly, bright, playful squircle cards, star rewards, and joyful themes.
  - **Middle & Secondary (Classes 6–10):** Modern ed-tech, streak tracking (`🔥 3 Days`), gamified Level/XP progress bar, 25-min Pomodoro focus timer, milestone syllabus mastery.
  - **Senior Secondary (Classes 11–12):** Sleek, high-density, exam-focused (Boards & Entrance readiness), PYQ tags, and high-yield formula cheat sheets.
- **Distraction-Free Video Playback (FR-2):** Embedded via `youtube-nocookie.com` with `controls=1&rel=0&modestbranding=1`, stripping out algorithmic recommendations, comments, and sidebars.
- **Floating App Dock & Mobile Navigation:** Centered glassmorphism dock navigation (`Home`, `Search`, `Syllabus`, `Timer`, `Saved`, `Profile`).
- **Visual Grid & Color Tokens (SRS §2.2):** Accessible rotating pastel palette (Coral, Teal, Purple, Amber, Pink, Blue) for Grades 1–12 with WCAG AA compliance.
- **High-Yield Revision Notes & Formula Sheets:** Quick drawer/modal cheat sheets per chapter.
- **Global Client-Side Search (FR-5 & SRS §3.5):** Fast fuzzy search powered by Fuse.js matching across `video_title`, `chapter_name`, and `subject`.
- **Progress Tracking & Favourites (FR-6):** Automatic completion checks upon video end, instant optimistic favorite toggles, and "Jump back in" card.
- **Deactivated Video Edge Case (SRS §4.3):** Videos set to `isActive = false` remain visible in user watch history/favourites marked "No longer available" without breaking counts or throwing errors.
- **Revision Reminders (FR-7 & FR-8):** IST-anchored scheduled reminder jobs (Daily 7 PM IST, Weekly Sunday 6 PM IST) with fallback copy and 1-click unsubscribe links (NFR-1).
- **One-Way Educator Feedback (FR-9 & NFR-3):** Confidential feedback form with rate limiting (max 5 submissions/hour per user).
- **Privacy & Compliance (NFR-11):** Privacy policy and self-service account deletion compliant with India's Digital Personal Data Protection (DPDP) Act, 2023.

---

## Tech Stack

| Layer | Choice | Details |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Blazing fast static build |
| **Styling** | Tailwind CSS v4 | Custom design tokens and responsive layout |
| **Icons** | Lucide React | Clean, modern iconography |
| **Search Engine** | Fuse.js | High-performance client-side fuzzy search |
| **Backend / BaaS** | Firebase | Auth, Firestore, Cloud Functions |
| **Sync Script** | Google Apps Script | Google Sheet to Firestore batch upsert |

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Zero-Config Evaluation:** NCERT Prep automatically runs in an instant demonstration mode with rich NCERT sample data across multiple grades and subjects if Firebase environment keys are not configured yet.

### 3. Connecting Live Firebase (Optional)
Copy `.env.example` to `.env` and fill in your Firebase Web App credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Deploy Firestore Security Rules & Indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Directory Structure

```
├── public/                 # Static assets (favicons, SVG marks)
├── src/
│   ├── components/
│   │   ├── auth/           # AuthPages (Google, Email/Password, Mobile OTP, Demo)
│   │   ├── common/         # Navbar, Footer, SkeletonLoader, Breadcrumbs
│   │   ├── home/           # HeroSearch, JumpBackInCard, ClassGrid
│   │   ├── navigation/     # SubjectList, ChapterList
│   │   ├── player/         # DistractionFreePlayer, VideoUnavailable, FeedbackForm
│   │   ├── profile/        # ProfileSettings, RevisionReminders, DeleteAccount
│   │   └── search/         # SearchResultsModal (Fuse.js auto-complete)
│   ├── context/
│   │   ├── AuthContext.tsx # User session, sign-in methods, demo state
│   │   └── ProgressContext.tsx # Completed status, favorites, last watched
│   ├── data/
│   │   ├── colorTokens.ts  # SRS 2.2 color palette & class tile styles
│   │   └── curriculumData.ts # Curated NCERT curriculum dataset
│   ├── hooks/
│   │   ├── useCatalog.ts   # Catalog hierarchy & offline caching
│   │   └── useSearch.ts    # Fuzzy search hook
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── BrowsePage.tsx
│   │   ├── WatchPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── PrivacyPage.tsx
│   ├── services/
│   │   ├── feedback.ts     # Feedback submission & rate limiting
│   │   ├── firebase.ts     # Firebase SDK initialization
│   │   ├── firestore.ts    # Firestore data operations
│   │   └── storage.ts      # LocalStorage caching (FR-4)
│   ├── types/              # TypeScript interfaces
│   ├── App.tsx             # Root app with routing and modals
│   ├── index.css           # Tailwind CSS & design variables
│   └── main.tsx
├── functions/              # Cloud Functions (Reminders & Feedback rate-limiting)
├── scripts/
│   └── google-apps-script-sync.js # Google Sheet to Firestore batch upsert
├── firestore.rules         # Security rules from SRS Section 3.3
├── firestore.indexes.json  # Composite indexes for scheduled queries
└── vite.config.ts
```

---

## Security & Architectural Constraints

1. **Client Never Calls YouTube Data API:** Playback uses `youtube-nocookie.com` embed URLs with stored `youtube_id`s, removing API quota exhaustion risks.
2. **`isActive` Immutability in Sync:** The Google Apps Script is explicitly forbidden from overwriting `isActive`, guaranteeing that admin content moderation survives repeated batch syncs.
3. **Write-Only Feedback:** Students cannot read back feedback submissions (enforced by `firestore.rules`).
4. **Rate Limiting:** Max 5 feedback submissions per hour per user (enforced both client-side and via Cloud Functions).
