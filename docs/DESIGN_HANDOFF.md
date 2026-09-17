# Design Hand-Off — NCERT QuickPrep (SRS §3)

Two deliverables required by SRS §3 before UI work is translated from Google Stitch:
1. A flat checklist of every UI screen and component.
2. A baseline Google Stitch prompt for the visual direction, hybrid navigation, and subject colour logic.

When the Stitch exports come back, map each exported frame to the checklist item it covers and translate it into the listed code location.

---

## 1. Screen & component checklist

| # | Screen / component | Purpose | Requirement | Code location |
|---|---|---|---|---|
| 1 | Top navigation bar | Logo, persistent search trigger, focus timer, streak chip, Syllabus link, profile / Sign in | FR-1, FR-5 | `src/components/common/Navbar.tsx` |
| 2 | Student app shell (signed in) | Coursera-style layout: collapsible sidebar (Home, My subjects, Doubts, Saved, Focus timer, Reminders, Profile, Admin, Log out), top bar with search, running focus timer, doubts bell, profile; drawer on phones | NFR-4 | `src/student/StudentLayout.tsx` |
| 2a | Reminders card | On/off switch, Daily/Weekly options (disabled while off), saved confirmation | FR-8 | `src/components/profile/ReminderSettingsCard.tsx` |
| 3 | Footer | Privacy policy link, copyright | NFR-1 | `src/components/common/Footer.tsx` |
| 4 | Visitor homepage — Hero Search | Headline, prominent search bar with auto-complete | §3.1, FR-5 | `src/pages/LandingPage.tsx` |
| 5 | Homepage — Jump Back In card (history state) | Last watched lesson, class/subject tags, Completed / No longer available badges, Continue | §3.2, FR-6, SRS 4.3 | `src/components/home/JumpBackInCard.tsx` |
| 6 | Homepage — Jump Back In card (empty state) | "Start your first lesson!" + button into the Visual Grid | §3.2 | `src/components/home/JumpBackInCard.tsx` |
| 7 | Homepage — Visual Grid of Classes | Colour tile per class with subject chips and lesson count | §3.3 | `src/components/home/ClassGrid.tsx` |
| 8 | Student home `/app` | Continue learning card, My subjects cards, Up next list; side column with course progress, weekly streak, level, doubts/reminders/focus shortcuts | §3, FR-6, FR-10, FR-11 | `src/student/pages/HomePage.tsx` |
| 9a | My subjects `/app/subjects` and subject page `/app/subjects/:subject` | Course cards with generated subject cover and progress; subject header, collapsible chapters, lesson rows with status and save | §3.3, FR-6, FR-13 | `src/student/pages/SubjectsPage.tsx` |
| 9 | Subject grid tiles (visitor syllabus) | Colour per subject, chapter & lesson count, progress bar, Focus badge | §3.3 | `src/components/home/SubjectGrid.tsx` |
| 10 | Syllabus — class picker (visitors) / enrolled-class banner (students) | Choose class or see locked class with "Change class" | FR-10 | `src/pages/BrowsePage.tsx` |
| 11 | Syllabus — chapter list | Chapters with lesson rows, Completed checkmarks, notes shortcut | FR-4, FR-6 | `src/components/navigation/ChapterList.tsx` |
| 12 | Breadcrumbs | Home › Class › Subject › Chapter | FR-4 | `src/components/navigation/Breadcrumbs.tsx` |
| 13 | Loading skeletons | Class grid, chapter list placeholders | FR-4 | `src/components/common/SkeletonLoader.tsx` |
| 14 | Search dialog with auto-complete | Ranked results across title, chapter, subject; empty state | FR-5 | `src/components/search/SearchResultsModal.tsx` |
| 15 | Lesson page `/app/lesson/:id`, `/watch/:id` | Player, Save / Mark complete / Next, tabs (Overview, Notes, Ask a doubt, Feedback), subject outline with progress | FR-2, FR-6, FR-9, FR-13, FR-14 | `src/student/pages/LessonPage.tsx`, `src/student/LessonPlayer.tsx` |
| 16 | Video unavailable state | Inline in player with Try again | FR-3 | `src/student/LessonPlayer.tsx` |
| 17 | Private feedback box | Text input below player, remaining-per-hour hint, success / rate-limit messages | FR-9, NFR-3 | `src/components/player/FeedbackForm.tsx` |
| 18 | Sign-in modal — email/password + Google | Sign in, create account (with class), forgot password | FR-1 | `src/components/auth/AuthPages.tsx` |
| 19 | Sign-in modal — Mobile OTP | Phone number → 6-digit code → verify | FR-1 | `src/components/auth/AuthPages.tsx` |
| 20 | Onboarding wizard (4 steps) | Your class (required), focus subjects, daily target + reminders, summary | FR-10 | `src/components/onboarding/OnboardingWizard.tsx` |
| 21 | Profile & Settings | Header, stats, profile & class form, reminders toggle + daily/weekly radio, favourites, export, delete | FR-8, NFR-1 | `src/components/profile/ProfileSettings.tsx` |
| 22 | Delete-account confirmation (+ identity check) | Warning, confirm with Google / password / re-sign-in for phone | NFR-1 | `src/components/profile/ProfileSettings.tsx` |
| 23 | Privacy policy page | Data collected, purpose, retention, grievance contact | NFR-1, NFR-11 | `src/pages/PrivacyPage.tsx` |
| 24 | Focus timer page `/app/focus` | 25/5/15 min modes, ring, start/pause/reset; keeps running across pages | — | `src/student/pages/AccountPages.tsx`, `src/student/useFocusTimer.ts` |
| 26 | Admin dashboard shell | Sidebar / mobile tabs with badges, admin identity, back to app, toast messages | FR-12 | `src/pages/admin/AdminDashboard.tsx`, `adminUi.tsx` |
| 26a | Admin — Overview | Stat tiles, oldest open doubts, chapters missing notes, class coverage table | FR-12 | `src/pages/admin/OverviewSection.tsx` |
| 26b | Admin — Classes & Chapters | 3-column class → subject → chapter manager, show/hide toggles, edit dialog, create records from videos | FR-12 | `src/pages/admin/CurriculumSection.tsx` |
| 26c | Admin — Videos | Filterable table, add/edit dialog with suggestions, preview | FR-12 | `src/pages/admin/VideosSection.tsx` |
| 26d | Admin — Notes & Cheat Sheets | Chapter list with status, notes editor, file upload with progress, preview, publish controls | FR-13 | `src/pages/admin/NotesSection.tsx` |
| 26e | Admin — Doubts inbox | Status tabs, filters, conversation detail, reply box, close/reopen | FR-14 | `src/pages/admin/DoubtsSection.tsx` |
| 26f | Admin — Feedback | One-way feedback list, mark reviewed | FR-9 | `src/pages/admin/FeedbackSection.tsx` |
| 26g | Admin — Data & Sync | Backend status, catalogue reload, create records, seed sample data, admin access info | FR-12 | `src/pages/admin/DataSection.tsx` |
| 27 | Reminder email template | Next lesson card or "Start your first lesson!", unsubscribe footer | FR-7, NFR-1 | `functions/src/reminders.ts` |
| 28 | Unsubscribe confirmation page | "You have been unsubscribed" | NFR-1 | `functions/src/reminders.ts` |
| 29 | Notes window (student) | Summary, key points, formulas, exam tips, attachment rows, empty state | FR-13 | `src/components/app/RevisionNotesModal.tsx` |
| 30 | Ask a doubt box (player) | Question input, limits, this lesson's doubts with replies | FR-14 | `src/components/player/AskDoubtForm.tsx` |
| 31 | My Doubts (dashboard) + header bell | Expandable doubt list with reply, open lesson, mark resolved; unread badge | FR-14 | `src/components/doubts/MyDoubtsPanel.tsx`, `Navbar.tsx` |

