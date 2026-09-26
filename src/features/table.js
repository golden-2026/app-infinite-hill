/**
 * Local-first private-beta model for a Golden Table.
 *
 * The shared activity contract is intentionally narrow: member id, local
 * calendar date, and the literal "showed-up" signal. Door choices, lesson
 * positions, reflections, and Guide content are never accepted by these
 * actions or copied into the shared activity records.
 *
 * Voice notes are metadata only. This module does not record, upload, or store
 * audio bytes and does not provide an audio URL.
 */

export const TABLE_MAX_MEMBERS = 6;
export const TABLE_VOICE_NOTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const TABLE_ACTIVITY_SIGNAL = "showed-up";

const MEMBER_STATUSES = new Set(["invited", "accepted", "declined"]);

function requiredId(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requiredName(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError("Member name must be a non-empty string.");
  }
  return value.trim().slice(0, 80);
}

function timestamp(value, label) {
  const parsed = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(parsed)) throw new TypeError(`${label} must be a valid timestamp.`);
  return new Date(parsed).toISOString();
}

function calendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError("Date must use YYYY-MM-DD format.");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TypeError("Date must be a real calendar date.");
  }
  return value;
}

function acceptedMember(table, memberId) {
  const id = requiredId(memberId, "Member id");
  const member = table.members.find((candidate) => candidate.id === id);
  if (!member) throw new Error("Member is not part of this Table.");
  if (member.invitationStatus !== "accepted") throw new Error("Member must accept the invitation first.");
  return member;
}

function assertTable(table) {
  if (!table || table.schemaVersion !== 1 || !Array.isArray(table.members)
      || !Array.isArray(table.activity) || !Array.isArray(table.voiceNotes)) {
    throw new TypeError("Invalid Golden Table state.");
  }
}

function updated(table, patch, updatedAt = table.updatedAt) {
  assertTable(table);
  return { ...table, ...patch, updatedAt };
}

/** Creates a private, device-local Table with its owner already accepted. */
export function createTable({ id, ownerId, ownerName, createdAt }) {
  const created = timestamp(createdAt, "Created at");
  const owner = {
    id: requiredId(ownerId, "Owner id"),
    name: requiredName(ownerName),
    role: "owner",
    invitationStatus: "accepted",
    invitedAt: null,
    respondedAt: created,
  };
  return {
    schemaVersion: 1,
    id: requiredId(id, "Table id"),
    createdAt: created,
    updatedAt: created,
    members: [owner],
    activity: [],
    voiceNotes: [],
  };
}

/** Adds an invitation. Invited members count toward the six-person limit. */
export function inviteTableMember(table, { memberId, name, invitedAt = table?.updatedAt }) {
  assertTable(table);
  const id = requiredId(memberId, "Member id");
  if (table.members.some((member) => member.id === id)) throw new Error("Member is already in this Table.");
  if (table.members.length >= TABLE_MAX_MEMBERS) throw new Error("A Table can have at most six members.");
  const member = {
    id,
    name: requiredName(name),
    role: "member",
    invitationStatus: "invited",
    invitedAt: timestamp(invitedAt, "Invited at"),
    respondedAt: null,
  };
  return updated(table, { members: [...table.members, member] }, member.invitedAt);
}

/** Records an explicit accept or decline; invitations never imply consent. */
export function respondToTableInvite(table, memberId, { decision, respondedAt = table?.updatedAt }) {
  assertTable(table);
  const id = requiredId(memberId, "Member id");
  if (decision !== "accepted" && decision !== "declined") {
    throw new TypeError('Decision must be "accepted" or "declined".');
  }
  const member = table.members.find((candidate) => candidate.id === id);
  if (!member) throw new Error("Invitation was not found.");
  if (member.role === "owner") throw new Error("The Table owner is already accepted.");
  if (member.invitationStatus !== "invited") throw new Error("Invitation has already been answered.");
  const responseTime = timestamp(respondedAt, "Responded at");
  return updated(table, {
    members: table.members.map((candidate) => candidate.id === id
      ? { ...candidate, invitationStatus: decision, respondedAt: responseTime }
      : candidate),
  }, responseTime);
}

/**
 * Shares only the fact that an accepted member showed up on a date.
 * Extra caller fields (including Door or reflection data) are discarded.
 */
export function recordTableShowedUp(table, { memberId, date }) {
  assertTable(table);
  const member = acceptedMember(table, memberId);
  const day = calendarDate(date);
  if (table.activity.some((entry) => entry.memberId === member.id && entry.date === day)) return table;
  const signal = { memberId: member.id, date: day, signal: TABLE_ACTIVITY_SIGNAL };
  return updated(table, { activity: [...table.activity, signal] }, `${day}T23:59:59.999Z`);
}

/** Returns the Table's consecutive days with at least one accepted member showing up. */
export function getTableSharedStreak(table, asOfDate) {
  assertTable(table);
  const cursor = new Date(`${calendarDate(asOfDate)}T00:00:00.000Z`);
  const activeIds = new Set(table.members
    .filter((member) => member.invitationStatus === "accepted")
    .map((member) => member.id));
  const activeDates = new Set(table.activity
    .filter((entry) => entry.signal === TABLE_ACTIVITY_SIGNAL && activeIds.has(entry.memberId))
    .map((entry) => entry.date));

  let streak = 0;
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** Creates expiring voice-note metadata; no recording or audio location is accepted. */
export function addTableVoiceNoteMetadata(table, {
  id,
  senderId,
  createdAt = table?.updatedAt,
  expiresAt,
  durationSeconds,
}) {
  assertTable(table);
  const sender = acceptedMember(table, senderId);
  const created = timestamp(createdAt, "Created at");
  const expiry = timestamp(expiresAt ?? Date.parse(created) + TABLE_VOICE_NOTE_TTL_MS, "Expires at");
  if (Date.parse(expiry) <= Date.parse(created)) throw new RangeError("Voice note must expire after it is created.");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 300) {
    throw new RangeError("Voice-note duration must be greater than 0 and no more than 300 seconds.");
  }
  const noteId = requiredId(id, "Voice-note id");
  if (table.voiceNotes.some((note) => note.id === noteId)) throw new Error("Voice-note id already exists.");
  const note = { id: noteId, senderId: sender.id, createdAt: created, expiresAt: expiry, durationSeconds };
  return updated(table, { voiceNotes: [...table.voiceNotes, note] }, created);
}

/** Deletes one voice-note metadata record immediately. */
export function deleteTableVoiceNoteMetadata(table, noteId) {
  assertTable(table);
  const id = requiredId(noteId, "Voice-note id");
  const voiceNotes = table.voiceNotes.filter((note) => note.id !== id);
  if (voiceNotes.length === table.voiceNotes.length) return table;
  return updated(table, { voiceNotes });
}

/** Removes expired note metadata and reports the resulting local state. */
export function purgeExpiredTableVoiceNotes(table, now = table?.updatedAt) {
  assertTable(table);
  const cutoff = Date.parse(timestamp(now, "Current time"));
  const voiceNotes = table.voiceNotes.filter((note) => Date.parse(note.expiresAt) > cutoff);
  if (voiceNotes.length === table.voiceNotes.length) return table;
  return updated(table, { voiceNotes });
}

export function getActiveTableVoiceNotes(table, now = table?.updatedAt) {
  assertTable(table);
  const cutoff = Date.parse(timestamp(now, "Current time"));
  return table.voiceNotes.filter((note) => Date.parse(note.expiresAt) > cutoff).map((note) => ({ ...note }));
}
