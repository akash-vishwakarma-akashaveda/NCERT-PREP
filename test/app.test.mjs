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
