import assert from "node:assert/strict";
import test from "node:test";
import {
  TABLE_MAX_MEMBERS,
  TABLE_VOICE_NOTE_TTL_MS,
  addTableVoiceNoteMetadata,
  createTable,
  deleteTableVoiceNoteMetadata,
  getActiveTableVoiceNotes,
  getTableSharedStreak,
  inviteTableMember,
  purgeExpiredTableVoiceNotes,
  recordTableShowedUp,
  respondToTableInvite,
} from "../../src/features/table.js";

const createdAt = "2026-09-13T12:00:00.000Z";

function baseTable() {
  return createTable({ id: "table-1", ownerId: "user-1", ownerName: "Ari", createdAt });
}

test("a new Table is local state with one accepted owner", () => {
  const table = baseTable();
  assert.equal(table.schemaVersion, 1);
  assert.deepEqual(table.members, [{
    id: "user-1",
    name: "Ari",
    role: "owner",
    invitationStatus: "accepted",
    invitedAt: null,
    respondedAt: createdAt,
  }]);
  assert.deepEqual(table.activity, []);
  assert.deepEqual(table.voiceNotes, []);
});

test("invitations require an explicit answer before activity can be shared", () => {
  const invited = inviteTableMember(baseTable(), { memberId: "user-2", name: "Bea", invitedAt: createdAt });
  assert.equal(invited.members[1].invitationStatus, "invited");
  assert.throws(() => recordTableShowedUp(invited, { memberId: "user-2", date: "2026-09-13" }), /accept the invitation/);

  const accepted = respondToTableInvite(invited, "user-2", { decision: "accepted", respondedAt: createdAt });
  assert.equal(accepted.members[1].invitationStatus, "accepted");
  assert.throws(() => respondToTableInvite(accepted, "user-2", { decision: "declined" }), /already been answered/);

  const declined = respondToTableInvite(invited, "user-2", { decision: "declined", respondedAt: createdAt });
  assert.equal(declined.members[1].invitationStatus, "declined");
  assert.throws(() => recordTableShowedUp(declined, { memberId: "user-2", date: "2026-09-13" }), /accept the invitation/);
});

test("Table membership is capped at six including pending invitations", () => {
  let table = baseTable();
  for (let index = 2; index <= TABLE_MAX_MEMBERS; index += 1) {
    table = inviteTableMember(table, { memberId: `user-${index}`, name: `Member ${index}`, invitedAt: createdAt });
  }
  assert.equal(table.members.length, 6);
  assert.throws(() => inviteTableMember(table, { memberId: "user-7", name: "Seven", invitedAt: createdAt }), /at most six/);
  assert.throws(() => inviteTableMember(table, { memberId: "user-1", name: "Duplicate", invitedAt: createdAt }), /already in this Table/);
});

test("shared activity contains only the showed-up signal and deduplicates a member per date", () => {
  const invited = inviteTableMember(baseTable(), { memberId: "user-2", name: "Bea", invitedAt: createdAt });
  const accepted = respondToTableInvite(invited, "user-2", { decision: "accepted", respondedAt: createdAt });
  const first = recordTableShowedUp(accepted, {
    memberId: "user-2",
    date: "2026-09-13",
    door: "HINDUISM",
    reflection: "This stays private",
    guideQuestion: "Also private",
  });
  assert.deepEqual(first.activity, [{ memberId: "user-2", date: "2026-09-13", signal: "showed-up" }]);
  assert.equal(recordTableShowedUp(first, { memberId: "user-2", date: "2026-09-13" }), first);
  assert.equal(accepted.activity.length, 0, "actions do not mutate their input state");
  assert.throws(() => recordTableShowedUp(first, { memberId: "user-2", date: "2026-02-30" }), /real calendar date/);
});

test("shared streak counts consecutive calendar days with at least one accepted member", () => {
  let table = baseTable();
  table = inviteTableMember(table, { memberId: "user-2", name: "Bea", invitedAt: createdAt });
  table = respondToTableInvite(table, "user-2", { decision: "accepted", respondedAt: createdAt });
  table = recordTableShowedUp(table, { memberId: "user-1", date: "2026-09-11" });
  table = recordTableShowedUp(table, { memberId: "user-2", date: "2026-09-12" });
  table = recordTableShowedUp(table, { memberId: "user-1", date: "2026-09-13" });
  assert.equal(getTableSharedStreak(table, "2026-09-13"), 3);
  assert.equal(getTableSharedStreak(table, "2026-09-14"), 0);
  assert.equal(getTableSharedStreak(table, "2026-09-12"), 2);
});

test("voice notes are expiring metadata only and can be deleted or purged", () => {
  const table = addTableVoiceNoteMetadata(baseTable(), {
    id: "note-1",
    senderId: "user-1",
    createdAt,
    durationSeconds: 25,
  });
  assert.deepEqual(table.voiceNotes[0], {
    id: "note-1",
    senderId: "user-1",
    createdAt,
    expiresAt: new Date(Date.parse(createdAt) + TABLE_VOICE_NOTE_TTL_MS).toISOString(),
    durationSeconds: 25,
  });
  assert.equal("audioUrl" in table.voiceNotes[0], false);
  assert.equal("audio" in table.voiceNotes[0], false);
  assert.equal(getActiveTableVoiceNotes(table, "2026-09-20T11:59:59.999Z").length, 1);
  assert.equal(getActiveTableVoiceNotes(table, "2026-09-20T12:00:00.000Z").length, 0);
  assert.equal(purgeExpiredTableVoiceNotes(table, "2026-09-20T12:00:00.000Z").voiceNotes.length, 0);
  assert.equal(deleteTableVoiceNoteMetadata(table, "note-1").voiceNotes.length, 0);
  assert.equal(deleteTableVoiceNoteMetadata(table, "missing"), table);
  assert.throws(() => addTableVoiceNoteMetadata(baseTable(), {
    id: "bad-note", senderId: "user-1", createdAt, durationSeconds: 301,
  }), /no more than 300 seconds/);
});

