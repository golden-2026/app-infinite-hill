// Seasonal quests (apps/app/src/content/seasons.ts), loaded straight from the app's TypeScript (Node strips the
// types): the dates table, when a season is upcoming / active / in its grace week, which doors may be offered one
// (openness "stay" never sees another tradition's season), the Today card, and the path of stones.
import test from "node:test";
import assert from "node:assert/strict";

const S = await import(new URL("../../apps/app/src/content/seasons.ts", import.meta.url).href);
const { ALL_SEASONS, SEASON_DEFS, NEW_YEARS, seasonById, seasonDoors, seasonsNear, phaseOf, questCard, questProgress, stillFinishLine, seasonLine, newYearNow, whenWords, finishedQuests, addDays } = S;

const DOORS = ["CHRISTIANITY", "CATHOLIC", "HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "SPIRITUAL"];
const range = (from, n) => Array.from({ length: n }, (_, i) => addDays(from, i));

test("the table: every season 2026–2028 has a source, a sane length, and every door has seasons and new years", () => {
  for (const s of ALL_SEASONS) {
    assert.ok(s.source && s.source.length > 5, `${s.id} has a source`);
    assert.ok(s.start <= s.end, `${s.id} starts before it ends`);
    assert.ok([2026, 2027, 2028].includes(s.year), s.id);
    assert.ok(SEASON_DEFS[s.key], s.id);
  }
  const len = (id) => seasonById(id).length;
  assert.equal(len("lent-2027"), 40);
  assert.equal(seasonById("lent-2027").start, "2027-02-10");
  assert.equal(seasonById("advent-2026").start, "2026-11-29");
  assert.equal(seasonById("advent-2026").end, "2026-12-24");
  assert.ok([29, 30].includes(len("ramadan-2026")) && [29, 30].includes(len("ramadan-2027")) && [29, 30].includes(len("ramadan-2028")));
  assert.equal(len("awe-2026"), 10);
  assert.equal(len("omer-2027"), 49);
  assert.equal(seasonById("omer-2026").end, "2026-05-21"); // the day before shavuot
  assert.equal(len("navratri-2026"), 9);
  assert.equal(len("diwali-2027"), 5);
  assert.equal(len("vaisakhi-2027"), 10);
  assert.equal(seasonById("vaisakhi-2027").end, "2027-04-14");
  assert.equal(len("gurpurab-2026"), 7);
  assert.equal(len("vesak-2027"), 7);
  assert.equal(len("vassa-2027"), 21);
  assert.equal(seasonById("newyear-2027").end, "2027-01-21");
  assert.equal(len("solstice-june-2027"), 7);
  for (const d of DOORS) {
    assert.ok(ALL_SEASONS.some((s) => s.def.doors.includes(d)), `${d} has a season`);
    assert.ok(NEW_YEARS.some((y) => y.door === d), `${d} has a new year`);
  }
});

test("every daily line is a question (practice) or a how-people-keep-it line (learn), never a prayer to say", () => {
  for (const def of Object.values(SEASON_DEFS)) {
    assert.ok(def.ask.length >= 5 && def.learn.length >= 5, def.key);
    for (const q of def.ask) assert.ok(q.trim().endsWith("?"), `${def.key}: "${q}" is a question`);
    for (const l of [...def.ask, ...def.learn, def.about, def.name]) {
      assert.equal(l, l.toLowerCase(), `lowercase: ${l}`);
      assert.doesNotMatch(l, /\b(pray this|repeat after|say this prayer|amen\.?$)/i);
    }
  }
  const lent = seasonById("lent-2027");
  assert.equal(seasonLine(lent, "2027-02-10", "practice"), SEASON_DEFS.lent.ask[0]);
  assert.equal(seasonLine(lent, "2027-02-11", "learn"), SEASON_DEFS.lent.learn[1]);
});

test("phases: soon from 7 days out, active through the last day, then a grace week, then past", () => {
  const advent = seasonById("advent-2026");
  assert.equal(phaseOf(advent, "2026-11-21"), "upcoming");
  assert.equal(phaseOf(advent, "2026-11-22"), "soon");
  assert.equal(phaseOf(advent, "2026-11-29"), "active");
  assert.equal(phaseOf(advent, "2026-12-24"), "active");
  assert.equal(phaseOf(advent, "2026-12-31"), "grace");
  assert.equal(phaseOf(advent, "2027-01-01"), "past");
  assert.equal(whenWords("2026-11-24", "2026-11-29"), "sunday");
  assert.equal(whenWords("2027-02-09", "2027-02-10"), "tomorrow");
  assert.equal(whenWords("2027-02-03", "2027-02-10"), "a week from today");
});

test("per door: each door is only ever offered its own seasons", () => {
  const today = "2026-11-25"; // advent soon, gurpurab active, diwali in grace
  assert.deepEqual(seasonsNear(["CHRISTIANITY"], today).map((s) => s.key), ["advent"]);
  assert.deepEqual(seasonsNear(["CATHOLIC"], today).map((s) => s.key), ["advent"]);
  assert.deepEqual(seasonsNear(["SIKHISM"], "2026-11-20").map((s) => s.key), ["gurpurab"]);
  assert.deepEqual(seasonsNear(["ISLAM"], today), []);
  assert.deepEqual(seasonsNear(["ISLAM"], "2027-02-01").map((s) => s.id), ["ramadan-2027"]);
  assert.deepEqual(seasonsNear(["HINDUISM"], "2026-10-05").map((s) => s.id), ["navratri-2026"]);
  assert.deepEqual(seasonsNear(["JUDAISM"], "2027-09-28").map((s) => s.id), ["awe-2027"]);
  assert.deepEqual(seasonsNear(["BUDDHISM"], "2027-05-15").map((s) => s.id), ["vesak-2027"]);
  assert.deepEqual(seasonsNear(["SPIRITUAL"], "2026-12-18").map((s) => s.id), ["solstice-dec-2026"]);
});

test("openness: 'stay' gets only their own door (and a door they chose to walk), never a tasted tradition", () => {
  assert.deepEqual(seasonDoors({ home: "HINDUISM", openness: "stay", tasted: ["ISLAM", "CHRISTIANITY"] }), ["HINDUISM"]);
  assert.deepEqual(seasonDoors({ home: "HINDUISM", visit: "JUDAISM", openness: "stay", tasted: ["ISLAM"] }), ["HINDUISM", "JUDAISM"]);
  assert.deepEqual(seasonDoors({ home: "HINDUISM", openness: "sometimes", tasted: ["ISLAM"] }), ["HINDUISM", "ISLAM"]);
  assert.deepEqual(seasonDoors({ home: "SPIRITUAL", openness: "love", tasted: ["BUDDHISM", "BUDDHISM"] }), ["SPIRITUAL", "BUDDHISM"]);
  // a "stay" Hindu during advent and ramadan: nothing from either
  for (const today of ["2026-11-27", "2027-02-12", "2027-02-20"]) {
    const doors = seasonDoors({ home: "HINDUISM", openness: "stay", tasted: ["CHRISTIANITY", "ISLAM"] });
    const c = questCard({ doors, today, quests: {}, lessonDates: [] });
    assert.equal(c, null, today);
  }
});

test("the Today card: an offer from 7 days out, 'not this time' hides it, joining turns it into progress", () => {
  const doors = ["CHRISTIANITY"];
  assert.equal(questCard({ doors, today: "2026-11-21", quests: {}, lessonDates: [] }), null);
  const offer = questCard({ doors, today: "2026-11-25", quests: {}, lessonDates: [] });
  assert.equal(offer.kind, "offer");
  assert.equal(offer.joined, false);
  assert.equal(offer.line, "advent begins sunday · 26 days · join the quest");
  assert.equal(questCard({ doors, today: "2026-11-25", quests: { "advent-2026": { declined: "2026-11-24" } }, lessonDates: [] }), null);
  const inBefore = questCard({ doors, today: "2026-11-25", quests: { "advent-2026": { joined: "2026-11-25" } }, lessonDates: [] });
  assert.equal(inBefore.kind, "offer");
  assert.equal(inBefore.joined, true);
  const day3 = questCard({ doors, today: "2026-12-01", quests: { "advent-2026": { joined: "2026-11-25" } }, lessonDates: ["2026-11-29", "2026-11-30", "2026-12-01"] });
  assert.equal(day3.kind, "progress");
  assert.equal(day3.line, "advent · day 3 of 26");
  assert.equal(day3.progress.lit, 3);
  // mid-season, not joined: "day k of n · join the quest"; on the last day there's no offer to begin
  assert.equal(questCard({ doors: ["ISLAM"], today: "2027-02-19", quests: {}, lessonDates: [] }).line, "ramadan · day 12 of 29 · join the quest");
  assert.equal(questCard({ doors: ["ISLAM"], today: "2027-03-08", quests: {}, lessonDates: [] }), null);
});

test("stones: lessons light them, rest days light them as moons, missed days can be filled in the grace week", () => {
  const s = seasonById("diwali-2027"); // 10-27 .. 10-31
  let p = questProgress(s, { lessonDates: ["2027-10-27", "2027-10-29"], restDates: ["2027-10-28"], today: "2027-10-30" });
  assert.deepEqual(p.stones, ["lit", "rest", "lit", "today", "later"]);
  assert.equal(p.day, 4);
  assert.equal(p.lit, 3);
  assert.equal(p.finished, false);
  // a missed day: the gentle line, never a scold
  p = questProgress(s, { lessonDates: ["2027-10-27", "2027-10-29"], today: "2027-10-31" });
  assert.deepEqual(p.stones, ["lit", "missed", "lit", "missed", "today"]);
  assert.ok(p.canStillFinish);
  assert.match(stillFinishLine(s, p), /^you can still finish\. 3 stones to go/);
  // the grace week fills the earliest missed stones, and the badge comes on the day the last one lights
  p = questProgress(s, { lessonDates: ["2027-10-27", "2027-10-29", "2027-10-30", "2027-10-31", "2027-11-02"], today: "2027-11-03" });
  assert.deepEqual(p.stones, ["lit", "caught", "lit", "lit", "lit"]);
  assert.equal(p.finished, true);
  assert.equal(p.finishedOn, "2027-11-02");
  assert.equal(stillFinishLine(s, p), null);
  // past the grace week with stones unlit: it closes kindly
  p = questProgress(s, { lessonDates: ["2027-10-27"], today: "2027-11-08" });
  assert.equal(p.canStillFinish, false);
  assert.match(stillFinishLine(s, p), /every stone you lit still counts/);
  // a whole 40-day lent, all lit: finished on the 40th day
  const lent = seasonById("lent-2027");
  p = questProgress(lent, { lessonDates: range(lent.start, 40), today: lent.end });
  assert.equal(p.finished, true);
  assert.equal(p.finishedOn, lent.end);
  assert.equal(finishedQuests({ quests: { "lent-2027": { joined: lent.start } }, lessonDates: range(lent.start, 40), today: "2027-06-01" }).length, 1);
  assert.equal(finishedQuests({ quests: {}, lessonDates: range(lent.start, 40), today: "2027-06-01" }).length, 0); // not joined, no badge
});

test("new years: the recap is offered for a week from each tradition's new year", () => {
  assert.equal(newYearNow("HINDUISM", "2026-11-08").name, "diwali");
  assert.equal(newYearNow("HINDUISM", "2026-11-14").name, "diwali");
  assert.equal(newYearNow("HINDUISM", "2026-11-15"), null);
  assert.equal(newYearNow("JUDAISM", "2027-10-02").name, "rosh hashanah");
  assert.equal(newYearNow("ISLAM", "2027-06-06").name, "the islamic new year");
  assert.equal(newYearNow("SIKHISM", "2027-04-14").name, "vaisakhi");
  assert.equal(newYearNow("BUDDHISM", "2027-05-20").name, "vesak");
  for (const d of ["CHRISTIANITY", "CATHOLIC", "SPIRITUAL"]) assert.equal(newYearNow(d, "2027-01-03").name, "the new year");
  assert.equal(newYearNow("ISLAM", "2027-01-03"), null);
});
