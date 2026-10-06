// The two-faith couple (apps/app/src/content/couple.ts): "before the holiday" offers only lessons already written in
// years 1–3 of the partner's family's door, a week or two before its next big holiday; "walk it together" shows two
// rows of seven stones from the partner's progress signal only; and the Guide's couple rule (api/guide.js) honors both
// families, ranks neither and never pushes conversion. Loaded straight from the app's TypeScript (Node strips the
// types), like gentle-lane.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const hooks = `
const SRC = ${JSON.stringify(pathToFileURL(src).href)};
const EXT = ["", ".ts", ".js", "/index.ts"];
export async function resolve(spec, ctx, next) {
  let base = null;
  if (spec.startsWith("@/")) base = new URL(spec.slice(2), SRC).href;
  else if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith(SRC)) base = new URL(spec, ctx.parentURL).href;
  if (base) {
    for (const e of EXT) { try { return await next(base + e, ctx); } catch {} }
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith(SRC) && url.endsWith(".ts")) return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}`;
register(stub(hooks), import.meta.url);

const C = await import(pathToFileURL(`${src}content/couple.ts`).href);
const strings = await import(pathToFileURL(`${src}i18n/strings/couple.ts`).href);
const { buildSystemPrompt } = await import(pathToFileURL(`${root}api/guide.js`).href);
const { HOLIDAY_DEFS, holidayFor, holidayOpens, partnerDoorOf, isCouple, walkView, walkPartner, noteSeen, WALK_DAYS } = C;

const DOORS = ["HINDUISM", "BUDDHISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "SIKHISM"];
const script = (door, day) => {
  const file = `day-${String(day).padStart(4, "0")}.json`;
  for (const y of ["y1", "y2", "y3"]) {
    const p = `${root}docs/curriculum/${door.toLowerCase()}/scripts/${y}/${file}`;
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  return null;
};

test("before the holiday: every lesson offered is already written in years 1–3 of that door, with its own title", () => {
  for (const d of HOLIDAY_DEFS) {
    for (const [door, list] of Object.entries(d.lessons)) {
      assert.ok(DOORS.includes(door), `${d.key}: ${door}`);
      assert.ok(list.length >= 2 && list.length <= 4, `${d.key} ${door}: a short list`);
      for (const [day, title] of list) {
        assert.ok(day >= 1 && day <= 1061, `${d.key} ${door} day ${day} is in years 1–3`);
        const s = script(door, day);
        assert.ok(s, `${d.key} ${door} day ${day} has a written script`);
        assert.equal(s.title, title, `${d.key} ${door} day ${day}: the script's own title`);
      }
    }
  }
});

test("every tradition door has a big holiday each year 2026–2028; my own path has none", () => {
  for (const door of DOORS) {
    for (const y of [2026, 2027, 2028]) {
      let found = false;
      for (let m = 0; m < 365 && !found; m += 7) {
        const day = new Date(Date.UTC(y, 0, 1 + m)).toISOString().slice(0, 10);
        if (holidayFor(door, day)) found = true;
      }
      assert.ok(found, `${door} ${y}`);
    }
  }
  assert.equal(holidayFor("SPIRITUAL", "2026-10-03"), null);
  assert.equal(holidayFor(null, "2026-10-03"), null);
});

test("the card shows from two weeks before through the day itself, soonest first", () => {
  // navratri 2026 begins oct 11
  assert.equal(holidayFor("HINDUISM", "2026-09-26"), null); // 15 days out
  const h = holidayFor("HINDUISM", "2026-09-27");
  assert.equal(h.key, "navratri");
  assert.equal(h.daysAway, 14);
  assert.equal(h.id, "navratri-2026-10-11");
  assert.equal(holidayFor("HINDUISM", "2026-10-11").daysAway, 0);
  // the day after navratri begins, diwali (nov 6) is 25 days out: nothing yet
  assert.equal(holidayFor("HINDUISM", "2026-10-12"), null);
  assert.equal(holidayFor("HINDUISM", "2026-10-25").key, "diwali");
  // passover is the day before the omer's first day (2026: apr 2); a run-up holiday is its last day (vaisakhi apr 14)
  assert.equal(holidayFor("JUDAISM", "2026-04-02").key, "passover");
  assert.equal(holidayFor("JUDAISM", "2026-04-02").date, "2026-04-02");
  assert.equal(holidayFor("SIKHISM", "2026-04-01").date, "2026-04-14");
  assert.equal(holidayFor("CATHOLIC", "2026-11-20").key, "advent");
  assert.deepEqual(holidayFor("CATHOLIC", "2026-11-20").days, [144, 633, 145]);
});

test("a holiday lesson opens ahead of the path only on the partner's door, only while the card is up", () => {
  assert.equal(holidayOpens("HINDUISM", "HINDUISM", 143, "2026-10-03"), true);
  assert.equal(holidayOpens("HINDUISM", "HINDUISM", 144, "2026-10-03"), false); // not on the list
  assert.equal(holidayOpens("HINDUISM", "HINDUISM", 143, "2026-12-01"), false); // no holiday near
  assert.equal(holidayOpens("ISLAM", "HINDUISM", 143, "2026-10-03"), false); // not the partner's door
  assert.equal(holidayOpens(null, "HINDUISM", 143, "2026-10-03"), false);
});

