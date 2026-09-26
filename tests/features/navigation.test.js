import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOLDEN_VIEWS,
  buildDoorLink,
  buildGoldenLink,
  buildLessonLink,
  buildScreenLink,
  parseGoldenLink,
} from '../../src/features/navigation.js';

const screenIds = ['house-map', 'mountain-map', 'checkout-success', 'checkout-cancelled'];
const parse = (input) => parseGoldenLink(input, { screenIds });

test('accepts each supported direct view and preserves embed query links', () => {
  for (const view of GOLDEN_VIEWS) {
    const target = parse(`/?view=${view}&embed=1`);
    assert.equal(target.view, view);
    assert.equal(target.embed, true);
    assert.equal(target.valid, true);
  }
});

test('keeps legacy door-only and existing app query links valid', () => {
  assert.deepEqual(parse('/?door=HINDUISM'), {
    view: 'today', door: 'HINDUISM', lesson: null, screen: null, commerceReturn: null, embed: false, valid: true, issues: [],
  });
  assert.equal(parse('/?view=guide&door=CHRISTIANITY&embed=1').view, 'guide');
  assert.equal(parse('/?view=account').view, 'account');
  assert.equal(parse('/?view=me').view, 'me');
  assert.equal(parse('/?view=why').view, 'why');
});

test('builds stable Today, Door, and view links', () => {
  assert.equal(buildGoldenLink(), '/');
  assert.equal(buildDoorLink('HINDUISM'), '/?door=HINDUISM');
  assert.equal(buildGoldenLink({ view: 'guide', door: 'ISLAM', embed: true }), '/?door=ISLAM&view=guide&embed=1');
  assert.deepEqual(parse(buildGoldenLink({ view: 'why', door: 'BUDDHISM' })), {
    view: 'why', door: 'BUDDHISM', lesson: null, screen: null, commerceReturn: null, embed: false, valid: true, issues: [],
  });
});

test('lesson deep links round trip only when the catalog has a preview manuscript', () => {
  const link = buildLessonLink('HINDUISM', 1);
  assert.equal(link, '/?door=HINDUISM&lesson=1');
  assert.deepEqual(parse(link), {
    view: 'today', door: 'HINDUISM', lesson: 1, screen: null, commerceReturn: null, embed: false, valid: true, issues: [],
  });

  // Explicit lesson links and historical view links use the same safe route.
  assert.equal(parse('/?view=lesson&door=CHRISTIANITY&lesson=7').lesson, 7);
  assert.equal(parse('/?view=today&door=HINDUISM&lesson=22').lesson, null);
  assert.throws(() => buildLessonLink('HINDUISM', 22), /not previewable/);
});

test('fails closed for unknown views, doors, and malformed lesson inputs', () => {
  const unknownView = parse('/?view=admin&door=HINDUISM');
  assert.equal(unknownView.view, 'today');
  assert.equal(unknownView.valid, false);
  assert.deepEqual(unknownView.issues, ['unknown-view']);

  const unknownDoor = parse('/?view=guide&door=UNKNOWN&lesson=1');
  assert.equal(unknownDoor.door, null);
  assert.equal(unknownDoor.lesson, null);
  assert.deepEqual(unknownDoor.issues, ['unknown-door', 'lesson-needs-door']);

  assert.deepEqual(parse('/?door=HINDUISM&lesson=0').issues, ['invalid-lesson']);
  assert.deepEqual(parse('/?lesson=1').issues, ['lesson-needs-door']);
  assert.throws(() => buildGoldenLink({ view: 'admin' }), /Unsupported Golden view/);
  assert.throws(() => buildDoorLink('UNKNOWN'), /Unsupported Golden Door/);
});

test('accepts only registered experience screens', () => {
  assert.equal(parse('/?screen=house-map').screen, 'house-map');
  assert.equal(parse('/?screen=mountain-map').screen, 'mountain-map');
  const unknown = parse('/?screen=admin-console');
  assert.equal(unknown.screen, null);
  assert.equal(unknown.valid, false);
  assert.deepEqual(unknown.issues, ['unknown-screen']);

  assert.equal(buildScreenLink('mountain-map', { screenIds }), '/?screen=mountain-map');
  assert.throws(() => buildScreenLink('admin-console', { screenIds }), /Unsupported Golden screen/);
});

test('maps checkout returns to unverified result screens', () => {
  const returned = parse('/?commerce=success&session_id=cs_test_browser_value');
  assert.equal(returned.screen, 'checkout-success');
  assert.deepEqual(returned.commerceReturn, { outcome: 'success', verified: false, sessionId: 'cs_test_browser_value' });
  assert.equal(returned.valid, true);

  const cancelled = parse('/?commerce=cancelled');
  assert.equal(cancelled.screen, 'checkout-cancelled');
  assert.deepEqual(cancelled.commerceReturn, { outcome: 'cancelled', verified: false });

  const unknown = parse('/?commerce=paid');
  assert.equal(unknown.screen, null);
  assert.equal(unknown.commerceReturn, null);
  assert.deepEqual(unknown.issues, ['unknown-commerce-return']);
});

test('supports a non-root base path without losing query separators', () => {
  assert.equal(buildGoldenLink({ view: 'together' }, { base: '/app' }), '/app?view=together');
  assert.equal(buildGoldenLink({ view: 'guide' }, { base: '/?source=site' }), '/?source=site&view=guide');
});
