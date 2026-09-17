# Functional Requirements Document (FRD)

**Project (dummy branding):** ChapterPlay — a structured video-revision web app
**Companion document:** SRS.md (architecture, data model, security, brand/UI)
**Version:** 1.4 (adds admin dashboard with curriculum management, chapter notes & cheat-sheet uploads, and private doubts Q&A)
**Date:** 17 September 2026

---

## 1. Purpose
This FRD translates the SRS into detailed, testable functional requirements — actors, user stories, step-by-step flows, and acceptance criteria — so development and QA can build and verify against the same source of truth.

## 2. Actors

| Actor | Description |
|---|---|
| Visitor | Not signed in; can explore every class in the visual grid and search the full catalogue, cannot track progress or receive reminders |
| Student (registered user) | Signed in via Google/OTP/Email; has a `users` document and is **enrolled in exactly one class at a time** (`grade_preference`). Dashboard, syllabus and search are scoped to that class |
| Admin | A user whose `role == 'admin'` was assigned server-side (Firebase Console / Admin SDK). Uses the admin dashboard (FR-12) to manage classes, subjects, chapters, videos, notes & cheat sheets, doubts and feedback; also owns the Google Sheet used for content sync. A student can never grant themselves this role |

## 3. Functional Requirements

### FR-1 — Authentication & session management
**User story:** As a visitor, I want to sign in with Google, mobile OTP, or email, so that my progress and preferences are saved under my own account.

**Flow:**
1. Visitor taps "Sign in" from the header.
2. Chooses Google Sign-In, Mobile OTP (Indian 10-digit numbers or full +country format; 6-digit SMS code verified via Firebase phone auth with invisible reCAPTCHA), or email + password.
3. On success, Firebase Auth creates/retrieves the user, and a `users` document is created on first sign-up (Section 4 of SRS) with default preferences. The document never contains a client-written `role`.
4. A student without an enrolled class is taken through onboarding (FR-10) before reaching the dashboard.
5. Session persists in the browser until explicit logout or token revocation.
6. A visible "Logout" control (profile/settings menu) clears the local session and signs out of Firebase Auth.

**Acceptance criteria:**
- All three sign-in methods succeed and create exactly one `users` document per unique account (no duplicates on repeat sign-in).
- Refreshing the page or closing/reopening the browser keeps the user signed in.
- Logout immediately revokes local session state; protected screens (profile, favourites, admin) return to the public homepage afterward.
- Email sign-up asks for the class once; that class pre-fills onboarding instead of being asked again from scratch.

---

### FR-2 — Distraction-free playback
**User story:** As a registered user, I want to watch a chapter's video without YouTube's related-video clutter, so that I stay focused on studying.

**Flow:** Tapping a video mounts a player through the YouTube IFrame Player API with `host: youtube-nocookie.com` and `controls=1&rel=0&modestbranding=1`. Only the stored `youtube_id` is used; the YouTube Data API is never called.

**Acceptance criteria:**
- No related-video panel or YouTube branding overlay appears after playback ends.
- Player controls (play/pause/seek/volume/fullscreen) remain fully usable.

---

### FR-3 — Edge cases & error handling
**User story:** As a user, I want a clear message if a video can't load, so that I'm not staring at a broken frame.

**Flow:** The player shows the "Video unavailable" panel (Retry, Back to chapter) when any of these happen: the IFrame Player API `onError` fires with code 2, 5, 100, 101, 150 or 153; the player is not ready within 12 seconds; the device is offline; or the player loads without any video metadata 5 seconds after ready (removed/private videos). A plain `<iframe onError>` is not used because it never fires for YouTube-side errors.

**Acceptance criteria:**
- Simulating a removed/private video shows the friendly error panel within a few seconds, never a blank or broken iframe.
- The error panel includes a way back to the chapter list (not a dead end).

---

### FR-4 — Connectivity & offline fallbacks
**User story:** As a user on a slow connection, I want the navigation to still respond, so that I'm not blocked by network lag.

