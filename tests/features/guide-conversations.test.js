import assert from "node:assert/strict";
import test from "node:test";
import {
  addGuideMessage,
  clearGuideHistory,
  createGuideConversation,
  createGuideReport,
  deleteGuideConversation,
  GUIDE_MODES,
  GUIDE_RETENTION,
  GUIDE_STORAGE_KEYS,
  loadGuideConversations,
  loadGuideRetention,
  loadGuideReports,
  resolveGuideMode,
  saveGuideConversation,
  saveGuideReport,
  setGuideRetention,
} from "../../src/features/guide-conversations.js";

function memoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
    has: (key) => items.has(key),
  };
}

test("Guide mode reports provider, lesson, offline, rate-limited, and unavailable states explicitly", () => {
  assert.equal(resolveGuideMode({ accessMode: "provider", providerState: "ready", online: true }), GUIDE_MODES.provider);
  assert.equal(resolveGuideMode({ accessMode: "lesson", providerState: "ready", online: true }), GUIDE_MODES.lesson);
  assert.equal(resolveGuideMode({ accessMode: "provider", providerState: "ready", online: false }), GUIDE_MODES.offline);
  assert.equal(resolveGuideMode({ accessMode: "provider", providerState: "rate_limited", online: true }), GUIDE_MODES.rateLimited);
  assert.equal(resolveGuideMode({ accessMode: "provider", providerState: "not_configured", online: true }), GUIDE_MODES.unavailable);
});

test("conversation persists locally only after an explicit retention choice and keeps only supplied citations", () => {
  const storage = memoryStorage();
  const start = "2026-09-13T12:00:00.000Z";
  let conversation = createGuideConversation({ door: "HINDUISM", consentMode: "provider", conversationId: "g-1", now: start });
  conversation = addGuideMessage(conversation, { role: "user", content: "What is dharma?", mode: GUIDE_MODES.provider, id: "m-1" }, start);
  conversation = addGuideMessage(conversation, {
    role: "assistant", content: "A brief answer.", mode: GUIDE_MODES.provider, id: "m-2",
    sources: [{ title: "Bhagavad Gita", citation: "Gita 2.47", excerpt: "Supplied passage." }, { title: "Possible source, no citation" }],
  }, start);

  assert.equal(saveGuideConversation(storage, conversation, { now: start }), false);
  assert.deepEqual(loadGuideConversations(storage, { now: start }), []);
  setGuideRetention(storage, GUIDE_RETENTION.sevenDays, { now: start });
  assert.equal(saveGuideConversation(storage, conversation, { now: start }), true);
  const loaded = loadGuideConversations(storage, { now: start });
  assert.equal(loaded.length, 1);
  assert.deepEqual(loaded[0].messages[1].sources, [{ citation: "Gita 2.47", title: "Bhagavad Gita", excerpt: "Supplied passage." }]);
  assert.equal(loadGuideConversations(storage, { now: "2026-09-21T12:00:00.000Z" }).length, 0);
});

test("retention can be changed and one saved conversation can be deleted", () => {
  const storage = memoryStorage();
  const now = "2026-09-13T12:00:00.000Z";
  let conversation = createGuideConversation({ door: "BUDDHISM", conversationId: "g-2", now });
  conversation = addGuideMessage(conversation, { role: "user", content: "A question" }, now);
  saveGuideConversation(storage, conversation, { retentionDays: GUIDE_RETENTION.thirtyDays, now });
  assert.equal(loadGuideConversations(storage, { now }).length, 1);
  assert.equal(deleteGuideConversation(storage, "g-2"), 0);
  assert.equal(storage.has(GUIDE_STORAGE_KEYS.conversations), false);
  assert.deepEqual(setGuideRetention(storage, GUIDE_RETENTION.session, { now }), { retentionDays: 0, conversations: [] });
  assert.equal(loadGuideRetention(storage), GUIDE_RETENTION.session);
  assert.throws(() => setGuideRetention(storage, 14), /Choose session-only/);
});

test("reports are local records and clear history removes both threads and reports", () => {
  const storage = memoryStorage();
  const report = createGuideReport({ conversationId: "g-3", messageId: "m-9", category: "citation", details: "Check the reference", reportId: "r-1", now: "2026-09-13T12:00:00Z" });
  assert.equal(report.delivery, "device_only");
  assert.equal(saveGuideReport(storage, report), true);
  assert.equal(loadGuideReports(storage)[0].details, "Check the reference");
  assert.throws(() => createGuideReport({ category: "billing" }), /supported Guide report category/);
  clearGuideHistory(storage);
  assert.equal(storage.has(GUIDE_STORAGE_KEYS.reports), false);
  assert.deepEqual(loadGuideReports(storage), []);
});
