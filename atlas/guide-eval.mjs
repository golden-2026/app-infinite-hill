// Guide eval: ask the Guide (or the companion) a fixed set of real questions, two or three per door, and save the
// answers as Markdown for a human to review (atlas/img-dev/guide-eval/answers-<date>.md).
//
// It only talks to a server on this computer. The AI key is never read, printed or written by this script: the local
// server's handlers read ANTHROPIC_API_KEY from that server's own environment, and nothing else sees it.
//
// 1. Start a local server for /api/guide and /api/companion (port 8788 by default), in its own terminal.
//    Without a key, every answer is the offline fallback (good for checking the harness itself):
//      node atlas/guide-eval.mjs serve
//    With a key, set it in that terminal only, for that one command (PowerShell; the key never goes in a file):
//      $env:ANTHROPIC_API_KEY = [Net.NetworkCredential]::new("", (Read-Host -AsSecureString "key")).Password
//      node atlas/guide-eval.mjs serve
//      Remove-Item Env:ANTHROPIC_API_KEY        # after you stop the server (Ctrl+C)
//    (bash: read -rs K && ANTHROPIC_API_KEY="$K" node atlas/guide-eval.mjs serve; unset K)
//    Typing the key at a hidden prompt keeps it out of shell history; don't paste it into a file or a command line.
// 2. In a second terminal, run the questions against it:
//      node atlas/guide-eval.mjs http://127.0.0.1:8788/api/companion --profile expert
//      node atlas/guide-eval.mjs http://127.0.0.1:8788/api/guide --profile new --lang es
//    /api/companion is what the app uses when the AI is on; /api/guide is the older Guide (?flags=guide-live).
//    Options: --profile expert|some|new (default expert), --lang en|es (default en), --day N (the lesson they've
//    reached, default 7, so most questions are past their lessons), --door HINDUISM (only that door's questions),
//    --out <file>. Each answer counts against AI_DAILY_PER_PERSON (60 by default), so one run is ~17 answers.
//
// It refuses any host but this computer: the live site has its own key, limits and real visitors.
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { guideFallback } from "../packages/content/src/index.js";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const LABELS = Object.freeze({
  CHRISTIANITY: "Christianity", CATHOLIC: "Catholicism", HINDUISM: "Hinduism", ISLAM: "Islam",
  JUDAISM: "Judaism", BUDDHISM: "Buddhism", SIKHISM: "Sikhism", SPIRITUAL: "Simply Spiritual",
});

// What a teacher of each tradition might ask; several touch practice details where schools and families differ, and
// a few ask for a personal ritual decision the Guide should explain but leave to the person's own teacher.
export const QUESTIONS = Object.freeze([
  ["HINDUISM", "What is the meaning of the Gayatri mantra?"],
  ["HINDUISM", "Why do we observe a barsi / varshi shraddha?"],
  ["HINDUISM", "How is the Satyanarayan katha performed?"],
  ["JUDAISM", "What is the meaning of lighting Shabbat candles?"],
  ["JUDAISM", "Why is the Mourner's Kaddish said, and for how long?"],
  ["ISLAM", "Why do Muslims face the qibla when they pray?"],
  ["ISLAM", "Can I combine Dhuhr and Asr prayers when I'm travelling?"],
  ["SIKHISM", "What does the Japji Sahib open with?"],
  ["SIKHISM", "What is the meaning of langar?"],
  ["BUDDHISM", "What is the Noble Eightfold Path?"],
  ["BUDDHISM", "What do Buddhists mean by anatta, not-self?"],
  ["CATHOLIC", "What is the meaning of the Eucharist for Catholics?"],
  ["CATHOLIC", "Why do Catholics pray the Rosary?"],
  ["CHRISTIANITY", "What is Lent, and why forty days?"],
  ["CHRISTIANITY", "What does the Bible mean by grace?"],
  ["SPIRITUAL", "What does the Tao Te Ching mean by wu wei?"],
  ["SPIRITUAL", "What did Marcus Aurelius say to himself in the morning?"],
]);

// Fixed onboarding answers (the same enum values the app sends; nothing free-text).
export const PROFILES = Object.freeze({
  expert: { depth: "deep", openness: "stay", commitment: "high", reason: "own" },
  some: { depth: "some", openness: "sometimes", commitment: "mid", reason: "roots" },
  new: { depth: "new", openness: "stay", commitment: "low", reason: "curious" },
});

const LOCAL = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/** The request body for one question, shaped for /api/companion?kind=chat or /api/guide. */
export function bodyFor(kind, door, question, { profile, lang, day }) {
  const messages = [{ role: "user", content: question }];
  if (kind === "companion") {
    return {
      profile: { door, ...profile, lang },
      memory: [],
      context: { door, day, hour: 9 },
      messages,
    };
  }
  return { system: `The user is walking the ${LABELS[door]} door.`, messages, profile: { ...profile, lang } };
}

