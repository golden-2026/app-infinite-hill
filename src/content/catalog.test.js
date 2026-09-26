import test from 'node:test';
import assert from 'node:assert/strict';
import { DOOR_CATALOG, getDoor, getSession, getSessionAvailability, listDoorSessions, getPracticeRung, getReleaseGate, assertPublishable } from './catalog.js';

test('all eight doors distinguish manuscript availability from prototype outlines', () => {
  assert.equal(DOOR_CATALOG.length, 8);
  assert.deepEqual(Object.fromEntries(DOOR_CATALOG.map(d => [d.id, d.authoredSessions])), {
    CHRISTIANITY: 7, CATHOLIC: 0, HINDUISM: 21, ISLAM: 1, JUDAISM: 0, BUDDHISM: 0, SIKHISM: 0, SPIRITUAL: 0,
  });
  for (const door of DOOR_CATALOG) {
    assert.equal(door.camps.length, 5);
    assert.equal(door.ranges.playable, false);
    assert.equal(door.publishable, false);
  }
});

test('designed content cannot become playable just because prototype generated text for it', () => {
  for (const [door, lesson] of [['CATHOLIC', 1], ['CHRISTIANITY', 8], ['ISLAM', 2], ['HINDUISM', 22]]) {
    const session = getSession(door, lesson);
    assert.equal(session.status, 'designed');
    assert.equal(session.canPreview, false);
    assert.deepEqual(session.segments, []);
    assert.equal(getReleaseGate(session).publishable, false);
  }
});

test('all 29 authored manuscripts retain every beat and meaningful teaching', () => {
  const authored = DOOR_CATALOG.flatMap(d => listDoorSessions(d.id, { authoredOnly: true }));
  assert.equal(authored.length, 29);
  for (const session of authored) {
    assert.deepEqual(session.segments.map(s => s.type), ['the bell', 'review', 'the hook', 'the teach', 'the practice', 'the word', 'the carry', 'the close']);
    assert.ok(session.segments.find(s => s.type === 'the teach').voice.length > 300, session.id);
    assert.ok(session.segments.every(s => s.provenance.line > 0 && s.provenance.path.endsWith('.md')));
    assert.equal(session.canPreview, true);
    assert.equal(session.publishable, false);
  }
});

test('new manuscripts supersede old embedded lessons without adding celebrity welcomes', () => {
  const hindu = getSession('HINDUISM', 1);
  assert.equal(hindu.length, '4:50');
  assert.match(hindu.segments.find(s => s.type === 'the practice').voice, /[Oo]ne breath/);
  assert.equal(getSession('CHRISTIANITY', 4).word, 'Our Father');
  assert.equal(getSession('ISLAM', 1).title, "the greeting that's actually a gift");
  for (const door of DOOR_CATALOG) for (const s of listDoorSessions(door.id, { authoredOnly: true })) {
    assert.doesNotMatch(s.segments.map(g => g.voice).join('\n'), /I'm (Priyanka Chopra|Denzel Washington|Mahershala Ali)/);
  }
});

test('practice policy is based on lesson position and stale scripts stay explicitly flagged', () => {
  assert.deepEqual(getPracticeRung(1), { mode: 'breath', n: 1 });
  assert.deepEqual(getPracticeRung(3), { mode: 'breath', n: 3 });
  assert.deepEqual(getPracticeRung(8), { mode: 'sit', secs: 45 });
  assert.deepEqual(getPracticeRung(15), { mode: 'sit', secs: 75 });
  assert.equal(getSession('HINDUISM', 7).needsPracticeRevision, false);
  assert.equal(getSession('HINDUISM', 8).needsPracticeRevision, true);
  assert.equal(getSession('ISLAM', 1).needsPracticeRevision, true);
});

test('production rejects unreviewed drafts, unknown sessions and an empty release', () => {
  assert.throws(() => assertPublishable([getSession('HINDUISM', 1)]), /Keeper approval/);
  assert.throws(() => assertPublishable([null]), /not in the supplied catalog/);
  assert.throws(() => assertPublishable([]), /nonempty/);
  assert.equal(getSessionAvailability('HINDUISM', 9999).canPreview, false);
  assert.equal(getSession('UNKNOWN', 1), null);
  assert.equal(getSession('HINDUISM', NaN), null);
  assert.equal(getDoor('UNKNOWN'), null);
});

test('approval must contain evidence for the same revision; status labels alone do not unlock', () => {
  const original = getSession('HINDUISM', 1);
  const candidate = { ...original, keeperApproval: { status: 'approved' }, voiceApproval: { status: 'approved' } };
  assert.equal(getReleaseGate(candidate).publishable, false);
  candidate.keeperApproval = { status: 'approved', reviewer: 'fixture reviewer', evidence: 'fixture://signed', approvedAt: '2026-09-12', contentRevision: original.contentRevision };
  candidate.voiceApproval = { status: 'approved', evidence: 'fixture://rights', contentRevision: original.contentRevision };
  assert.equal(getReleaseGate(candidate).publishable, true);
  candidate.keeperApproval.contentRevision = 'obsolete';
  assert.equal(getReleaseGate(candidate).publishable, false);
  assert.equal(getSession('HINDUISM', 1).publishable, false);
});

test('query results cannot mutate content or fabricate catalog approvals', () => {
  const session = getSession('HINDUISM', 1);
  assert.throws(() => { session.keeperApproval = { status: 'approved' }; }, TypeError);
  assert.throws(() => { session.segments[3].voice = 'replacement'; }, TypeError);
  const results = listDoorSessions('HINDUISM');
  results.pop();
  assert.equal(listDoorSessions('HINDUISM').length, getDoor('HINDUISM').mappedSessions);
});
