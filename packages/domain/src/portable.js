// Moving days without accounts (pilot decision 2026-09-25: days live on the device).
//   readExport(json)  — a file from "export my data" → { sits, settings, settingsVersion } (invalid rows dropped)
//   fromP0(state)     — the P0 web build's saved state (localStorage "ih:v1") → the same shape, so beta
//                       testers keep every day when the new app replaces the old one on the same address.
import { mergeSits } from "./sits.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DOOR_RE = /^(CHRISTIANITY|CATHOLIC|HINDUISM|ISLAM|JUDAISM|BUDDHISM|SIKHISM|SPIRITUAL)$/;

export function readExport(input) {
  let o = input;
  if (typeof input === "string") {
    try { o = JSON.parse(input); } catch { throw new Error("that file isn't an infinite hill export."); }
  }
  if (!o || typeof o !== "object" || !Array.isArray(o.sits)) throw new Error("that file isn't an infinite hill export.");
  const sits = mergeSits(o.sits);
  const settings = o.settings && typeof o.settings === "object" && !Array.isArray(o.settings) ? o.settings : null;
  return { sits, settings, settingsVersion: Number.isInteger(o.settingsVersion) ? o.settingsVersion : 0 };
}

/** P0 → sit log. The count (distinct dates) and each door's lesson are preserved exactly. */
export function fromP0(p0, { newId } = {}) {
  if (!p0 || typeof p0 !== "object") return null;
  const dates = [...new Set((Array.isArray(p0.dates) ? p0.dates : []).filter((d) => DATE_RE.test(d)))].sort();
  const ui = p0.ui && typeof p0.ui === "object" ? p0.ui : {};
  const home = DOOR_RE.test(ui.homeWing) ? ui.homeWing : "HINDUISM";
  const sits = [];
  const used = new Set();
  const add = (door, day, date) => {
    // stable id: the same P0 data always makes the same sits (re-running or importing never duplicates)
    sits.push({ id: `p0_${door.toLowerCase()}_${day}_${date}`, door, day, date, tz: null, kidId: null, deviceId: null, at: `${date}T12:00:00.000Z` });
    used.add(date);
  };
  for (const [door, p] of Object.entries(p0.paths && typeof p0.paths === "object" ? p0.paths : {})) {
    if (!DOOR_RE.test(door) || !p || !Number.isInteger(p.day)) continue;
    const completed = p.done ? p.day : p.day - 1; // lessons finished on this door
    const last = DATE_RE.test(p.lastDate) ? p.lastDate : dates.at(-1);
    if (!last) continue;
    const earlier = dates.filter((d) => d <= last);
    for (let i = 1; i <= completed; i++) {
      const date = i === completed ? last : earlier[Math.max(0, earlier.length - 1 - (completed - i))] || last;
      add(door, i, date);
    }
  }
  // every shown-up date still counts: dates with no lesson record become a repeat of lesson 1 (moves nothing)
  for (const d of dates) if (!used.has(d)) add(home, 1, d);

  const goal = p0.goal && typeof p0.goal === "object" && DATE_RE.test(p0.goal.setOn) ? { days: p0.goal.days ?? null, setOn: p0.goal.setOn } : null;
  const book = (Array.isArray(ui.book) ? ui.book : []).map((b) => ({ line: String(b.carry || b.word || ""), door: DOOR_RE.test(b.wing) ? b.wing : home, date: dates.at(-1) || "" })).filter((b) => b.line);
  const kids = (Array.isArray(p0.kids) ? p0.kids : []).filter((k) => k && k.name).map((k, i) => ({ id: `kid_p0_${i}`, name: String(k.name).slice(0, 40), door: DOOR_RE.test(k.wing) ? k.wing : home, birthYear: Number.isInteger(k.age) ? new Date().getFullYear() - k.age : undefined }));
  const settings = {
    onboarded: ui.onboarded === true || dates.length > 0,
    homeWing: home,
    visitWing: DOOR_RE.test(ui.visitWing) && ui.visitWing !== home ? ui.visitWing : null,
    active: ui.active === "visit" && DOOR_RE.test(ui.visitWing) ? "visit" : "home",
    goal,
    voiceOn: ui.voiceOn !== false,
    chime: ui.chime !== false,
    book,
    kids,
  };
  return { sits: mergeSits(sits), settings, settingsVersion: 1 };
}
