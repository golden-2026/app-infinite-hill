// The invite-only gate on the phone (apps/app/src/lib/invite-gate.ts), loaded straight from TypeScript, and the
// waitlist strings (apps/app/src/i18n/strings/waitlist.ts) in both languages.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SRC = new URL("../../apps/app/src/", import.meta.url);
const { gate, readStatus, cleanCode, showInvitesCard } = await import(new URL("lib/invite-gate.ts", SRC).href);
const strings = await import(new URL("i18n/strings/waitlist.ts", SRC).href);

const OFF = { on: false, cap: null, full: false };
const ON = { on: true, cap: 10000, full: false };
const NEVER = { on: null, cap: null, full: false };

test("switch off (the default): every new person goes through the usual welcome, exactly as before", () => {
  assert.equal(gate({ status: OFF, onboarded: false, admitted: false }), "open");
  assert.equal(gate({ status: OFF, onboarded: true, admitted: false }), "open");
  assert.equal(showInvitesCard(OFF, true), false); // no invites card either
});

test("switch on: a new person without an invite sees the waitlist; with one, or already walking, they're in", () => {
  assert.equal(gate({ status: ON, onboarded: false, admitted: false }), "waitlist");
  assert.equal(gate({ status: ON, onboarded: false, admitted: true }), "open");
  assert.equal(gate({ status: ON, onboarded: true, admitted: false }), "open"); // the private beta keeps walking
  assert.equal(showInvitesCard(ON, true), true);
  assert.equal(showInvitesCard(ON, false), false);
});

test("never read yet: 'asking' (the welcome shows as usual meanwhile); onboarded people never wait", () => {
  assert.equal(gate({ status: NEVER, onboarded: false, admitted: false }), "asking");
  assert.equal(gate({ status: NEVER, onboarded: true, admitted: false }), "open");
});

test("reading the server: only a clear inviteOnly:true turns it on; no server or a static host means off", () => {
  assert.deepEqual(readStatus(NEVER, { ok: true, json: { inviteOnly: true, foundingCap: 10000, full: false } }), ON);
  assert.deepEqual(readStatus(ON, { ok: true, json: { inviteOnly: false } }), OFF); // the owner flipped it back
  assert.deepEqual(readStatus(ON, { ok: true, json: null }), OFF); // the static host's HTML
  assert.deepEqual(readStatus(ON, { ok: false, json: { error: "x" } }), OFF);
  assert.deepEqual(readStatus(NEVER, { ok: true, json: { inviteOnly: "yes" } }), OFF);
  assert.deepEqual(readStatus(NEVER, null), OFF); // offline, never read: off
  assert.deepEqual(readStatus(ON, null), ON); // offline after reading: keep what was known
  assert.equal(readStatus(NEVER, { ok: true, json: { inviteOnly: true, foundingCap: -3 } }).cap, null);
  assert.equal(readStatus(NEVER, { ok: true, json: { inviteOnly: true, full: true } }).full, true);
});

test("codes: typed by hand, tidied, and only the real shape is accepted", () => {
  assert.equal(cleanCode(" AbCd-EfGh "), "abcdefgh");
  assert.equal(cleanCode("abcd efgh"), "abcdefgh");
  assert.equal(cleanCode("abcdefg"), null);
  assert.equal(cleanCode("abcdefgi"), null); // no i, l, o, 0 or 1
  assert.equal(cleanCode(null), null);
});

test("waitlist strings: the same keys in English and Spanish, the same slots, and the honest scarcity line", () => {
  const { en, es } = strings;
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
  const slots = (v) => [...JSON.stringify(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
  for (const k of Object.keys(en)) assert.equal(slots(es[k]), slots(en[k]), k);
  assert.equal(en["waitlist.scarcity"], "we open each door as its scholars finish reviewing it. the founding class is capped at {cap}.");
  for (const k of Object.keys(en)) assert.ok(k.startsWith("waitlist."), k);
});

test("the gate sits in the welcome layout, and the app never holds a server secret", () => {
  const layout = readFileSync(new URL("app/welcome/_layout.tsx", SRC), "utf8");
  assert.match(layout, /useGate\(/);
  assert.match(layout, /Redirect href="\/waitlist"/);
  for (const f of ["lib/waitlist.ts", "lib/invite-gate.ts", "app/waitlist.tsx", "app/invite.tsx", "ui/invites.tsx"]) {
    const src = readFileSync(new URL(f, SRC), "utf8");
    assert.ok(!/WAITLIST_ADMIN_KEY|EXPO_PUBLIC_WAITLIST|admin-release/.test(src), f);
  }
});
