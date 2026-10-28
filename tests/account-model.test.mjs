import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNext, profileFromUser, profileMetadata, initials, attemptKey, mergeAttempts, validAttempt, progressSummary, attemptRoute } from '../src/lib/account-model.mjs';
const attempt = { id: 'practice-reading-1:123', test_id: 'practice-reading-1', title: 'Test 1', resource: 'reading', correct: 30, total: 40, checked: 40, band: '7.0', finished_at: '2026-10-28T07:00:00Z', duration_seconds: 600 };
test('external redirects and disguised protocol-relative URLs are rejected', () => {
  for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/\nevil.test', null]) assert.equal(safeNext(path), '/?view=profile');
  assert.equal(safeNext('/?view=reading'), '/?view=reading');
});
test('profile validates bands and only writes allowed metadata', () => {
  const profile = { name: ' Learner ', targetBand: 7.5, examDate: '2026-12-03', language: 'uz', avatar: 'ocean', role: 'admin' };
  assert.deepEqual(profileMetadata(profile), { display_name: 'Learner', target_band: 7.5, exam_date: '2026-12-03', learning_language: 'uz', avatar_color: 'ocean' });
  for (const targetBand of [NaN, Infinity, 0, 9.5, 7.1]) assert.throws(() => profileMetadata({ ...profile, targetBand }));
  assert.throws(() => profileMetadata({ ...profile, name: '' }));
  assert.throws(() => profileMetadata({ ...profile, language: 'javascript:' }));
});
test('provider profile has safe defaults and Unicode initials', () => {
  assert.equal(profileFromUser({ user_metadata: { full_name: 'Али Карим', target_band: 'oops', avatar_color: 'url(x)' } }).targetBand, 7);
  assert.equal(initials(' Али Карим '), 'АК');
  assert.equal(initials(''), 'L');
});
test('attempt ownership keys are separate and routes only use recognised tests', () => {
  assert.notEqual(attemptKey('alice'), attemptKey('bob'));
  assert.notEqual(attemptKey('alice'), attemptKey(null));
  assert.equal(attemptRoute(attempt), '/practice/reading/1');
  assert.equal(attemptRoute({ test_id: 'single-listening-24' }), '/practice/listening/single/24');
  assert.equal(attemptRoute({ test_id: 'https://evil.test' }), '/');
});
test('history merges idempotently and rejects malformed results', () => {
  assert.equal(validAttempt(attempt), true);
  assert.equal(validAttempt({ ...attempt, correct: 41 }), false);
  assert.equal(validAttempt({ ...attempt, checked: 20 }), false);
  assert.equal(validAttempt({ ...attempt, duration_seconds: -1 }), false);
  assert.equal(mergeAttempts([attempt], [{ ...attempt, synced: true }]).length, 1);
  assert.equal(mergeAttempts([attempt], [{ ...attempt, synced: true }])[0].synced, true);
});
test('single sections contribute accuracy without inventing a band', () => {
  const single = { ...attempt, id: 'single-listening-1:123', test_id: 'single-listening-1', resource: 'listening', total: 10, checked: 10, correct: 8, band: null };
  const stats = progressSummary([single, attempt]);
  assert.deepEqual(stats.listening, { count: 1, accuracy: 80, latestBand: null });
  assert.equal(stats.reading.latestBand, '7.0');
  assert.equal(progressSummary([]).reading.accuracy, null);
});