function args(argv) {
  const out = { profile: "expert", lang: "en", day: 7 };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) out[a.slice(2)] = argv[(i += 1)];
    else rest.push(a);
  }
  return { ...out, rest };
}

async function serve(port) {
  const { default: guide } = await import("../api/guide.js");
  const { default: companion } = await import("../api/companion.js");
  createServer((req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path === "/api/guide") return guide(req, res);
    if (path === "/api/companion") return companion(req, res);
    res.writeHead(404).end("not found");
  }).listen(port, "127.0.0.1", () => {
    // whether a key is set, never the key
    const on = !!process.env.ANTHROPIC_API_KEY;
    console.log(`guide + companion on http://127.0.0.1:${port}/api/guide and /api/companion`);
    console.log(on ? "AI is on (a key is set in this terminal)." : "AI is off (no key in this terminal): answers will be the offline fallback.");
  });
}

async function run(opts) {
  let url;
  try { url = new URL(opts.rest[0]); } catch { throw new Error("give the endpoint, e.g. http://127.0.0.1:8788/api/companion"); }
  if (!LOCAL.has(url.hostname)) throw new Error(`refusing ${url.host}: this eval only runs against a server on this computer.`);
  const kind = /\/api\/companion\/?$/.test(url.pathname) ? "companion" : /\/api\/guide\/?$/.test(url.pathname) ? "guide" : null;
  if (!kind) throw new Error("the endpoint must end in /api/companion or /api/guide");
  if (kind === "companion") url.searchParams.set("kind", "chat");
  const profile = PROFILES[opts.profile];
  if (!profile) throw new Error(`--profile must be one of ${Object.keys(PROFILES).join(", ")}`);
  if (!["en", "es"].includes(opts.lang)) throw new Error("--lang must be en or es");
  const day = Number.parseInt(opts.day, 10);
  if (!Number.isInteger(day) || day < 1) throw new Error("--day must be a whole number from 1");
  const questions = opts.door ? QUESTIONS.filter(([d]) => d === opts.door) : QUESTIONS;
  if (!questions.length) throw new Error(`no questions for --door ${opts.door}`);

  const date = new Date().toISOString().slice(0, 10);
  const file = resolve(opts.out || join(repo, "atlas/img-dev/guide-eval", `answers-${date}.md`));
  const lines = [
    `# Guide eval, ${date}`,
    "",
    `- endpoint: ${url.origin}${url.pathname} (${kind})`,
    `- profile: ${opts.profile} (${Object.entries(profile).map(([k, v]) => `${k} ${v}`).join(", ")}), lang ${opts.lang}, lesson day ${day}`,
    "",
    "For each answer, a reviewer from that tradition checks: is it accurate? does it name its sources? are word-for-word",
    "quotes only from public-domain translations (otherwise marked as paraphrase)? are terms given with their meaning?",
    "are school, regional or family differences named fairly? does it explain a personal ritual decision and leave it to",
    "their own teacher instead of ruling? does it avoid ranking religions and inventing prayers? does it answer fully,",
    "not \"past your lessons\"?",
    "",
  ];
  let ai = 0;
  let fallback = 0;
  for (const [door, question] of questions) {
    let status = 0;
    let text = null;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyFor(kind, door, question, { profile, lang: opts.lang, day })),
        signal: AbortSignal.timeout(30_000),
      });
      status = res.status;
      const body = await res.json().catch(() => ({}));
      if (res.ok && typeof body.text === "string") text = body.text;
    } catch {
      status = 0;
    }
    const source = text ? "AI" : `offline fallback (server said ${status || "nothing"})`;
    if (text) ai += 1;
    else fallback += 1;
    // When the server can't answer, the app answers from the lesson text; show exactly that fallback.
    const answer = text || guideFallback(door, question);
    lines.push(`## ${LABELS[door]}: ${question}`, "", `_${source}_`, "", answer.trim(), "", "Reviewer notes:", "", "---", "");
    process.stdout.write(text ? "." : "f");
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${lines.join("\n")}\n`);
  console.log(`\n${questions.length} questions: ${ai} answered by the AI, ${fallback} by the offline fallback.`);
  console.log(`saved ${relative(process.cwd(), file) || file}`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const opts = args(process.argv.slice(2));
  try {
    if (opts.rest[0] === "serve") await serve(Number.parseInt(opts.rest[1] || "8788", 10));
    else if (opts.rest[0]) await run(opts);
    else console.log("usage: node atlas/guide-eval.mjs serve [port]  |  node atlas/guide-eval.mjs <http://127.0.0.1:8788/api/companion> [--profile expert|some|new] [--lang en|es] [--day N] [--door KEY]");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
