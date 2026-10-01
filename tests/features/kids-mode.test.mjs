// Kid mode (a child under 13 at the family table): the lesson screen hands a child the door's kids' track, never the
// grown-up script, the welcome, the level-ups or the Guide; the words around the stories come from the kids' strings
// module in English and Spanish. The screen itself is TSX (not loadable in Node), so its wiring is read from the source.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DOOR_KEYS } from "../../packages/content/src/lesson-script.js";
import { kidLesson, kidPlan } from "../../packages/content/src/index.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const session = readFileSync(`${src}app/session/[door]/[day].tsx`, "utf8");
const kidsUi = readFileSync(`${src}session/kids.tsx`, "utf8");
const strings = await import(pathToFileURL(`${src}i18n/strings/kids.ts`).href);

test("the lesson screen opens a child's lesson from the kids' set, with no script fetched", () => {
  const screen = session.slice(session.indexOf("export default function SessionScreen"), session.indexOf("function ScriptedSession"));
  const kid = screen.indexOf('if (mode === "kid")');
  assert.ok(kid > 0, "SessionScreen branches on kid mode");
  assert.ok(kid < screen.indexOf("<ScriptedSession"), "before the script loader");
  assert.match(screen.slice(kid), /^if \(mode === "kid"\) \{\s*if \(!kidLesson\(door, day\)\) return <Redirect href="\/you\/table" \/>;\s*return <Session [^>]*mode="kid" deep=\{false\}[^>]*script=\{null\} \/>;/);
  // the plan: kid mode returns the kids' plan (or an empty tally), never falling through to planDay
  const plan = session.slice(session.indexOf("const plan = useMemo"), session.indexOf("planDay({ wing: door"));
  assert.match(plan, /if \(kidMode\) return kidPlanFor\(door, day\) \?\? \{ steps: \[\{ type: "tally", id: 0 \}\]/);
  // a child sees no "lessons are in English" note, no voice name, and a child's own tally
  assert.match(session, /\{kidMode \? null : <EsLessonNote \/>\}/);
  assert.match(session, /kidMode \? t\("kids\.reads"/);
  assert.match(session, /if \(kidMode\) return frame\(<KidTally /);
  // still true from before: a child's level stays 1, "go deeper" is off, and the Guide is never reached from a lesson
  assert.match(session, /const deep = params\.deep === "1" && !kid;/);
  assert.ok(!/guide/i.test(kidsUi.replace(/^\/\/.*$/gm, "")), "the kids' screen code never mentions the Guide");
});

test("the kids' strings are complete in Spanish", () => {
  const en = Object.keys(strings.en), es = Object.keys(strings.es);
  assert.deepEqual(es.sort(), en.sort());
  for (const k of en) assert.ok(String(strings.es[k]).trim(), k);
  assert.ok(en.every((k) => k.startsWith("kids.")));
});

const labels = (d) => ({
  bell: d["kids.bell"].replace("{n}", "1"), story: d["kids.seg.story"], game: d["kids.seg.game"], wordSeg: d["kids.seg.word"], breathSeg: d["kids.seg.breath"], lineSeg: d["kids.seg.line"],
  order: d["kids.order"], truthKicker: d["kids.truth.kicker"], truthQ: d["kids.truth.q"], yes: d["kids.truth.yes"], no: d["kids.truth.no"], yesDot: d["kids.truth.yesDot"], noDot: d["kids.truth.noDot"],
  word: d["kids.word"], carry: d["kids.carry"],
});

test("with the app's own labels, a child's lesson is all kids' text, in the child's language", () => {
  for (const door of DOOR_KEYS) {
    for (const [lang, d] of [["en", strings.en], ["es", strings.es]]) {
      for (let day = 1; day <= 21; day++) {
        const p = kidPlan({ door, day, lang, labels: labels(d) });
        const L = kidLesson(door, day)[lang];
        const all = JSON.stringify(p.steps);
        assert.ok(!/\{\w+\}/.test(all), `${door} ${day} ${lang}: an unfilled slot`);
        assert.ok(p.steps.find((s) => s.seg === "the word").text.includes(L.word));
        assert.ok(p.steps.find((s) => s.seg === "the carry").text.includes(L.carry.replace(/[.!?]$/, "")));
        const truth = p.steps.find((s) => s.type === "myth");
        if (truth) assert.equal(truth.yes, d["kids.truth.yes"]);
        // nothing of the grown-up feed: no voice, no Guide, no community line
        assert.ok(!/\bthe guide\b|\bla guía\b|together tab|community and events|comunidad y eventos|reads ·/i.test(all), `${door} ${day} ${lang}`);
      }
    }
  }
});