**Flow:** The Class/Subject/Chapter hierarchy and `last_watched_video` are cached in `localStorage`; screens show loading skeletons while fresh data loads.

**Acceptance criteria:**
- On a throttled/offline connection, previously visited navigation levels render instantly from cache.
- Any screen waiting on a network response shows a skeleton, never a blank white screen, within 300ms.

---

### FR-5 — Global search
**User story:** As a user, I want to search by title, chapter, or subject with auto-complete, so that I can jump straight to what I need.

**Flow:** A persistent search bar matches input against `video_title`, `chapter_name`, and `subject`, showing ranked auto-complete suggestions as the user types. Implemented client-side against the cached video index (SRS Section 3.5) rather than a Firestore query, since Firestore does not support substring matching.

**Acceptance criteria:**
- Typing 3+ characters returns matching suggestions across all three fields within ~500ms.
- Selecting a suggestion navigates directly to that video/chapter.
- No results shows an empty state, not an error.

---

### FR-6 — Progress tracking & favourites
**User story:** As a user, I want my completed videos marked and the ability to favourite ones I want to revisit, so that I can track my revision.

**Flow:** When the IFrame Player API reports state `ENDED` (0), write/update a `user_progress` sub-collection entry (`completed: true`, `last_viewed`); a manual "Mark complete" toggle does the same. A favourites toggle writes/removes `favorited: true` on the same entry.

**Acceptance criteria:**
- Watching a video to completion shows a "Completed" checkmark on that video's tile without a page reload.
- Toggling favourite updates instantly (optimistic UI) and persists after refresh.
- `last_watched_video` on the `users` document updates so FR-7's reminder logic and the homepage "Jump back in" card both reflect the latest video.
- If a favourited or completed video is later set `isActive = false` by the admin, it still appears in the user's list marked "No longer available" rather than disappearing or erroring (SRS Section 4.3), and progress totals are unaffected.

---

### FR-7 — Automated email reminders
**User story:** As a user who opted in, I want a periodic reminder email suggesting what to study next, so that I keep up my revision.

**Flow:**
1. One scheduled Cloud Function (`reminderJob`) runs at the top of every hour in the `Asia/Kolkata` timezone, not the Cloud Scheduler UTC default.
2. Each run queries `users` where `reminders_enabled == true` AND `reminder_frequency == 'daily'`, keeping users whose `reminder_hour` (default 19) equals the current IST hour. On Sundays it does the same for `'weekly'` (default hour 18).
3. For each matching user, the email suggests the next lesson after `last_watched_video` in syllabus order (same class and subject by `chapter_id` natural order, then the rest of the class), limited to the student's enrolled class; otherwise it falls back to "Start your first lesson!" with the first lesson of that class.
4. The lesson button deep-links to `/?watch=<youtube_id>`, which opens the player directly.
5. Every email includes an unsubscribe link signed with an HMAC token, plus `List-Unsubscribe` / `List-Unsubscribe-Post` headers for one-click unsubscribe (NFR-1). Emails are sent through Resend's batch API.

**Acceptance criteria:**
- The daily job never emails a user with `reminder_frequency == 'weekly'`, and vice versa.
- The weekly send lands at the configured IST time regardless of server/UTC default.
- A brand-new user (no watch history) receives the "Start your first lesson!" variant, not an error or empty email.
- Clicking unsubscribe sets `reminders_enabled` to `false` and no further reminder emails are sent.
- An unsubscribe link with a missing or altered token is rejected and changes nothing.
- User-provided text (display name) is HTML-escaped in the email.

---

### FR-8 — User profile & settings
**User story:** As a student, I want one place to see my progress and manage my account, class, study preferences, reminders and data.

**Screen layout (top to bottom):**
1. **Header card** — avatar initial, display name, email, enrolled class, account badge (Student / Administrator, plus "Demo" in demo mode), Sign out. The **Admin Console** button is shown only when `role == 'admin'`.
2. **Stats** — Completed lessons, Saved lessons, Study streak (FR-11), Total XP (FR-11). No hard-coded or placeholder numbers.
3. **Profile & Class** — display name; **Your Class** (single select, Classes 1–12); focus subjects (chips built from subjects that actually have published lessons in the selected class); daily focus target (25/50/75/100 min).
   - Changing the class shows an inline notice ("switching from Class X to Class Y — progress and favourites are kept") and the save button reads "Switch to Class Y". Focus subjects reset because subjects differ per class.
