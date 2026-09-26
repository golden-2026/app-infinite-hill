import { sourceMap, laterMap, authoredScripts } from './source-snapshot.js';

// The retained manuscripts establish authorship, not publication permission.
// This catalog deliberately contains no signed Keeper or voice approvals.
export const SOURCE_ROOT = '/Users/kayan-work-mac/Downloads/golden/';
export const CONTENT_REVISION = 'supplied-2026-09-12';
const LABELS = { CHRISTIANITY: 'Christianity', CATHOLIC: 'Catholicism', HINDUISM: 'Hinduism', ISLAM: 'Islam', JUDAISM: 'Judaism', BUDDHISM: 'Buddhism', SIKHISM: 'Sikhism', SPIRITUAL: 'Simply Spiritual' };
const CAMP_NAMES = ['First steps', 'The stories', 'The practices', 'The text', 'The depths'];
const PREFIXES = { HINDUISM: 'HIN', CHRISTIANITY: 'CHR', CATHOLIC: 'CAT', ISLAM: 'ISL', JUDAISM: 'JUD', BUDDHISM: 'BUD', SIKHISM: 'SIK', SPIRITUAL: 'SPI' };
const SCRIPT_BEATS = ['the bell', 'review', 'the hook', 'the teach', 'the practice', 'the word', 'the carry', 'the close'];
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const source = (file, line, role) => ({ file, path: SOURCE_ROOT + file, line, role });
const scriptIndex = new Map(authoredScripts.map(s => [`${s.door}:${s.day}`, s]));

export function getPracticeRung(lesson) {
  if (!Number.isInteger(lesson) || lesson < 1) return null;
  if (lesson <= 2) return { mode: 'breath', n: 1 };
  if (lesson <= 7) return { mode: 'breath', n: 3 };
  if (lesson <= 14) return { mode: 'sit', secs: 45 };
  if (lesson <= 21) return { mode: 'sit', secs: 75 };
  // Camp 2's 90–120 seconds is a range. Later timing requires a script.
  return { mode: 'authored', minimumSeconds: 90 };
}

/** Pure publication check. Evidence must apply to this exact content revision. */
export function getReleaseGate(session) {
  const reasons = [];
  if (!session) return { publishable: false, reasons: ['Session is not in the supplied catalog.'] };
  if (session.status !== 'scripted' || !session.authored) reasons.push('A complete authored script is required.');
  const types = (session.segments || []).map(s => s.type);
  if (types.length !== SCRIPT_BEATS.length || types.some((t, i) => t !== SCRIPT_BEATS[i])) reasons.push('The eight authored beats are required.');
  if (!session.segments?.find(s => s.type === 'the teach')?.voice?.trim()) reasons.push('The authored teaching is missing.');
  const approval = session.keeperApproval;
  if (!approval || approval.status !== 'approved' || !approval.reviewer || !approval.evidence || !approval.approvedAt || approval.contentRevision !== session.contentRevision) reasons.push('Keeper approval for this content revision is missing.');
  const voice = session.voiceApproval;
  if (!voice || voice.status !== 'approved' || !voice.evidence || voice.contentRevision !== session.contentRevision) reasons.push('Approved voice and recording rights for this revision are missing.');
  if (session.needsPracticeRevision) reasons.push('The practice script still conflicts with the current sit ladder.');
  return { publishable: reasons.length === 0, reasons };
}

