// The owner's moves of 2026-11-05: the Guide shows where an answer comes from (apps/app/src/lib/companion/source.ts),
// and "tell me about today" is picked back up the next time Today opens (apps/app/src/lib/companion/follow-up.ts).
// Both files are import-free, so Node loads them straight from the app's TypeScript.
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const hooks = `
const SRC = ${JSON.stringify(pathToFileURL(src).href)};
export async function load(url, ctx, next) {
  if (url.startsWith(SRC) && url.endsWith(".ts")) return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);

const { splitSource } = await import(pathToFileURL(`${src}lib/companion/source.ts`).href);
const { followUpFor, toldToday, quote, FOLLOW_UP_DAYS } = await import(pathToFileURL(`${src}lib/companion/follow-up.ts`).href);

test("a trailing source line is lifted out of the answer and shown on its own", () => {
  const a = splitSource("ahimsa means not harming. it sits at the heart of the yamas.\n\nsource: Yoga Sutras 2.30–2.35");
  assert.equal(a.text, "ahimsa means not harming. it sits at the heart of the yamas.");
  assert.equal(a.source, "Yoga Sutras 2.30–2.35");
  // markdown bold, Spanish, and "sources"
  assert.equal(splitSource("x\n**Source:** Luke 15:11–32").source, "Luke 15:11–32");
  assert.equal(splitSource("hola\nfuente: Mateo 5").source, "Mateo 5");
  assert.equal(splitSource("hi\nsources: Qur'an 2:286; Bukhari 1").text, "hi");
});

test("no source line leaves the answer alone, and the companion's own field wins", () => {
  assert.deepEqual(splitSource("i'm so glad you're here."), { text: "i'm so glad you're here.", source: null });
  // "source" mid-answer is not a source line
  assert.equal(splitSource("the source of this idea: love.").source, null);
  assert.deepEqual(splitSource("grace is a gift.", "source: general Christian teaching"), { text: "grace is a gift.", source: "general Christian teaching" });
  assert.equal(splitSource("x\nsource: " + "y".repeat(400)).source.length, 200);
});

const page = (date, extra = {}) => ({ id: `jr_${date}`, date, text: "my sister's surgery is friday", kind: "today", ...extra });

test("yesterday's 'tell me about today' comes back once, then rests", () => {
  const j = [page("2026-11-04")];
  assert.deepEqual(followUpFor(j, "2026-11-05"), { entry: j[0], daysAgo: 1 });
  // never on the same day it was told
  assert.equal(followUpFor(j, "2026-11-04"), null);
  // closed: done
  assert.equal(followUpFor([page("2026-11-04", { closed: true })], "2026-11-05"), null);
  // too old: lapses quietly
  assert.equal(followUpFor(j, `2026-11-0${4 + FOLLOW_UP_DAYS + 1}`), null);
  // ordinary journal pages never trigger it
  assert.equal(followUpFor([{ id: "a", date: "2026-11-04", text: "x" }], "2026-11-05"), null);
});

test("only the newest told-about day counts, and today's own page doesn't hide yesterday's", () => {
  assert.equal(followUpFor([page("2026-11-03"), page("2026-11-04", { closed: true })], "2026-11-05"), null);
  const j = [page("2026-11-04"), page("2026-11-05")];
  assert.equal(followUpFor(j, "2026-11-05").entry.date, "2026-11-04");
  assert.equal(toldToday(j, "2026-11-05"), true);
  assert.equal(toldToday([page("2026-11-04")], "2026-11-05"), false);
});

test("quotes are cut on whole words", () => {
  assert.equal(quote("short"), "short");
  const q = quote("word ".repeat(60), 40);
  assert.ok(q.endsWith("…") && q.length <= 41 && !q.includes("wor…"));
});

test("both servers ask for the source and for plain meanings of insider words", () => {
  const guide = readFileSync(`${root}api/guide.js`, "utf8");
  const companion = readFileSync(`${root}api/companion.js`, "utf8");
  assert.match(guide, /starting exactly with "source:"/);
  assert.match(guide, /any insider word/);
  assert.match(companion, /"source": where your answer comes from/);
});