4. **Revision reminders** (`#reminders`) — switch for `reminders_enabled`, Daily / Weekly (Sundays) options for `reminder_frequency`, and a **Send at** hour picker (6 AM–10 PM IST, stored as `reminder_hour`; default 7 PM daily / 6 PM weekly), saved immediately with a confirmation. Frequency options stay visible (disabled) while reminders are off. Reachable from the sidebar **Reminders** item (which shows the current setting) and the dashboard reminder chip, so a student who opted in during onboarding can always find and change it.

**Signed-in navigation:** a collapsible left sidebar (icon rail when collapsed, preference remembered; slide-out drawer on phones) with Dashboard, Syllabus, My doubts, Saved lessons, Focus timer, Reminders, Profile & settings, Admin dashboard (admins only) and Log out. The top bar keeps search (except on the dashboard, which has its own), focus timer, streak, doubts bell and profile.
5. **Favourites** — across all classes, including deactivated videos marked "No longer available" (SRS 4.3).
6. **Data & privacy** — export my data (JSON) and permanent account deletion with confirmation. Deletion calls the `deleteAccount` Cloud Function, which requires a sign-in within the last 5 minutes; otherwise the dialog asks the user to confirm with Google, re-enter their password, or (phone accounts) sign in again. Errors are shown in the dialog; the account is never reported as deleted when it was not.
7. Phone-only accounts see a note that email reminders need an email address.

There is no role switcher and no "re-run setup wizard" button on this screen — every onboarding setting is editable here directly.

