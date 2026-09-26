#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { CONTENT_REVISION, DOOR_CATALOG, listDoorSessions, getReleaseGate } from '../src/content/catalog.js';

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const tally = (values) => Object.fromEntries([...new Set(values)].sort(compare).map(value => [value, values.filter(v => v === value).length]));
const summarize = (rows) => ({
  mapped: rows.length,
  authored: rows.filter(s => s.authored).length,
  previewable: rows.filter(s => s.canPreview).length,
  publishable: rows.filter(s => s.gate.publishable).length,
  blocked: rows.filter(s => !s.gate.publishable).length,
  stalePractice: rows.filter(s => s.needsPracticeRevision).length,
  byStatus: tally(rows.map(s => s.status || 'unknown')),
  byReviewStatus: tally(rows.map(s => s.reviewStatus || 'unknown')),
  byVoiceStatus: tally(rows.map(s => s.voiceStatus || 'unknown')),
});
const uniqueProvenance = (items) => {
  const key = p => `${p.file || ''}:${String(p.line || 0).padStart(6, '0')}:${p.role || ''}:${p.path || ''}`;
  return [...new Map(items.filter(Boolean).map(p => [key(p), { ...p }])).entries()]
    .sort(([a], [b]) => compare(a, b)).map(([, value]) => value);
};

/** Read-only report; dependency injection exists solely for isolated gate tests. */
export function buildContentStatusReport({ scope = 'catalog', doors = DOOR_CATALOG, listSessions = listDoorSessions, evaluateGate = getReleaseGate, contentRevision = CONTENT_REVISION } = {}) {
  if (!['catalog', 'authored'].includes(scope)) throw new Error(`Unsupported scope: ${scope}`);
  const orderedDoors = [...doors].sort((a, b) => compare(a.id, b.id));
  const byDoor = orderedDoors.map(door => {
    const rows = [...listSessions(door.id)].sort((a, b) => a.lesson - b.lesson || compare(a.id, b.id))
      .map(session => ({ ...session, gate: evaluateGate(session) }));
    return { door, rows };
  });
  const rows = byDoor.flatMap(d => d.rows);
  const selected = scope === 'authored' ? rows.filter(s => s.authored) : rows;
  const selectedBlocked = selected.filter(s => !s.gate.publishable);
  const allReasons = [...new Set(rows.flatMap(s => s.gate.reasons))].sort(compare);
  const sessionDetails = s => ({
    id: s.id, door: s.door, lesson: s.lesson, title: s.title,
    status: s.status, reviewStatus: s.reviewStatus, voiceStatus: s.voiceStatus,
    canPreview: Boolean(s.canPreview), publishable: s.gate.publishable,
    needsPracticeRevision: Boolean(s.needsPracticeRevision),
    blockedReasons: [...s.gate.reasons], provenance: uniqueProvenance(s.provenance || []),
  });
  return {
    schemaVersion: 1,
    contentRevision,
    scope,
    readiness: {
      productionReady: selected.length > 0 && selectedBlocked.length === 0,
      selectedSessions: selected.length,
      publishableSessions: selected.filter(s => s.gate.publishable).length,
      blockedSessions: selectedBlocked.length,
      reasons: selected.length === 0 ? ['No sessions selected; an empty release is not ready.'] : [...new Set(selectedBlocked.flatMap(s => s.gate.reasons))].sort(compare),
    },
    totals: summarize(rows),
    doors: byDoor.map(({ door, rows: doorRows }) => ({
      id: door.id, label: door.label, ...summarize(doorRows),
      ranges: door.ranges ? { status: door.ranges.status, playable: door.ranges.playable, years: [...(door.ranges.years || [])], countedAsSessions: false } : null,
      provenance: uniqueProvenance(door.provenance || []),
    })),
    blockedReasons: allReasons.map(reason => ({
      reason,
      sessions: rows.filter(s => s.gate.reasons.includes(reason)).length,
      authoredSessions: rows.filter(s => s.authored && s.gate.reasons.includes(reason)).length,
      byDoor: Object.fromEntries(byDoor.map(({ door, rows: doorRows }) => [door.id, doorRows.filter(s => s.gate.reasons.includes(reason)).length])),
    })),
    authoredScripts: rows.filter(s => s.authored).map(sessionDetails),
    stalePracticeScripts: rows.filter(s => s.needsPracticeRevision).map(sessionDetails),
    provenance: uniqueProvenance([
      ...orderedDoors.flatMap(d => [...(d.provenance || []), d.ranges?.provenance]),
      ...rows.flatMap(s => s.provenance || []),
    ]),
    limits: [
      'Map slots are prototype metadata; counts do not establish complete authored curriculum.',
      'Elective years are outline metadata and are excluded from session totals.',
      'Blocked reason counts overlap; one session can fail several requirements.',
      'Preview availability does not imply Keeper approval, recording rights, or production readiness.',
      'The report validates catalog evidence fields, not the authenticity of signatures or external agreements.',
      'Account, payment, notification, event, privacy, and deployment readiness are outside this content report.',
    ],
  };
}

