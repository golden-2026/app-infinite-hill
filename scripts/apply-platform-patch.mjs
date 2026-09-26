#!/usr/bin/env node
// apply-platform-patch: design/infinitehill_v175.jsx (the published build, byte-for-byte) + the platform
// hooks below = src/InfiniteHill.jsx (generated, git-ignored). Runs before dev and build.
//
// Why: the Claude Project keeps shipping the UI as one file (Kayan 2026-09-25: "verbatim"). The product
// needs saved progress, real calendar days and honest labels. Each edit is anchored on exact source text
// and must match the expected number of times, so a new build either re-patches cleanly or fails loudly.
// Every hook checks for window.IH; without it (inside claude.ai) the prototype behaves exactly as shipped.
// See docs/PLATFORM_CONTRACT.md.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE = join(ROOT, "design", "infinitehill_v175.jsx");
export const TARGET = join(ROOT, "src", "InfiniteHill.jsx");
const HAS_IH = 'typeof window !== "undefined" && window.IH';

export const EDITS = [
  {
    name: "platform handle + saved state",
    find: 'export default function App({ startDoor = null, embed = false } = {}) {\n',
    replace: 'export default function App({ startDoor = null, embed = false } = {}) {\n' +
      '  // platform (P0): saved progress and real days. Without window.IH (claude.ai) nothing changes.\n' +
      '  const IH = typeof window !== "undefined" ? window.IH || null : null;\n' +
      '  const [saved] = useState(() => (IH ? IH.load() : null)); const ui = (saved && saved.ui) || {};\n',
  },
  { name: "first run", find: "const [firstRun, setFirstRun] = useState(true);", replace: "const [firstRun, setFirstRun] = useState(!ui.onboarded);" },
  {
    name: "home and visit doors",
    find: 'useState(startDoor || "HINDUISM"); const [visitWing, setVisitWing] = useState(null);',
    replace: 'useState(ui.homeWing || startDoor || "HINDUISM"); const [visitWing, setVisitWing] = useState(ui.visitWing || null);',
  },
  { name: "active door", find: 'const [active, setActive] = useState("home");', replace: 'const [active, setActive] = useState(ui.active === "visit" && ui.visitWing ? "visit" : "home");' },
  { name: "paths", find: "const [paths, setPaths] = useState({}); // wing → { day, done }", replace: "const [paths, setPaths] = useState((saved && saved.paths) || {}); // wing → { day, done }" },
  {
    name: "day count starts at 0 (was 1: off by one)",
    find: "const [showedUp, setShowedUp] = useState(1); // account-level days",
    replace: "const [showedUp, setShowedUp] = useState(IH ? ((saved && saved.showedUp) || 0) : 1); // account-level days",
  },
  { name: "kids", find: "const [kids, setKids] = useState([]);", replace: "const [kids, setKids] = useState((saved && saved.kids) || []);" },
  {
    name: "finishing a sit goes through the day engine",
    find: "const finishDay = () => { if (kid) {",
    replace: "const finishDay = () => { if (IH) { const r = IH.completeSit({ door: wing, kidIndex: kid ? asKid : null }); if (kid) { setKids(r.state.kids); return; } setShowedUp(r.showedUp); setPaths(r.state.paths); return; } if (kid) {",
  },
  {
    name: "book, signals, moment",
    find: "const [book, setBook] = useState([]); const [signals, setSignals] = useState([]); const [moment, setMoment] = useState(null);",
    replace: "const [book, setBook] = useState(ui.book || []); const [signals, setSignals] = useState(ui.signals || []); const [moment, setMoment] = useState(ui.moment || null);",
  },
  { name: "placement offset", find: "const [offset, setOffset] = useState(0);", replace: "const [offset, setOffset] = useState(ui.offset || 0);" },
  { name: "plan", find: 'const [plan, setPlan] = useState("trial");', replace: 'const [plan, setPlan] = useState(ui.plan || "trial");' },
  { name: "chime", find: "const [chime, setChime] = useState(true);", replace: "const [chime, setChime] = useState(ui.chime !== false);" },
  {
    name: "voice setting + save on every change",
    find: "const [voiceOn, setVoiceOn] = useState(true);\n",
    replace: "const [voiceOn, setVoiceOn] = useState(ui.voiceOn !== false);\n" +
      "  useEffect(() => { if (IH) IH.save({ onboarded: !firstRun, homeWing, visitWing, active, paths, kids, book, signals, moment, offset, plan, chime, voiceOn }); }, [firstRun, homeWing, visitWing, active, paths, kids, book, signals, moment, offset, plan, chime, voiceOn]);\n",
  },
  {
    name: "keep the day-1 goal (was thrown away)",
    find: "}} onDone={() => setPost(false)} />}",
    replace: "}} onDone={(goal) => { setPost(false); if (IH && goal) IH.setGoal(goal); }} />}",
  },
  {
    name: "real sit times unless ?demo=1",
    find: 'function Session({ wing, day, lesson, voiceOn, onDone, demoFast = true, mode = "adult" }) {',
    replace: `function Session({ wing, day, lesson, voiceOn, onDone, demoFast = (${HAS_IH}) ? window.IH.demo : true, mode = "adult" }) {`,
  },
  {
    name: "demo skip-to-tomorrow only with ?demo=1",
    find: '<Btn kind="light" onClick={onNext}>Demo: skip to tomorrow →</Btn>',
    replace: `{(!(${HAS_IH}) || window.IH.demo) && <Btn kind="light" onClick={onNext}>Demo: skip to tomorrow →</Btn>}`,
    count: 2,
  },
  {
    name: "truthful voice disclosure on the welcome (voice not signed yet)",
    find: "{ic.short} is in your ear for every {label(door)} lesson — says the word, you say it back, then reads you the story. It's a licensed voice, used with their permission, and it only ever reads words a Keeper has checked — it never improvises.",
    replace: `{(${HAS_IH}) ? window.IH.voiceLabel(door, ic.short).claim : <>{ic.short} is in your ear for every {label(door)} lesson — says the word, you say it back, then reads you the story. It's a licensed voice, used with their permission, and it only ever reads words a Keeper has checked — it never improvises.</>}`,
  },
  {
    name: "truthful reader in the session header",
    find: '{ic.short} reads · {label(wing)}{segLabel ? " · " + segLabel : ""}',
    replace: `{(${HAS_IH}) ? window.IH.voiceLabel(wing, ic.short).short : ic.short} reads · {label(wing)}{segLabel ? " · " + segLabel : ""}`,
  },
  {
    name: "truthful reader before the read",
    find: 'now {ic.short} reads you {lesson === 1 ? "day one" : "the lesson"}.',
    replace: `now {(${HAS_IH}) ? window.IH.voiceLabel(wing, ic.short).short : ic.short} reads you {lesson === 1 ? "day one" : "the lesson"}.`,
  },
  {
    name: "no fake live count",
    find: 'fontSize: 44, lineHeight: 1, marginTop: 6 }}>1,204</div>\n          <div style={{ ...body, color: "#ffffffcc", marginTop: 4 }}>people in a session this minute · eight doors, one house</div>',
    replace: `fontSize: 44, lineHeight: 1, marginTop: 6 }}>{(${HAS_IH}) ? "soon" : "1,204"}</div>\n          <div style={{ ...body, color: "#ffffffcc", marginTop: 4 }}>{(${HAS_IH}) ? "live counts start with the founding 108 · eight doors, one house" : "people in a session this minute · eight doors, one house"}</div>`,
  },
  { name: "no fake door counts", find: "{l} · {c.toLocaleString()}</div>", replace: `{(${HAS_IH}) ? l : <>{l} · {c.toLocaleString()}</>}</div>` },
  {
    name: "no fake walking/LA counts",
    find: "{(DOORS.find((d) => d[1] === wing)?.[2] || 0).toLocaleString()} walking {label(wing)}</div><div style={{ ...body, fontSize: 12, color: C.mute }}>340 in LA · 61 sat down in the last hour · you're on day {day}</div>",
    replace: `{(${HAS_IH}) ? "walking " + label(wing) : (DOORS.find((d) => d[1] === wing)?.[2] || 0).toLocaleString() + " walking " + label(wing)}</div><div style={{ ...body, fontSize: 12, color: C.mute }}>{(${HAS_IH}) ? "you're on day " + day : "340 in LA · 61 sat down in the last hour · you're on day " + day}</div>`,
  },
  {
    name: "no made-up table members (mom, nani, Ria, Jonah)",
    find: "<TableCard wing={wing} day={day} />",
    replace: `{!(${HAS_IH}) && <TableCard wing={wing} day={day} />}`,
  },
  {
    name: "no promised live read until one is booked (?flags=live-read)",
    find: '<Card style={{ background: DUSK, border: "none", color: "#fff" }}>\n          <div style={{ ...eyebrow, color: C.gold }}>next live read</div>',
    replace: `{(!(${HAS_IH}) || window.IH.flag("live-read")) && <Card style={{ background: DUSK, border: "none", color: "#fff" }}>\n          <div style={{ ...eyebrow, color: C.gold }}>next live read</div>`,
  },
  { name: "live read card close", find: '<div style={{ marginTop: 12 }}><Btn kind="gold">Remind me</Btn></div>\n        </Card>', replace: '<div style={{ marginTop: 12 }}><Btn kind="gold">Remind me</Btn></div>\n        </Card>}' },
  {
    name: "no sample events with past dates and made-up RSVPs (?flags=events)",
    find: "<Card>\n          <div style={eyebrow}>golden hour nights · near you</div>",
    replace: `{(!(${HAS_IH}) || window.IH.flag("events")) && <Card>\n          <div style={eyebrow}>golden hour nights · near you</div>`,
  },
  { name: "events card close", find: "we point you to people who do.</div>\n        </Card>", replace: "we point you to people who do.</div>\n        </Card>}" },
  {
    name: "truthful reader on the first-night pick card",
    find: '{d1.title || "the oldest hello"} · read by {si.short}',
    replace: `{d1.title || "the oldest hello"} · read by {(${HAS_IH}) ? window.IH.voiceLabel(sw, si.short).short : si.short}`,
  },
  {
    name: "truthful voice promise on the welcome",
    find: "{ic.short}'s voice, every session — the faith they actually grew up in.",
    replace: `{(${HAS_IH}) && !window.IH.voiceLabel(door, ic.short).licensed ? <>{ic.short} will read every session once they record — the faith they actually grew up in.</> : <>{ic.short}'s voice, every session — the faith they actually grew up in.</>}`,
  },
  {
    name: "truthful reader on the Together door card",
    find: "<div style={eyebrow}>{label(wing)} · read by {ic.short}</div>",
    replace: `<div style={eyebrow}>{label(wing)} · read by {(${HAS_IH}) ? window.IH.voiceLabel(wing, ic.short).short : ic.short}</div>`,
  },
  {
    name: "honest save-your-day (accounts are not live yet)",
    find: '<div style={{ display: "grid", gap: 10 }}>\n        <Btn onClick={() => setStep(5)}> Apple</Btn>',
    replace: `{(${HAS_IH}) && !window.IH.flag("accounts") && <div style={{ ...body, fontSize: 13, color: C.mute }}>saved on this phone. accounts arrive with the pilot.</div>}\n      <div style={{ display: (${HAS_IH}) && !window.IH.flag("accounts") ? "none" : "grid", gap: 10 }}>\n        <Btn onClick={() => setStep(5)}> Apple</Btn>`,
  },
  {
    name: "honest storage note",
    find: "until then, this is a demo and nothing is stored.",
    replace: `until then, {(${HAS_IH}) ? "your days are saved on this device only." : "this is a demo and nothing is stored."}`,
  },
];

export function applyPlatformPatch(source) {
  let out = source;
  for (const e of EDITS) {
    const n = out.split(e.find).length - 1;
    const want = e.count ?? 1;
    if (n !== want) throw new Error(`patch "${e.name}": anchor found ${n} times, expected ${want}. The build changed; update scripts/apply-platform-patch.mjs.`);
    out = out.split(e.find).join(e.replace);
  }
  return "// GENERATED by scripts/apply-platform-patch.mjs from design/infinitehill_v175.jsx. Do not edit.\n" + out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = applyPlatformPatch(readFileSync(SOURCE, "utf8"));
  writeFileSync(TARGET, out);
  console.log(`platform patch: ${EDITS.length} edits applied -> src/InfiniteHill.jsx`);
}