**Acceptance criteria:**
- Turning reminders off immediately stops future scheduled sends (verified against FR-7's query).
- Switching from weekly to daily (or vice versa) takes effect from the next scheduled run.
- Saving a new class immediately re-scopes the dashboard, syllabus and search to that class; earlier progress is not deleted.
- A student never sees the Admin Console button or any control that changes `role`.

---

### FR-9 — One-way feedback (private comments)
**User story:** As a user, I want to leave a private comment about a video, so that the channel owner can see and act on it.

**Flow:** A text input below the player (max 1,000 characters) calls the `submitFeedback` Cloud Function, which is the only write path into `feedback` (direct client writes are denied by rules). The function enforces App Check, verifies the video exists, applies the 5-per-hour limit in a Firestore transaction, and stores `userId`, `userEmail`, `youtube_id`, `videoTitle`, `message`, `status: 'new'`, `created_at`. Admins read it in the Admin Console (FR-12).

**Acceptance criteria:**
- Submitting feedback succeeds and clears the input with a confirmation state.
- A user cannot read back their own or others' submitted feedback (write-only, per Firestore rules).
- Submissions beyond the configured rate limit (NFR-3 / SRS Section 3.3.4) are rejected with a clear "try again later" message, not a silent failure.

---

### FR-10 — Class enrolment & onboarding
**User story:** As a new student, I want to tell the app which class I'm in once, so that everything I see is relevant to my class.

**Rules:**
- A student is enrolled in **exactly one class at a time** (`users.grade_preference`, `"01"`–`"12"`).
- Signed-in students get no "pick your class" grid, stage switcher or class carousel on the dashboard or syllabus. Only visitors (landing page / syllabus explorer) browse all classes.
- Changing class happens only in Profile & Settings (FR-8). The dashboard and syllabus show a "Change class" link to it.
- Global search for a student returns lessons from the enrolled class only.

**Onboarding flow (4 steps):**
1. **Your Class** — required. Shows lesson availability for the chosen class ("17 lessons available" / "lessons coming soon"). Continue stays disabled until a class is selected.
2. **Focus subjects** — optional; the list comes from the published catalogue for that class, never a hard-coded list. Empty state if the class has no lessons yet.
3. **Daily target & reminders** — the switch is pre-filled from the account (`reminders_enabled` defaults to `true` per SRS §4.1, frequency `weekly`), so the student sees and confirms the choice before any email is sent.
4. **Summary** — confirm and save (`grade_preference`, `focus_subjects`, `study_goal_minutes`, `onboarding_completed = true`, reminder settings).

**Acceptance criteria:**
- A student without `grade_preference` cannot close or skip onboarding; a student who already has a class (e.g. from email sign-up) may skip.
- Re-opening onboarding pre-fills the student's saved values, not defaults.
- Admin accounts are not asked to onboard.
- If the enrolled class has no published lessons, the dashboard shows a "coming soon" state with a link to review the class, not an empty or broken page.

---

### FR-11 — Study streak & XP
**User story:** As a student, I want an honest streak and XP count, so that my motivation numbers reflect what I actually did.

**Rules:**
- **Streak:** watching at least one lesson on an IST calendar day makes it an active day. Consecutive active days increment `users.streak_days`; after a missed day the next active day resets it to 1. `users.last_active_date` stores the last active IST date (`YYYY-MM-DD`). The streak is displayed only if the last active day is today or yesterday; otherwise it is 0.
- **XP:** 50 XP per completed lesson; level = floor(XP / 100) + 1. The dashboard level card counts lessons completed **in the enrolled class**; the profile "Total XP" counts all completed lessons.
- New accounts, including demo accounts, start at 0 streak and 0 XP.

**Acceptance criteria:**
- The header streak chip is hidden when the streak is 0.
- Dashboard, header and profile always show the same streak value.

---

### FR-12 — Admin dashboard
**User story:** As an admin, I want one dashboard to manage classes, lessons, notes, doubts and feedback without editing the database by hand.

**Layout:** a sidebar (horizontal tabs on mobile) with seven sections, showing badges for open doubts and new feedback:

| Section | What the admin can do |
|---|---|
| **Overview** | Stat tiles (students, active lessons, notes coverage %, open doubts with oldest age, new feedback), "doubts waiting longest" list, "chapters with lessons but no notes" list, and a per-class coverage table (students, subjects, chapters, lessons, notes %, open doubts, visible/hidden). Every tile and row links to the matching section. |
| **Classes & Chapters** | Three columns: Classes → Subjects → Chapters. Add, edit (display name, textbook, display order), show/hide, and delete records. "Create N records from videos" makes editable records for items that only exist in synced video rows. Each chapter row shows its notes status and links to the notes editor. |
| **Videos** | Search and filter by class, subject and visibility; add/edit with subject and chapter suggestions from the curriculum; show/hide; delete; preview. YouTube IDs are validated (11 URL-safe characters) and must be unique. |
| **Notes & Cheat Sheets** | FR-13 editor. |
| **Doubts** | FR-14 inbox. |
| **Feedback** | List of one-way feedback (FR-9), filter out reviewed items, mark new/reviewed. |
| **Data & Sync** | Backend mode, catalogue reload, create missing curriculum records, seed the sample curriculum, and how admin roles are assigned. |

**Curriculum rules:**
- Subject names and chapter IDs link videos, notes and doubts, so they cannot be renamed after creation; chapter names, class display names, textbooks and order can be edited.
- Hiding a class, subject or chapter removes it (and its lessons) from the student dashboard, syllabus and search, but keeps progress, favourites, notes and doubts.
- A record can be deleted only if it has no lessons, no notes and no child items; otherwise it can only be hidden.
- Chapters can exist without videos (e.g. notes published before lessons); students then see "Video lessons for this chapter are coming soon".

**Access rules:**
- The dashboard, its navigation entries and the Profile "Admin Console" button render only for `role == 'admin'`. Navigating to it without the role returns to the homepage.
- Admin status comes only from `users.role` and is enforced server-side by Firestore and Storage rules (SRS 3.3). Roles are assigned in the Firebase Console / Admin SDK; there is no in-app role toggle.

**Acceptance criteria:**
- A student account cannot reach the dashboard through the UI, and client writes to `classes`, `subjects`, `chapters`, `notes`, Storage `notes/**`, or its own `role` are rejected.
- Hiding a subject immediately removes its lessons from a student's syllabus and search after reload; unhiding restores them with progress intact.
- Every save or failure shows a confirmation or error message; nothing fails silently.

---

### FR-13 — Chapter notes & cheat sheets
**User story:** As an admin, I want to publish revision notes and downloadable cheat sheets per chapter. As a student, I want to open them from the chapter or the lesson I'm watching.

**Admin flow (Notes & Cheat Sheets section):**
1. Filter chapters by class, subject, status (Published / Draft / No notes) and search; hidden chapters are labelled.
2. Select a chapter and edit: optional title, summary, key points, formulas, exam tips (one item per line), and files.
3. **Files:** PDF, PNG, JPG or WEBP up to 20 MB each (1.5 MB in demo mode), multiple at once, with upload progress. A file is saved to the notes as soon as it finishes uploading, so uploads are never lost to an unsaved editor. Removing a file deletes it from storage.
4. **Save draft** (students can't see it), **Publish**, **Save & keep published**, or **Unpublish**. Publishing empty notes is blocked.
5. **Preview as student** opens the exact student view of the unsaved content.
6. Switching chapters with unsaved changes asks for confirmation. Deleting notes also deletes their files.

**Student flow:**
- The syllabus chapter header shows **Notes & cheat sheet** only for chapters with published notes. The player's **Cheat Sheet** button opens the same notes for the lesson's chapter.
- The notes window shows summary, key points, formulas, exam tips and file rows (name, type, size, Open). If nothing is published: "No notes for this chapter yet".

**Acceptance criteria:**
- Draft notes are never readable by a student (UI or direct Firestore read).
- Notes for "CH-01" of Class 10 Science never appear for "CH-01" of another class or subject (notes are keyed by class + subject + chapter).
- An uploaded file of the wrong type or over the size limit is rejected with a message naming the file.

---

### FR-14 — Doubts (private Q&A)
**User story:** As a student, I want to ask my educator a question about a lesson and get a private reply. As an admin, I want an inbox to answer them.

**Student flow:**
1. Below the player, **Ask a doubt** (10–2,000 characters) sends the question through the `askDoubt` Cloud Function. The function reads the class, subject, chapter and lesson title from the video (never from the client) and limits each student to 10 doubts per 24 hours.
2. The student's doubts for that lesson are listed under the form with status (Waiting for reply / Answered / Closed) and the reply.
3. The dashboard's **My Doubts** section lists all doubts (unread replies first, then open, then newest), expandable to show the reply, with **Open lesson** and **Mark resolved / Withdraw**.
4. A bell in the header shows the number of unread replies and jumps to My Doubts. Viewing a reply on the lesson page or expanding it on the dashboard marks it read. Updates arrive in real time.

**Admin flow (Doubts section):**
- Tabs Open / Answered / Closed / All with counts, class filter and search. Open doubts are sorted oldest first.
- The detail panel shows student name and email, class, subject, chapter, lesson, question and time; **Open lesson**; a reply box (send or update reply); **Close without reply** / **Reopen**; and whether the student has seen the last reply.

**Rules:**
- A doubt is visible only to the student who asked and to admins. Students can only mark a reply as seen or close their own doubt.
- Doubts are separate from one-way feedback (FR-9).
- Deleting an account deletes that student's doubts.

**Acceptance criteria:**
- Student B can never read student A's doubt.
- The 11th doubt within 24 hours is rejected with a clear message.
- After an admin replies, the student's bell count increases without reloading the page, and returns to zero once the reply is viewed.

---

## 4. Screen-to-requirement traceability

| Screen | Related FRs |
|---|---|
| Sign-in | FR-1 |
| Onboarding wizard | FR-10 |
| Visitor landing page (Hero Search, Jump Back In, Visual Grid of classes) | FR-4, FR-5, FR-6 |
| Student dashboard (Hero Search scoped to class, Jump Back In, subject Visual Grid, up next) | FR-4, FR-5, FR-6, FR-10, FR-11 |
| Syllabus: Subject → Chapter for the enrolled class (all classes for visitors) | FR-4, FR-5, FR-10 |
| Video player (incl. Ask a doubt, Cheat Sheet) | FR-2, FR-3, FR-6, FR-9, FR-13, FR-14 |
| Notes window | FR-13 |
| My Doubts (dashboard) & header bell | FR-14 |
| Search results / auto-complete | FR-5 |
| Profile & settings | FR-1, FR-8, FR-10, FR-11 |
| Admin dashboard (Overview, Classes & Chapters, Videos, Notes & Cheat Sheets, Doubts, Feedback, Data & Sync) | FR-9, FR-12, FR-13, FR-14 |
| Privacy policy & account deletion | NFR-1 |

## 5. QA Test Plan

Coverage the 8 QA person-days (per the project quotation) are scoped against. Each row is a test *category*, not an exhaustive case list — the actual test cases are written from these plus the acceptance criteria in Section 3.

| Area | What's verified | Linked requirement |
|---|---|---|
| Functional regression | All FR-1 to FR-14 acceptance criteria pass on each supported browser | FR-1–FR-14 |
| Cross-browser / responsive | Layout and interaction correctness on Chrome, Safari, and Firefox, at mobile/tablet/desktop breakpoints | NFR-4 |
| Security rules | Attempt cross-user reads/writes on `users`/`user_progress`/`doubts` (must fail); as a student, attempt a write to `videos`, `classes`, `subjects`, `chapters`, `notes` or Storage `notes/**`, a read of `feedback` or a draft note, a direct create in `doubts`, or setting `role` on own `users` doc (all must fail) | SRS Section 3.3, FR-12–FR-14 |
| Class enrolment | New student cannot skip class selection; dashboard, syllabus and search show only the enrolled class; changing class in Profile re-scopes all three and keeps old progress | FR-8, FR-10 |
| Streak & XP | Streak increments on consecutive IST days, resets after a missed day, hidden at 0; XP matches completed lessons on every screen | FR-11 |
| Curriculum management | Hide/show class, subject, chapter and confirm student views follow; rename chapter; delete guards; create records from videos | FR-12 |
| Notes & uploads | Draft vs published visibility (UI and direct reads), file type/size limits, upload progress, delete removes files, per-class/subject keying | FR-13 |
| Doubts | Ask → admin reply → real-time bell; cross-student read attempt fails; 10/day limit; account deletion removes doubts | FR-14 |
| Rate limiting | Exceed the 5-submissions/hour feedback limit and confirm the 6th is rejected with a clear message, not a silent drop | NFR-3 |
| Scheduled jobs | Daily and weekly reminder jobs fire only for matching `reminder_frequency`; weekly send timestamp is correct in IST, not UTC | FR-7 |
| Email lifecycle | New-user fallback copy, unsubscribe link disables reminders, SPF/DKIM/DMARC pass (mail lands in inbox, not spam) | FR-7, NFR-6 |
| Edge cases | Unavailable video, offline/slow-connection navigation, empty "Jump back in" state, deactivated-video handling | FR-3, FR-4, SRS 4.3 |
| Performance | Homepage first paint and search response times against the targets in NFR-8 | NFR-8 |
| Accessibility | Keyboard-only navigation through nav, search, and player; screen-reader labels present; color contrast check on the palette in SRS Section 2.2 | NFR-10 |
| UAT support | Assist the client through end-to-end acceptance testing before go-live | — |

## 6. Out of scope (MVP)
- Native mobile app.
- Enrolment in more than one class at the same time.
- Self-service role requests or admin invitations (roles are assigned in the Firebase Console).
- Public/shared doubt threads, file attachments in doubts, and email notifications for doubt replies (replies are in-app only).
- Rich-text or LaTeX rendering inside notes (plain text lines; formulas use Unicode).
- Multi-language support.
- Payment/premium subscription flows (`isPremium` field is reserved but unused).
- Child-specific regulatory compliance flows (deferred per SRS scope note).