---

## 2. Google Stitch baseline prompt

```text
Design a responsive web app called "NCERT QuickPrep": a calm, distraction-free gateway to an existing
YouTube library of NCERT revision lessons for Classes 1–12. It replaces YouTube's clutter (recommendations,
comments, sidebars) with structured navigation. Audience-neutral tone: the account holder is an adult
(student or parent); avoid childish styling, mascots, or "kids" language.

VIBE
Modern, innovative, colourful and fluid, but focused. Generous whitespace, soft 16–24px rounded corners,
subtle shadows, smooth hover lifts (2px) and 200ms transitions. One sans-serif family (Inter), weights
400/500/600 only. Headings 20–24px, body 14–16px, captions 12–13px in grey.

BRAND TOKENS
Primary indigo #3B4FE0 (logo, primary buttons, links, active nav). Secondary teal #12A594 (progress bars,
Continue buttons, completed checkmarks). Text #1E2233, secondary text #6B7280, surfaces #FFFFFF,
page background #F5F6FA, borders #E3E5EC. Logo: rounded-square indigo mark with a white play triangle,
wordmark "Quick" navy + "Prep" teal.

COLOUR TILE LOGIC (classes and subjects)
Six pastel families rotate; each tile pairs a light background with the darkest shade of the same family
for text so contrast passes WCAG AA without black text:
coral #FAECE7 / #4A1B0C, teal #E1F5EE / #04342C, purple #EEEDFE / #26215C, amber #FAEEDA / #412402,
pink #FBEAF0 / #4B1528, blue #E6F1FB / #042C53.
Classes use the family by class number (1→coral, 2→teal … 6→blue, 7→coral again).
Subjects keep one fixed family everywhere they appear (e.g. Science is always the same colour on grids,
chips, and the player).

HOMEPAGE — HYBRID NAVIGATION, THREE STACKED SECTIONS (in this exact order)
1. Hero Search: short greeting/headline and a large, prominent search bar with placeholder
   "Search lessons, chapters, subjects…" and a "/" shortcut hint. Show an auto-complete dropdown state
   with 5 ranked suggestions, each showing lesson title, chapter, subject chip and class tag.
2. "Jump Back In" card: one highlighted wide card with the last watched lesson (class tag, subject,
   chapter title, lesson title, Completed badge, teal "Continue" button). Also design the EMPTY state:
   "Start your first lesson!" with a button that scrolls to the Visual Grid. Also design the
   "No longer available" state (amber badge, no play button).
3. Visual Grid: responsive grid (1 col mobile, 2 tablet, 3–4 desktop) of colourful Class tiles with class
   name, subject chips and lesson count. Tapping a Class opens a grid of Subject tiles for that class
   (subject name, chapter count, lesson count, progress bar with % complete).

SIGNED-IN STUDENT VARIANT
The student is enrolled in exactly one class. The homepage shows the same three sections, but the Hero
Search is scoped to their class ("Search Class 10 lessons…"), a compact level/XP + streak card sits
beside the greeting, and the Visual Grid shows that class's Subject tiles directly (no class picker),
with a small "Change class" link. Below: "Up next" row of three lesson cards.

OTHER SCREENS TO INCLUDE
- Subject → chapter list with lesson rows and green completed checkmarks, breadcrumbs.
- Video page: 16:9 player area, title, Favourite star, Mark complete, Next lesson; a friendly
  "Video unavailable" panel variant; a private feedback textarea below the player with
  "5 per hour" hint and success/error states.
- Sign-in modal: Google button, email + password, "Continue with Mobile OTP" (number → 6-digit code).
- Onboarding wizard: 4-step progress bar — Your class (required), Focus subjects, Daily target & reminders,
  Summary.
- Profile & settings: profile header, 4 stat tiles, class/subject form, reminders on/off switch with
  Daily (7 PM IST) / Weekly (Sunday 6 PM IST) radio cards, favourites list, export data, danger-zone delete.
- Privacy policy page, mobile bottom navigation dock, loading skeletons for grids and lists.
- Notes window: summary card, key point rows with check icons, monospace formula rows, amber exam-tip rows,
  and attachment rows (PDF/image icon, name, size, Open button); empty state "No notes for this chapter yet".
- Under the player: "Ask a doubt" card (textarea, character count, teal Send) listing this lesson's doubts with
  status chips (Waiting for reply / Answered / Closed) and the educator's reply in a teal bubble.
- Student dashboard "My Doubts" list with a "New reply" chip, and a header bell with a red unread count.

ADMIN DASHBOARD (separate, denser, desktop-first but responsive)
Left sidebar on dark slate card (admin name, Back to app) with nav: Overview, Classes & Chapters, Videos,
Notes & Cheat Sheets, Doubts (red count), Feedback (count), Data & Sync. On mobile it becomes horizontal tabs.
- Overview: 5 stat tiles (Students, Active lessons, Notes coverage %, Open doubts with "oldest 3h ago",
  New feedback), two lists ("Doubts waiting longest", "Chapters with lessons but no notes"), and a class
  coverage table with a small progress bar per class.
- Classes & Chapters: three side-by-side cards (Classes | Subjects | Chapters), each row with title, meta line,
  visibility switch and edit pencil; hidden rows struck through; an edit dialog with order and visibility.
- Notes & Cheat Sheets: left filter + chapter list with Published/Draft/No notes chips; right editor with title,
  summary, three one-per-line columns (Key points, Formulas, Exam tips), drag-free "Upload PDF / image" with
  progress bars, attachment rows with remove, and footer buttons (Delete notes | Save draft | Publish).
- Doubts: status tabs with counts, class filter, search; list on the left, conversation panel on the right with
  student details, question bubble, reply textarea, Close / Send reply.
- Videos: filter bar and table with visibility pills; Feedback list; Data & Sync cards.

Deliver desktop (1440px) and mobile (390px) frames for every screen, using real-looking NCERT content
(e.g. Class 10 Science — "Chemical Reactions and Equations").
```