const cell = value => String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const sourceLabel = p => `${p.file}:${p.line}`;
export function renderMarkdown(report) {
  const lines = [
    '# Golden content release readiness', '',
    `Content revision: \`${report.contentRevision}\`. Gate scope: **${report.scope}**.`, '',
    `Production content readiness: **${report.readiness.productionReady ? 'READY' : 'BLOCKED'}** — ${report.readiness.publishableSessions} of ${report.readiness.selectedSessions} selected sessions publishable; ${report.readiness.blockedSessions} blocked.`, '',
    'These are catalog checks. They do not establish delivery or external approval authenticity.', '',
    '| Door | Mapped | Scripted | Designed | Previewable | Publishable | Stale practice |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...report.doors.map(d => `| ${cell(d.label)} | ${d.mapped} | ${d.byStatus.scripted || 0} | ${d.byStatus.designed || 0} | ${d.previewable} | ${d.publishable} | ${d.stalePractice} |`),
    `| **Total** | **${report.totals.mapped}** | **${report.totals.byStatus.scripted || 0}** | **${report.totals.byStatus.designed || 0}** | **${report.totals.previewable}** | **${report.totals.publishable}** | **${report.totals.stalePractice}** |`, '',
    '## Status distributions', '',
    `- Content: ${JSON.stringify(report.totals.byStatus)}`,
    `- Keeper review: ${JSON.stringify(report.totals.byReviewStatus)}`,
    `- Voice: ${JSON.stringify(report.totals.byVoiceStatus)}`, '',
    '## Blocking reasons', '',
    '| Reason | All mapped sessions | Authored scripts |', '|---|---:|---:|',
    ...report.blockedReasons.map(r => `| ${cell(r.reason)} | ${r.sessions} | ${r.authoredSessions} |`), '',
    ...report.readiness.reasons.filter(r => !report.blockedReasons.some(b => b.reason === r)).map(r => `- ${r}`),
    '## Stale practice manuscripts', '',
    '| Session | Lesson | Title | Source |', '|---|---:|---|---|',
    ...report.stalePracticeScripts.map(s => `| ${s.id} | ${s.lesson} | ${cell(s.title)} | ${s.provenance.filter(p => p.role === 'authored manuscript').map(sourceLabel).join(', ')} |`),
    ...(report.stalePracticeScripts.length ? [] : ['| None | | | |']), '',
    '## Authored source coverage', '',
    '| Session | Title | Source |', '|---|---|---|',
    ...report.authoredScripts.map(s => `| ${s.id} | ${cell(s.title)} | ${s.provenance.filter(p => p.role === 'authored manuscript').map(sourceLabel).join(', ')} |`), '',
    '## Provenance', '',
    ...report.provenance.map(p => `- ${sourceLabel(p)} — ${p.role}. Source path: \`${p.path}\`.`), '',
    '## Limits', '', ...report.limits.map(l => `- ${l}`), '',
  ];
  return lines.join('\n');
}

export const USAGE = `Usage: node scripts/content-status-report.js [--json|--markdown] [--scope catalog|authored] [--production]

Default: Markdown report over the full catalog; successful reporting exits 0.
--json        Print structured, deterministic JSON (no timestamp).
--markdown    Print the readable Markdown report (default).
--scope       Gate the entire catalog (default) or explicitly authored scripts.
--production  Exit 1 when the selected content scope is not production-ready.
--help        Show this help. Invalid arguments exit 2.

The command only reads local content and writes its report to stdout.
`;

export function runCLI(argv, { stdout = process.stdout, stderr = process.stderr, buildReport = buildContentStatusReport } = {}) {
  let format = 'markdown'; let scope = 'catalog'; let production = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help') { stdout.write(USAGE); return 0; }
    if (arg === '--json') { format = 'json'; continue; }
    if (arg === '--markdown') { format = 'markdown'; continue; }
    if (arg === '--production') { production = true; continue; }
    if (arg === '--scope' && ['catalog', 'authored'].includes(argv[i + 1])) { scope = argv[++i]; continue; }
    stderr.write(`Invalid argument or scope: ${arg}\n${USAGE}`); return 2;
  }
  try {
    const report = buildReport({ scope });
    stdout.write(format === 'json' ? JSON.stringify(report, null, 2) + '\n' : renderMarkdown(report));
    return production && !report.readiness.productionReady ? 1 : 0;
  } catch (error) {
    stderr.write(`Content report failed: ${error.message}\n`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = runCLI(process.argv.slice(2));
}
