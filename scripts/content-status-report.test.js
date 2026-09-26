import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DOOR_CATALOG, getSession, listDoorSessions } from '../src/content/catalog.js';
import { buildContentStatusReport, renderMarkdown, runCLI } from './content-status-report.js';

test('actual content coverage and stale manuscripts are reported without counting elective outlines', () => {
  const report = buildContentStatusReport();
  assert.equal(report.totals.mapped, 2648);
  assert.deepEqual(report.totals.byStatus, { designed: 2619, scripted: 29 });
  assert.equal(report.totals.authored, 29);
  assert.equal(report.totals.publishable, 0);
  assert.equal(report.stalePracticeScripts.length, 15);
  assert.deepEqual(report.stalePracticeScripts.filter(s => s.door === 'HINDUISM').map(s => s.lesson), Array.from({ length: 14 }, (_, i) => i + 8));
  assert.equal(report.stalePracticeScripts.find(s => s.door === 'ISLAM').lesson, 1);
  assert.ok(report.doors.every(d => d.ranges.countedAsSessions === false));
  assert.equal(report.provenance.some(p => p.file === 'golden_writers_bible.md' && p.line === 58), true);
  assert.ok(report.authoredScripts.every(s => s.provenance.some(p => p.role === 'authored manuscript' && p.line > 0)));
});

test('aggregated blockers retain overlapping per-door counts rather than counting failures as sessions', () => {
  const report = buildContentStatusReport();
  assert.equal(report.readiness.blockedSessions, 2648);
  const approval = report.blockedReasons.find(r => r.reason.startsWith('Keeper approval'));
  assert.equal(approval.sessions, 2648);
  assert.equal(approval.authoredSessions, 29);
  assert.equal(Object.values(approval.byDoor).reduce((a, b) => a + b, 0), approval.sessions);
  assert.equal(report.blockedReasons.find(r => r.reason.startsWith('A complete authored')).sessions, 2619);
  assert.equal(report.blockedReasons.find(r => r.reason.startsWith('The practice script')).sessions, 15);
});

test('report bytes remain deterministic when provider order changes', () => {
  const normal = buildContentStatusReport();
  const reordered = buildContentStatusReport({ doors: [...DOOR_CATALOG].reverse(), listSessions: door => listDoorSessions(door).reverse() });
  assert.equal(JSON.stringify(normal), JSON.stringify(reordered));
  assert.equal(renderMarkdown(normal), renderMarkdown(reordered));
  assert.doesNotMatch(JSON.stringify(normal), /generatedAt|timestamp/);
});

test('explicit authored scope checks only the source-authored candidate set, still failing today', () => {
  const report = buildContentStatusReport({ scope: 'authored' });
  assert.equal(report.readiness.selectedSessions, 29);
  assert.equal(report.readiness.blockedSessions, 29);
  assert.equal(report.readiness.productionReady, false);
  assert.equal(report.totals.mapped, 2648);
  assert.equal(report.readiness.reasons.some(r => r.startsWith('A complete authored')), false);
});

test('a stale cached publishable flag cannot override recomputed evidence gates', () => {
  const draft = { ...getSession('HINDUISM', 1), publishable: true, reasons: [] };
  const report = buildContentStatusReport({ doors: [DOOR_CATALOG.find(d => d.id === 'HINDUISM')], listSessions: () => [draft] });
  assert.equal(report.readiness.productionReady, false);
  assert.equal(report.authoredScripts[0].publishable, false);
});

test('isolated approved fixture can pass authored scope; a remaining outline blocks whole-catalog scope', () => {
  const draft = getSession('HINDUISM', 1);
  const approved = { ...draft,
    keeperApproval: { status: 'approved', reviewer: 'fixture', evidence: 'fixture://signature', approvedAt: '2026-09-12', contentRevision: draft.contentRevision },
    voiceApproval: { status: 'approved', evidence: 'fixture://recording-rights', contentRevision: draft.contentRevision },
  };
  const input = { doors: [DOOR_CATALOG.find(d => d.id === 'HINDUISM')], listSessions: () => [approved, getSession('HINDUISM', 22)] };
  assert.equal(buildContentStatusReport({ ...input, scope: 'authored' }).readiness.productionReady, true);
  assert.equal(buildContentStatusReport(input).readiness.productionReady, false);
  const out = { write() {} };
  assert.equal(runCLI(['--production', '--scope', 'authored'], { stdout: out, stderr: out, buildReport: options => buildContentStatusReport({ ...input, ...options }) }), 0);
  assert.equal(getSession('HINDUISM', 1).publishable, false);
});

test('empty catalogs and empty authored selections fail readiness', () => {
  assert.equal(buildContentStatusReport({ doors: [] }).readiness.productionReady, false);
  const report = buildContentStatusReport({ scope: 'authored', doors: [DOOR_CATALOG.find(d => d.id === 'CATHOLIC')] });
  assert.equal(report.readiness.selectedSessions, 0);
  assert.equal(report.readiness.productionReady, false);
  assert.match(report.readiness.reasons[0], /empty release/);
});

test('CLI exits 0 for reporting, 1 for blocked production, and 2 for invalid options', () => {
  const script = fileURLToPath(new URL('./content-status-report.js', import.meta.url));
  const inspect = args => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
  const normal = inspect(['--json']);
  assert.equal(normal.status, 0, normal.stderr);
  assert.equal(JSON.parse(normal.stdout).readiness.productionReady, false);
  const production = inspect(['--json', '--production', '--scope', 'authored']);
  assert.equal(production.status, 1, production.stderr);
  assert.equal(JSON.parse(production.stdout).readiness.selectedSessions, 29);
  const invalid = inspect(['--scope', 'unapproved']);
  assert.equal(invalid.status, 2);
  assert.equal(invalid.stdout, '');
  assert.match(invalid.stderr, /Invalid argument/);
});