test("the partner's family's door: chosen, else the faith they're learning, else a door they're visiting", () => {
  assert.equal(isCouple("partner") && isCouple("wedding") && !isCouple("own"), true);
  assert.equal(partnerDoorOf({ why: "own", home: "HINDUISM", visit: "ISLAM" }), null);
  assert.equal(partnerDoorOf({ why: "partner", learning: "JUDAISM", home: "JUDAISM" }), "JUDAISM");
  assert.equal(partnerDoorOf({ why: "partner", learning: "other", home: "ISLAM" }), "ISLAM");
  assert.equal(partnerDoorOf({ why: "wedding", home: "CATHOLIC" }), null);
  assert.equal(partnerDoorOf({ why: "wedding", home: "CATHOLIC", visit: "HINDUISM" }), "HINDUISM");
  assert.equal(partnerDoorOf({ why: "wedding", home: "CATHOLIC", visit: "HINDUISM", chosen: "SIKHISM" }), "SIKHISM");
  assert.equal(partnerDoorOf({ why: "wedding", home: "CATHOLIC", chosen: "SPIRITUAL" }), null);
});

test("walk it together: seven stones each, yours from your lessons, theirs only from the done-today signal", () => {
  const walk = { on: "2026-10-01", friendId: "f_b", seen: ["2026-10-01"] };
  const v = walkView(walk, { myDates: ["2026-09-30", "2026-10-01", "2026-10-02"], theirDoneToday: true, today: "2026-10-03" });
  assert.equal(v.stones.length, WALK_DAYS);
  assert.equal(v.day, 3);
  assert.deepEqual(v.stones.map((s) => s.me).slice(0, 4), ["lit", "lit", "today", "later"]);
  assert.deepEqual(v.stones.map((s) => s.them).slice(0, 4), ["lit", "open", "lit", "later"]);
  assert.equal(v.mine, 2);
  assert.equal(v.theirs, 2);
  assert.equal(v.finished, false);
  assert.equal(v.over, false);
  const all = Array.from({ length: 7 }, (_, i) => `2026-10-0${i + 1}`);
  const done = walkView({ on: "2026-10-01", seen: all }, { myDates: all, today: "2026-10-08" });
  assert.equal(done.finished, true);
  assert.equal(done.over, true);
  assert.equal(done.day, 7);
});

test("the partner is the chosen friend, or the first one who wasn't there when the link went out; seen once a day", () => {
  const friends = [{ id: "f_a" }, { id: "f_b" }];
  assert.equal(walkPartner({ on: "2026-10-01", friendId: "f_b" }, friends).id, "f_b");
  assert.equal(walkPartner({ on: "2026-10-01", known: ["f_a"] }, friends).id, "f_b");
  assert.equal(walkPartner({ on: "2026-10-01", known: ["f_a", "f_b"] }, friends), null);
  assert.equal(walkPartner(null, friends), null);
  const w = { on: "2026-10-01", friendId: "f_b" };
  const once = noteSeen(w, "2026-10-02", true);
  assert.deepEqual(once.seen, ["2026-10-02"]);
  assert.equal(noteSeen(once, "2026-10-02", true), once);
  assert.equal(noteSeen(w, "2026-10-02", false), w);
  assert.equal(noteSeen(w, "2026-10-09", true), w); // after the seven days
});

test("every couple string is in English and Spanish, lowercase mascot voice, and never names a service as connected", () => {
  const en = strings.en, es = strings.es;
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
  for (const d of HOLIDAY_DEFS) assert.ok(en[`couple.holiday.name.${d.key}`] && es[`couple.holiday.name.${d.key}`], d.key);
  for (const [k, v] of Object.entries(en)) {
    const text = typeof v === "string" ? v : Object.values(v).join(" ");
    assert.equal(text, text.toLowerCase(), `${k} is lowercase`);
    // the mascot says "i"; "we" is only the company (a couple's own question in the Guide chips is theirs to say)
    if (!k.startsWith("couple.guide.chip")) assert.doesNotMatch(text, /\bwe\b|\bwe'/i, k);
    assert.doesNotMatch(text, /\b\d{2,}\s+(people|couples|members)\b/i, `${k}: no community numbers`);
  }
});

test("the Guide's couple rule rides on the partner and wedding reasons and keeps the rest of the prompt", () => {
  for (const reason of ["partner", "wedding"]) {
    const p = buildSystemPrompt("Hinduism", { depth: "new", openness: "stay", reason });
    assert.match(p, /honor both families/);
    assert.match(p, /rank neither/);
    assert.match(p, /never suggest that either of them convert/);
    assert.match(p, /voices they know/); // the owner keeps these claims (2026-10-03)
  }
  assert.match(buildSystemPrompt("Hinduism", { depth: "new", openness: "stay", reason: "wedding" }), /without ranking the two or pushing either of them to convert/);
  assert.doesNotMatch(buildSystemPrompt("Hinduism", { depth: "new", openness: "stay", reason: "own" }), /rank neither/);
  const cases = JSON.parse(readFileSync(`${root}tests/guide-cases/cases.json`, "utf8")).cases;
  assert.ok(cases.filter((c) => c.moment === "H").length >= 2);
});