function normalizeSession(door, meta, camp, lesson, campDay) {
  const script = camp === 1 ? scriptIndex.get(`${door}:${campDay}`) : null;
  const authored = Boolean(script);
  const provenance = [source('golden_v150.jsx', camp === 1 ? (door === 'HINDUISM' ? 135 : 398) : 399, 'prototype map metadata')];
  if (script) provenance.unshift(source(script.provenance.file, script.provenance.line, 'authored manuscript'));
  const record = {
    id: `${PREFIXES[door]}-Y1-C${camp}-D${String(campDay).padStart(3, '0')}`,
    door, path: door, year: 1, camp, campName: CAMP_NAMES[camp - 1], day: campDay, lesson,
    title: script?.title || meta.title, word: script?.word || meta.word || '',
    carry: meta.carry || '', hook: meta.hook || '', length: script?.length || meta.length || null,
    status: authored ? 'scripted' : 'designed', authored,
    authoredAvailability: authored ? 'manuscript-supplied' : 'outline-only',
    reviewStatus: 'pending', keeperApproval: null,
    voiceStatus: 'house-voice-pending-recording', voiceApproval: null,
    contentRevision: CONTENT_REVISION,
    needsPracticeRevision: script?.needsPracticeRevision || false,
    practice: getPracticeRung(lesson),
    segments: script ? script.segments.map(s => ({ ...s, screen: [...s.screen], provenance: source(s.provenance.file, s.provenance.line, 'authored segment') })) : [],
    provenance,
  };
  return freeze({ ...record, canPreview: authored, ...getReleaseGate(record) });
}

const sessionsByDoor = new Map();
for (const door of Object.keys(LABELS)) {
  const records = sourceMap[door].map(m => normalizeSession(door, m, 1, m.day, m.day));
  let offset = sourceMap[door].length;
  for (let camp = 2; camp <= 5; camp++) {
    const titles = laterMap[door]?.[`Camp ${camp}`] || [];
    titles.forEach((title, index) => records.push(normalizeSession(door, { title }, camp, offset + index + 1, index + 1)));
    offset += titles.length;
  }
  sessionsByDoor.set(door, freeze(records));
}

export const DOOR_CATALOG = freeze(Object.keys(LABELS).map(door => {
  const sessions = sessionsByDoor.get(door);
  const authored = sessions.filter(s => s.authored);
  return {
    id: door, label: LABELS[door],
    authoredSessions: authored.length, authoredLessons: authored.map(s => s.lesson),
    mappedSessions: sessions.length, reviewStatus: 'pending',
    voiceStatus: 'house-voice-pending-recording', publishable: false,
    camps: CAMP_NAMES.map((name, i) => ({ camp: i + 1, name, sessionCount: sessions.filter(s => s.camp === i + 1).length })),
    ranges: { status: 'outlined', playable: false, years: [2, 3, 4, 5], provenance: source('golden_curriculum_v3_review.md', 15, 'elective ranges only; full JSON absent') },
    provenance: [source('golden_curriculum_v3_review.md', 6, 'review not complete'), source('golden_writers_bible.md', 58, 'current voice and Keeper law')],
  };
}));

export function getDoor(door) { return DOOR_CATALOG.find(d => d.id === door) || null; }
export function listDoorSessions(door, { camp, authoredOnly = false } = {}) {
  return (sessionsByDoor.get(door) || []).filter(s => (camp == null || s.camp === camp) && (!authoredOnly || s.authored));
}
export function getSession(door, lesson) {
  if (!Number.isInteger(lesson) || lesson < 1) return null;
  return sessionsByDoor.get(door)?.find(s => s.lesson === lesson) || null;
}
export function getSessionAvailability(door, lesson) {
  const session = getSession(door, lesson);
  if (!session) return { status: 'unavailable', authored: false, canPreview: false, publishable: false, reviewStatus: 'unknown', voiceStatus: 'unavailable', reasons: ['Session is not in the supplied catalog.'], provenance: [] };
  const { status, authored, canPreview, publishable, reviewStatus, voiceStatus, needsPracticeRevision, reasons, provenance } = session;
  return { status, authored, canPreview, publishable, reviewStatus, voiceStatus, needsPracticeRevision, reasons, provenance };
}
export function assertPublishable(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) throw new Error('Release requires an explicit nonempty session list.');
  const blocked = sessions.map(s => ({ id: s?.id || 'unknown', ...getReleaseGate(s) })).filter(s => !s.publishable);
  if (blocked.length) throw new Error(`Release blocked: ${blocked.map(s => `${s.id}: ${s.reasons.join(' ')}`).join('\n')}`);
  return true;
}
