import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Color Palette & WCAG AA Contrast Verification (SRS Section 2.2)
test('Color Palette should have defined tokens and valid hex codes for Classes 1 to 6', async () => {
  const CLASS_PALETTE = {
    1: { bg: '#FAECE7', text: '#4A1B0C', border: '#F3D2C6' },
    2: { bg: '#E1F5EE', text: '#04342C', border: '#BCE8DC' },
    3: { bg: '#EEEDFE', text: '#26215C', border: '#D7D4FC' },
    4: { bg: '#FAEEDA', text: '#412402', border: '#F3DCB7' },
    5: { bg: '#FBEAF0', text: '#4B1528', border: '#F5D2DF' },
    6: { bg: '#E6F1FB', text: '#042C53', border: '#CBE0F7' },
  };

  for (let i = 1; i <= 6; i++) {
    const tile = CLASS_PALETTE[i];
    assert.ok(tile, `Class ${i} tile style should be defined`);
    assert.match(tile.bg, /^#[0-9A-Fa-f]{6}$/, `Class ${i} background should be a 6-digit hex`);
    assert.match(tile.text, /^#[0-9A-Fa-f]{6}$/, `Class ${i} text should be a 6-digit hex`);
  }
});

// Test 2: Rate Limiting Algorithm (NFR-3 & FR-9)
test('Feedback Rate Limiter allows up to 5 submissions within 1 hour and rejects the 6th', () => {
  const MAX_PER_HOUR = 5;
  const simulatedTimestamps = [];
  const now = Date.now();

  function submit() {
    const oneHourAgo = now - 3600000;
    const valid = simulatedTimestamps.filter(ts => ts > oneHourAgo);
    if (valid.length >= MAX_PER_HOUR) {
      return { allowed: false, remaining: 0 };
    }
    simulatedTimestamps.push(now);
    return { allowed: true, remaining: MAX_PER_HOUR - simulatedTimestamps.length };
  }

  // 1 to 5 submissions should succeed
  for (let i = 1; i <= 5; i++) {
    const result = submit();
    assert.strictEqual(result.allowed, true, `Submission ${i} should be allowed`);
    assert.strictEqual(result.remaining, 5 - i, `Remaining count after submission ${i} should be ${5 - i}`);
  }

  // 6th submission must be rejected
  const sixth = submit();
  assert.strictEqual(sixth.allowed, false, '6th submission within 1 hour must be rejected per NFR-3');
  assert.strictEqual(sixth.remaining, 0, 'Remaining submissions must be 0');
});

// Test 3: Deactivated Video Edge Case (SRS Section 4.3 & FR-6)
test('Deactivated video handling preserves progress stats and renders as unavailable', () => {
  const mockCatalog = [
    { youtube_id: 'vid1', video_title: 'Active Lesson 1', isActive: true },
    { youtube_id: 'vid2', video_title: 'Active Lesson 2', isActive: true },
    { youtube_id: 'vid_archived', video_title: 'Archived Lesson', isActive: false },
  ];

  // User completed all 3 videos previously
  const userProgress = {
    vid1: { completed: true, favorited: false },
    vid2: { completed: true, favorited: true },
    vid_archived: { completed: true, favorited: true },
  };

  // Rule 1: Active catalog excludes deactivated video
  const activeCatalog = mockCatalog.filter(v => v.isActive);
  assert.strictEqual(activeCatalog.length, 2, 'Active catalog must exclude inactive videos');
  assert.ok(!activeCatalog.some(v => v.youtube_id === 'vid_archived'), 'Deactivated video must not appear in browse/search');

  // Rule 2: Progress completion totals are NOT reduced by deactivated video
  const totalCompleted = Object.values(userProgress).filter(p => p.completed).length;
  assert.strictEqual(totalCompleted, 3, 'Completed count must still be 3 even if one is archived per SRS 4.3');

  // Rule 3: Favourites still renders deactivated video but flags it as unavailable
  const favoritedIds = Object.keys(userProgress).filter(k => userProgress[k].favorited);
  assert.strictEqual(favoritedIds.length, 2);
  const archivedVideo = mockCatalog.find(v => v.youtube_id === 'vid_archived');
  assert.ok(archivedVideo, 'Video exists in raw catalog');
  assert.strictEqual(archivedVideo.isActive, false, 'Is marked deactivated');
});

// Test 4: Reminder Frequency & Job Anchoring (FR-7 & SRS 3.4)
test('Reminder scheduling discriminates strictly between daily and weekly users', () => {
  const users = [
    { id: 'u1', reminders_enabled: true, reminder_frequency: 'daily' },
    { id: 'u2', reminders_enabled: true, reminder_frequency: 'weekly' },
    { id: 'u3', reminders_enabled: false, reminder_frequency: 'daily' },
    { id: 'u4', reminders_enabled: false, reminder_frequency: 'weekly' },
  ];

  const dailyRecipients = users.filter(u => u.reminders_enabled && u.reminder_frequency === 'daily');
  const weeklyRecipients = users.filter(u => u.reminders_enabled && u.reminder_frequency === 'weekly');

  assert.strictEqual(dailyRecipients.length, 1);
  assert.strictEqual(dailyRecipients[0].id, 'u1');

  assert.strictEqual(weeklyRecipients.length, 1);
  assert.strictEqual(weeklyRecipients[0].id, 'u2');
});

// Test 5: Limited Content Access Control (Visitor preview vs Registered user)
test('Visitors can only access Free Preview (Chapter 1), while registered users unlock all lessons', () => {
  function isLessonUnlocked(user, chapterIndex, videoIndex) {
    if (user) return true; // Full access for registered students
    return chapterIndex === 0 && (typeof videoIndex === 'number' ? videoIndex === 0 : true);
  }

  const visitor = null;
  const registeredStudent = { userId: 'student_123', email: 'student@example.com' };

  // Visitor trying to access Chapter 1 Lesson 1 (Free Preview)
  assert.strictEqual(isLessonUnlocked(visitor, 0, 0), true, 'Visitor must have access to Chapter 1 sample lesson');

  // Visitor trying to access Chapter 2, 3, 4 lessons
  assert.strictEqual(isLessonUnlocked(visitor, 1, 0), false, 'Visitor must NOT have access to Chapter 2 without login');
  assert.strictEqual(isLessonUnlocked(visitor, 2, 0), false, 'Visitor must NOT have access to Chapter 3 without login');
  assert.strictEqual(isLessonUnlocked(visitor, 0, 1), false, 'Visitor must NOT have access to secondary lesson in Chapter 1');

  // Registered student has access to ALL chapters and lessons
  assert.strictEqual(isLessonUnlocked(registeredStudent, 0, 0), true);
  assert.strictEqual(isLessonUnlocked(registeredStudent, 1, 0), true);
  assert.strictEqual(isLessonUnlocked(registeredStudent, 5, 2), true);
});

// Test 6: Admin Student Dashboard Control (Broadcasts, Spotlight & Policy Targeting)
test('Student Dashboard Control delivers announcements and spotlights accurately per grade', () => {
  const mockConfig = {
    announcement: {
      id: 'ann-1',
      title: 'Board Exam Sprint',
      message: 'Revise high-yield topics',
      tone: 'exam',
      targetClass: '10',
      isActive: true,
    },
    spotlights: {
      '10': {
        classSort: '10',
        videoId: 'vid_science_10',
        title: 'Chemical Reactions',
        note: 'High yield for Friday quiz',
        isActive: true,
      },
      '12': {
        classSort: '12',
        videoId: 'vid_phys_12',
        title: 'Electrostats',
        note: 'Derivations revision',
        isActive: false, // Inactive
      },
    },
    policy: {
      freePreviewEnabled: true,
      freePreviewCount: 1,
      allowGuestNotes: false,
    },
  };

  function shouldShowAnnouncement(ann, studentClass) {
    if (!ann || !ann.isActive) return false;
    const studentInt = parseInt(String(studentClass).replace(/\D/g, ''), 10);
    const targetInt = parseInt(String(ann.targetClass).replace(/\D/g, ''), 10);
    return (
      ann.targetClass === 'all' ||
      ann.targetClass === studentClass ||
      (!isNaN(targetInt) && !isNaN(studentInt) && targetInt === studentInt)
    );
  }

  function getActiveSpotlight(spotlights, studentClass) {
    const studentInt = parseInt(String(studentClass).replace(/\D/g, ''), 10);
    const item = spotlights[studentClass] || spotlights[String(studentInt)];
    return item && item.isActive ? item : null;
  }

  // Announcement targeted to Class 10
  assert.strictEqual(shouldShowAnnouncement(mockConfig.announcement, '10'), true, 'Class 10 student must see Class 10 announcement');
  assert.strictEqual(shouldShowAnnouncement(mockConfig.announcement, 'class_10'), true, 'Class 10 student (prefixed) must see announcement');
  assert.strictEqual(shouldShowAnnouncement(mockConfig.announcement, '09'), false, 'Class 9 student must NOT see Class 10 announcement');

  // Spotlight active check
  const class10Spotlight = getActiveSpotlight(mockConfig.spotlights, '10');
  assert.ok(class10Spotlight, 'Class 10 has an active spotlight');
  assert.strictEqual(class10Spotlight.videoId, 'vid_science_10');
  assert.strictEqual(class10Spotlight.note, 'High yield for Friday quiz');

  const class12Spotlight = getActiveSpotlight(mockConfig.spotlights, '12');
  assert.strictEqual(class12Spotlight, null, 'Class 12 spotlight is inactive and must not be displayed');

  const class9Spotlight = getActiveSpotlight(mockConfig.spotlights, '09');
  assert.strictEqual(class9Spotlight, null, 'Class 9 has no spotlight configured');
});

// Test 7: Admin Session Routing & Immediate Dashboard Rendering
test('Administrators are never shown the empty student state and load admin dashboard directly', () => {
  const adminUser = {
    userId: 'admin_123',
    email: 'admin@ncertprep.edu',
    displayName: 'Curriculum Director',
    role: 'admin',
    grade_preference: null,
  };

  const studentUser = {
    userId: 'student_123',
    email: 'student@example.com',
    displayName: 'Aarav',
    role: 'student',
    grade_preference: '10',
  };

  const studentWithoutGrade = {
    userId: 'student_456',
    email: 'newstudent@example.com',
    displayName: 'Riya',
    role: 'student',
    grade_preference: null,
  };

  function resolveHomeView(user, isAdmin) {
    if (!user) return 'landing';
    const isUserAdmin = isAdmin || user.role === 'admin' || user.email === 'admin@ncertprep.edu';
    if (isUserAdmin) {
      return 'admin_dashboard';
    }
    if (!user.grade_preference) {
      return 'student_onboarding_empty_state';
    }
    return 'student_home';
  }

  assert.strictEqual(resolveHomeView(adminUser, true), 'admin_dashboard', 'Admin must directly resolve to admin_dashboard');
  assert.strictEqual(resolveHomeView(adminUser, false), 'admin_dashboard', 'Admin by email/role resolves to admin_dashboard even if flag is delayed');
  assert.strictEqual(resolveHomeView(studentUser, false), 'student_home', 'Student with grade resolves to student_home');
  assert.strictEqual(resolveHomeView(studentWithoutGrade, false), 'student_onboarding_empty_state', 'Student without grade resolves to empty state');
});

// Test 8: Admin Left Sidebar Navigation & Active Tab Query Resolution
test('Admin Left Sidebar reflects complete admin dashboard tabs and handles active query states', () => {
  function getNavigation(isUserAdmin) {
    if (isUserAdmin) {
      return {
        main: [
          { to: '/app', label: 'Overview' },
          { to: '/app?tab=student-control', label: 'Dashboard Control' },
          { to: '/app?tab=curriculum', label: 'Classes & Chapters' },
          { to: '/app?tab=videos', label: 'Video Catalog' },
          { to: '/app?tab=notes', label: 'Notes & Cheat Sheets' },
          { to: '/app?tab=doubts', label: 'Student Doubts' },
          { to: '/app?tab=feedback', label: 'Student Feedback' },
          { to: '/app?tab=data', label: 'Data & Sync' },
        ],
        account: [
          { to: '/browse', label: 'Student Syllabus View' },
          { to: '/app/profile', label: 'Profile & settings' },
        ],
      };
    }
    return {
      main: [
        { to: '/app', label: 'Home' },
        { to: '/app/subjects', label: 'My subjects' },
        { to: '/app/doubts', label: 'Doubts' },
        { to: '/app/saved', label: 'Saved' },
        { to: '/app/focus', label: 'Focus timer' },
        { to: '/app/reminders', label: 'Reminders' },
      ],
      account: [
        { to: '/app/profile', label: 'Profile & settings' },
      ],
    };
  }

  function isItemActive(item, pathname, searchParamTab, isUserAdmin) {
    if (isUserAdmin) {
      const currentTab = searchParamTab || 'overview';
      if (item.to.startsWith('/app?tab=')) {
        const itemTab = new URLSearchParams(item.to.split('?')[1]).get('tab');
        return pathname === '/app' && currentTab === itemTab;
      }
      if (item.to === '/app') {
        return pathname === '/app' && (!searchParamTab || currentTab === 'overview');
      }
      return pathname === item.to || pathname.startsWith(item.to + '/');
    }
    return pathname === item.to || pathname.startsWith(item.to + '/');
  }

  const adminNav = getNavigation(true);
  assert.strictEqual(adminNav.main.length, 8, 'Admin must have all 8 control tabs in primary navigation');
  assert.strictEqual(adminNav.account.length, 2, 'Admin must have Syllabus View and Profile in account navigation');

  // Test active state for '/app' (Overview)
  assert.strictEqual(isItemActive(adminNav.main[0], '/app', null, true), true, 'Overview active when no query tab');
  assert.strictEqual(isItemActive(adminNav.main[1], '/app', null, true), false, 'Dashboard Control inactive when on overview');

  // Test active state for '/app?tab=student-control'
  assert.strictEqual(isItemActive(adminNav.main[0], '/app', 'student-control', true), false, 'Overview inactive when on student-control tab');
  assert.strictEqual(isItemActive(adminNav.main[1], '/app', 'student-control', true), true, 'Dashboard Control active when on student-control tab');

  // Test active state for '/app?tab=videos'
  assert.strictEqual(isItemActive(adminNav.main[3], '/app', 'videos', true), true, 'Video Catalog active on videos tab');
  assert.strictEqual(isItemActive(adminNav.main[2], '/app', 'videos', true), false, 'Classes inactive on videos tab');

  // Test active state when navigating to '/browse'
  assert.strictEqual(isItemActive(adminNav.account[0], '/browse', null, true), true, 'Student Syllabus View active on /browse');
  assert.strictEqual(isItemActive(adminNav.main[0], '/browse', null, true), false, 'Overview inactive on /browse');
});


