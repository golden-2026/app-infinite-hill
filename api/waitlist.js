// Waitlist and invite-only access, behind the launch switch. While the switch is off (the default) the public parts
// answer 404 and the app and website behave exactly as before; the admin parts still work so codes can be prepared.
//
// The switch: the server setting INVITE_ONLY=on (Netlify: Site configuration > Environment variables, scope Functions).
// The app and the website both ask GET /api/waitlist?kind=status, so one setting turns everything on, with no rebuild.
//
// GET/POST /api/waitlist?kind=…
//   status        GET            → { inviteOnly, foundingCap, full }. Always answers (off: { inviteOnly: false }).
//   join          POST           { email, door, name?, ref?, lang?, website? } → { position, waiting, door, code, link, key,
//                                  refs, rule }. `website` is a honeypot: people never see it; bots fill it in and get a
//                                  bare { ok: true } with nothing stored. `key` is this person's private key (the phone
//                                  or the page keeps it) for checking their place and for "delete me".
//   me            GET  (key)     → where you stand now: { state: "waiting", position, waiting, refs, … } or, once your
//                                  door has released you, { state: "invited", inviteCode, inviteLink }.
//   leave         POST (key)     → delete me from the waitlist (email, name, door, codes, all of it).
//   check         GET            ?code= → { ok, kind } is this invite code good (without using it up).
//   redeem        POST           { code, nick?, showNick? } → { memberId, token, invites }: use an invite and become a
//                                  member with MEMBER_INVITES invites of your own. A nickname is kept only with
//                                  showNick: true, and only so the person who invited you can see who came in.
//   claim         POST           {} → a member identity for someone who was already in the private beta before the
//                                  switch (rate limited, and capped by WAITLIST_BETA_CLAIMS, default 500).
//   invites       GET  (member)  → your invite links: which are still free, which were used (and by whom, if they chose).
//   member-leave  POST (member)  → forget my member identity and my unused invites.
// Admin (Authorization: Bearer <WAITLIST_ADMIN_KEY>; without the key set on the server, these answer 404):
//   admin-stats   GET            → counts by door (waiting, invited), members, founding cap.
//   admin-release POST           { n, door?, lang? } → marks the next n in line (best place first) as invited and returns
//                                  their email, first name, door, invite code and link, so the owner can send them.
//   admin-codes   POST           { n, uses?, label? } → codes not tied to the waitlist (Keepers, voices, partners).
//   admin-grant   POST           { memberId, n } → n more invites for a member (circle leaders, Keepers).
//   admin-remove  POST           { email } → delete someone who asked by email.
//
// What is stored, per person on the list: email, chosen door, first name if given, when they joined, their own
// referral code, the code that referred them (if any), a hash of their private key, and their place-number. Per member:
// a hash of their token, their invite codes, and how they came in. Per invite: who it belongs to, how many uses, and
// for each use a nickname only if the newcomer chose to show it. When someone on the list becomes a member, their
// email, name and door are deleted. Nothing is ever logged. Storage: Netlify Blobs (netlify/_shared/waitlist-store.js);
// a Map in tests and local development.
//
// Moving up, the plain rule: your place is set by when you joined. Each friend who joins the list with your link moves
// you up to REF_PLACES places (it can't take you past the front), and up to REF_CAP friends count.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const DOORS = Object.freeze(["CHRISTIANITY", "CATHOLIC", "HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "SPIRITUAL"]);
export const REF_PLACES = 100;
export const REF_CAP = 10;
export const MEMBER_INVITES = 3;
export const FOUNDING_CAP_DEFAULT = 10_000;
const BETA_CLAIMS_DEFAULT = 500;
const MAX_BODY_BYTES = 2 * 1024;
const EMAIL_MAX = 254;
const NAME_MAX = 40;
const NICK_MAX = 24;
const LABEL_MAX = 40;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,24}$/i;
const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789"; // no i, l, o, 0 or 1: easy to type from a text message
export const CODE_RE = /^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/;
const ID_RE = /^w_[a-f0-9]{16}$/;
const MID_RE = /^m_[a-f0-9]{24}$/;
const LIMIT = { perMinute: 30, joinsPerHour: 5, redeemsPerHour: 20, checksPerHour: 60, claimsPerDay: 2, adminPerMinute: 30 };

// ---------- storage ----------
function memoryStore() {
  const map = new Map();
  return {
    async get(key) { return map.has(key) ? structuredClone(map.get(key)) : null; },
    async set(key, value) { map.set(key, structuredClone(value)); },
    async delete(key) { map.delete(key); },
    /** Change one record in place: fn(current|null) → next, or null to delete it. */
    async bump(key, fn) {
      const next = fn(map.has(key) ? structuredClone(map.get(key)) : null);
      if (next === null) map.delete(key); else map.set(key, structuredClone(next));
      return next;
    },
  };
}
let store = memoryStore();
/** Swap the storage: get, set, delete, bump(key, fn). No argument: a fresh Map (tests). */
export function useWaitlistStore(next) { store = next || memoryStore(); }

// ---------- the switch and settings (read on every request, so a changed setting needs no rebuild) ----------
export const inviteOnly = () => ["1", "on", "true", "yes"].includes(String(process.env.INVITE_ONLY || "").trim().toLowerCase());
const foundingCap = () => { const n = Number(process.env.WAITLIST_FOUNDING_CAP); return Number.isInteger(n) && n > 0 ? n : FOUNDING_CAP_DEFAULT; };
const claimCap = () => { const n = Number(process.env.WAITLIST_BETA_CLAIMS); return Number.isInteger(n) && n >= 0 ? n : BETA_CLAIMS_DEFAULT; };

// ---------- small helpers ----------
const sha = (s) => createHash("sha256").update(s).digest("hex");
const salt = () => process.env.WAITLIST_SALT || "ih-waitlist";
const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const onlyKeys = (v, allowed) => Object.keys(v).every((k) => allowed.includes(k));
const newCode = () => [...randomBytes(8)].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
const clean = (v, max) => {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001F\u007F<>{}​-‏‪-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim().slice(0, max).trim();
  return s || null;
};
export const normEmail = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
export const validEmail = (e) => typeof e === "string" && e.length <= EMAIL_MAX && EMAIL_RE.test(e) && !e.includes("..");
const emailKey = (email) => `email/${sha(`${salt()}|${email}`)}`;
/** Your score in line: lower is nearer the front. On a tie, the one moved up by friends goes first (so a friend moves
 *  you up the full REF_PLACES), then whoever joined first. */
export const rankOf = (seq, refs) => seq - REF_PLACES * Math.min(refs || 0, REF_CAP);

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(payload));
}
const fail = (statusCode) => Object.assign(new Error("bad request"), { statusCode });

async function readBody(req) {
  let raw;
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) raw = req.body.toString("utf8");
    else if (typeof req.body === "string") raw = req.body;
    else if (isObject(req.body)) raw = JSON.stringify(req.body);
    else throw fail(400);
  } else {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += b.byteLength;
      if (size > MAX_BODY_BYTES) throw fail(413);
      chunks.push(b);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.byteLength(raw || "") > MAX_BODY_BYTES) throw fail(413);
  if (!raw) return {};
  try { const v = JSON.parse(raw); if (!isObject(v)) throw 0; return v; } catch { throw fail(400); }
}

function query(req) {
  try { return new URL(req.url || "/", "http://localhost").searchParams; } catch { return new URLSearchParams(); }
}

function clientAddress(req) {
  const h = req.headers || {};
  const direct = h["x-nf-client-connection-ip"] || h["x-real-ip"];
  const forwarded = typeof h["x-forwarded-for"] === "string" ? h["x-forwarded-for"].split(",")[0] : "";
  return String(direct || forwarded || "unknown").trim().slice(0, 64);
}

/** Counts per connection (a one-way code that changes every hour; the address itself is never stored). Fails open. */
async function allowed(req, bucket, limit, now) {
  try {
    const day = bucket === "claim";
    const slot = bucket === "minute" || bucket === "admin" ? now.toISOString().slice(0, 16) : day ? now.toISOString().slice(0, 10) : now.toISOString().slice(0, 13);
    const who = sha(`waitlist|${salt()}|${slot}|${clientAddress(req)}`).slice(0, 24);
    const key = `rate/${bucket}/${slot}/${who}`;
    const doc = (await store.get(key)) || { n: 0 };
    if (doc.n >= limit) return false;
    await store.set(key, { n: doc.n + 1 });
    return true;
  } catch {
    return true;
  }
}

/** The address people are sent to: WAITLIST_SITE_URL, or this request's own host (https, except on this computer). */
export function siteBase(req) {
  const fixed = String(process.env.WAITLIST_SITE_URL || "").trim().replace(/\/+$/, "");
  if (/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(fixed)) return fixed;
  const h = req.headers || {};
  const host = String(h["x-forwarded-host"] || h.host || "").split(",")[0].trim().toLowerCase();
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/.test(host)) return "https://golden-house-beta.netlify.app";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) || host.endsWith(".localhost") || /\.test(:\d+)?$/.test(host);
  return `${local ? "http" : "https"}://${host}`;
}
const lang = (v) => (v === "es" ? "es" : "en");
/** Share link for the waitlist: the website, with your code. */
export const shareLink = (base, code, l) => `${base}/${lang(l) === "es" ? "site-es.html" : "site.html"}?ref=${code}`;
/** Invite link: straight into the app, which checks and uses the code. */
export const inviteLink = (base, code, l) => `${base}/invite?code=${code}${lang(l) === "es" ? "&lang=es" : ""}`;

// ---------- the line (one record, changed with a conditional write so joins landing at once all count) ----------
// line = { seq, members, claims, rows: { [entryId]: [door, seq, refs, state] } }, state "w" waiting or "i" invited.
const emptyLine = () => ({ seq: 0, members: 0, claims: 0, rows: {} });
const readLine = async () => (await store.get("line")) || emptyLine();

/** Your real place in your door's line (1 is the front), and how many are waiting for that door. */
export function placeIn(line, id) {
  const me = line.rows[id];
  if (!me) return null;
  const [door, seq, refs] = me;
  const mine = rankOf(seq, refs);
  let ahead = 0, waiting = 0;
  for (const [door2, seq2, refs2, st2] of Object.values(line.rows)) {
    if (door2 !== door || st2 !== "w") continue;
    waiting++;
    const r = rankOf(seq2, refs2);
    if (r < mine || (r === mine && (Math.min(refs2, REF_CAP) > Math.min(refs, REF_CAP) || (Math.min(refs2, REF_CAP) === Math.min(refs, REF_CAP) && seq2 < seq)))) ahead++;
  }
  return { position: ahead + 1, waiting, refs: Math.min(refs, REF_CAP), door };
}

/** Who is next in line, best place first. door: one door, or every door. */
export function nextInLine(line, n, door = null) {
  return Object.entries(line.rows)
    .filter(([, r]) => r[3] === "w" && (!door || r[0] === door))
    .sort(([, a], [, b]) => rankOf(a[1], a[2]) - rankOf(b[1], b[2]) || Math.min(b[2], REF_CAP) - Math.min(a[2], REF_CAP) || a[1] - b[1])
    .slice(0, n)
    .map(([id]) => id);
}

// ---------- members and invites ----------
async function makeCodes(n, doc) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let code = newCode();
    for (let tries = 0; tries < 5 && (await store.get(`invite/${code}`)); tries++) code = newCode();
    await store.set(`invite/${code}`, { ...doc, used: 0, joined: [] });
    out.push(code);
  }
  return out;
}

/**
 * Give a member n more invites (circle leaders, Keepers, voices). Others may call this, e.g. api/circles.js when a
 * circle grows. memberId is the member's `m_…` id (lib/invites on the phone knows it). Returns the new codes, or null.
 */
export async function grantInvites(memberId, n, { now = new Date() } = {}) {
  if (typeof memberId !== "string" || !MID_RE.test(memberId) || !Number.isInteger(n) || n < 1 || n > 100) return null;
  const me = await store.get(`member/${memberId}`);
  if (!me) return null;
  const codes = await makeCodes(n, { kind: "member", from: memberId, uses: 1, created: now.toISOString() });
  await store.bump(`member/${memberId}`, (cur) => (cur ? { ...cur, codes: [...(cur.codes || []), ...codes], granted: (cur.granted || 0) + n } : null));
  return codes;
}

async function newMember(via, invitedBy, now) {
  const memberId = `m_${randomBytes(12).toString("hex")}`;
  const token = randomBytes(32).toString("hex");
  const codes = await makeCodes(MEMBER_INVITES, { kind: "member", from: memberId, uses: 1, created: now.toISOString() });
  await store.set(`member/${memberId}`, { tokenHash: sha(token), created: now.toISOString(), via, invitedBy: invitedBy || null, codes, granted: 0 });
  return { memberId, token, invites: codes.length };
}

async function memberFrom(req) {
  const m = /^Member (m_[a-f0-9]{24}):([a-f0-9]{64})$/.exec(String(req.headers?.authorization || ""));
  if (!m) return null;
  const me = await store.get(`member/${m[1]}`);
  if (!me?.tokenHash) return null;
  const a = Buffer.from(me.tokenHash, "hex"), b = Buffer.from(sha(m[2]), "hex");
  return a.length === b.length && timingSafeEqual(a, b) ? { id: m[1], ...me } : null;
}

async function entryFrom(req) {
  const m = /^Waitlist ([a-f0-9]{64})$/.exec(String(req.headers?.authorization || ""));
  if (!m) return null;
  const id = await store.get(`key/${sha(m[1])}`);
  if (!id?.id || !ID_RE.test(id.id)) return null;
  const e = await store.get(`entry/${id.id}`);
  return e ? { id: id.id, ...e } : null;
}

function adminOk(req) {
  const key = process.env.WAITLIST_ADMIN_KEY;
  if (!key || key.length < 16) return false;
  const m = /^Bearer (.+)$/.exec(String(req.headers?.authorization || ""));
  if (!m) return false;
  const a = Buffer.from(sha(m[1]), "hex"), b = Buffer.from(sha(key), "hex");
  return timingSafeEqual(a, b);
}

/** Take someone off the list completely: their records, their place, and the credit they gave a friend. */
async function removeEntry(id, e) {
  let referrer = null;
  if (e.referredBy) referrer = (await store.get(`ref/${e.referredBy}`))?.id || null;
  await store.bump("line", (cur) => {
    const line = cur || emptyLine();
    delete line.rows[id];
    if (referrer && line.rows[referrer]) line.rows[referrer][2] = Math.max(0, line.rows[referrer][2] - 1);
    return line;
  });
  if (e.inviteCode) {
    const inv = await store.get(`invite/${e.inviteCode}`);
    if (inv && !inv.used) await store.delete(`invite/${e.inviteCode}`);
  }
  await store.delete(`ref/${e.code}`);
  if (e.keyHash) await store.delete(`key/${e.keyHash}`);
  await store.delete(emailKey(e.email));
  await store.delete(`entry/${id}`);
}

// ---------------------------------------------------------------------------------------------------------------
// EMAIL PROVIDER HOOK. No email provider is configured: nothing is sent, and the admin script prints the invited list
// so the owner can send the invites by hand. To plug one in later (e.g. Resend or Postmark): set its API key as a
// server-only environment variable (never EXPO_PUBLIC_* / VITE_*), send one message per person here, and return how
// many were actually accepted by the provider. Never log the addresses.
// ---------------------------------------------------------------------------------------------------------------
export async function deliverInvites(list) {
  return { provider: null, sent: 0, pending: list.length, note: "no email provider is configured; send these yourself" };
}

const RULE = { places: REF_PLACES, cap: REF_CAP };

export default async function waitlist(req, res, { now = new Date() } = {}) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const q = query(req);
  const kind = q.get("kind");
  const KINDS = {
    status: "GET", join: "POST", me: "GET", leave: "POST", check: "GET", redeem: "POST", claim: "POST", invites: "GET", "member-leave": "POST",
    "admin-stats": "GET", "admin-release": "POST", "admin-codes": "POST", "admin-grant": "POST", "admin-remove": "POST",
  };
  if (!kind || !Object.hasOwn(KINDS, kind)) return json(res, 400, { error: "Unknown waitlist request" });
  if (req.method !== KINDS[kind]) {
    res.setHeader("Allow", KINDS[kind]);
    return json(res, 405, { error: "Method not allowed" });
  }
  const admin = kind.startsWith("admin-");
  if (admin && !adminOk(req)) return json(res, 404, { error: "Not found" });
  if (!(await allowed(req, admin ? "admin" : "minute", admin ? LIMIT.adminPerMinute : LIMIT.perMinute, now))) return json(res, 429, { error: "Slow down" });
  if (kind === "status") {
    if (!inviteOnly()) return json(res, 200, { inviteOnly: false });
    try {
      const line = await readLine();
      return json(res, 200, { inviteOnly: true, foundingCap: foundingCap(), full: line.members >= foundingCap() });
    } catch {
      return json(res, 200, { inviteOnly: true, foundingCap: foundingCap(), full: false });
    }
  }
  // the public parts only exist while the switch is on
  if (!admin && !inviteOnly()) return json(res, 404, { error: "The waitlist isn't open" });

  let body = {};
  if (req.method === "POST") {
    const type = String(req.headers?.["content-type"] || "").split(";")[0].trim().toLowerCase();
    if (type !== "application/json") return json(res, 415, { error: "Expected JSON request" });
    try { body = await readBody(req); } catch (e) { return json(res, e.statusCode || 400, { error: e.statusCode === 413 ? "Request body too large" : "Invalid waitlist request" }); }
  }
  const base = siteBase(req);

  try {
    if (kind === "join") {
      if (!onlyKeys(body, ["email", "door", "name", "ref", "lang", "website"])) return json(res, 400, { error: "Invalid waitlist request" });
      if (body.website) return json(res, 200, { ok: true }); // the honeypot: a bot filled the hidden field. Nothing stored.
      if (!(await allowed(req, "join", LIMIT.joinsPerHour, now))) return json(res, 429, { error: "Slow down" });
      const email = normEmail(body.email);
      if (!validEmail(email)) return json(res, 400, { error: "Check the email address", field: "email" });
      if (!DOORS.includes(body.door)) return json(res, 400, { error: "Pick a door", field: "door" });
      const name = body.name === undefined || body.name === null || body.name === "" ? null : clean(body.name, NAME_MAX);
      const ref = typeof body.ref === "string" && CODE_RE.test(body.ref.toLowerCase()) ? body.ref.toLowerCase() : null;
      const prior = await store.get(emailKey(email));
      if (prior?.id && (await store.get(`entry/${prior.id}`))) return json(res, 409, { error: "That email is already on the list", already: true });

      const id = `w_${randomBytes(8).toString("hex")}`;
      let code = newCode();
      for (let tries = 0; tries < 5 && (await store.get(`ref/${code}`)); tries++) code = newCode();
      const key = randomBytes(32).toString("hex");
      const referrer = ref ? (await store.get(`ref/${ref}`))?.id || null : null;
      // claim the email first, so two joins at once with the same address can't both get in
      await store.set(emailKey(email), { id });
      let seq = 0;
      const line = await store.bump("line", (cur) => {
        const l = cur || emptyLine();
        seq = l.seq + 1;
        l.seq = seq;
        l.rows[id] = [body.door, seq, 0, "w"];
        if (referrer && l.rows[referrer]) l.rows[referrer][2] += 1;
        return l;
      });
      await store.set(`entry/${id}`, { email, door: body.door, name, created: now.toISOString(), seq, code, referredBy: referrer ? ref : null, keyHash: sha(key), lang: lang(body.lang) });
      await store.set(`ref/${code}`, { id });
      await store.set(`key/${sha(key)}`, { id });
      const place = placeIn(line, id);
      return json(res, 200, { ok: true, ...place, code, link: shareLink(base, code, body.lang), key, rule: RULE });
    }

    if (kind === "me" || kind === "leave") {
      const e = await entryFrom(req);
      if (!e) return json(res, 401, { error: "We couldn't find you on the list" });
      if (kind === "leave") {
        if (Object.keys(body).length) return json(res, 400, { error: "Invalid waitlist request" });
        await removeEntry(e.id, e);
        return json(res, 200, { ok: true });
      }
      const line = await readLine();
      const row = line.rows[e.id];
      if (row?.[3] === "i" && e.inviteCode) return json(res, 200, { state: "invited", door: e.door, inviteCode: e.inviteCode, inviteLink: inviteLink(base, e.inviteCode, e.lang), code: e.code, rule: RULE });
      const place = placeIn(line, e.id);
      if (!place) return json(res, 401, { error: "We couldn't find you on the list" });
      return json(res, 200, { state: "waiting", ...place, code: e.code, link: shareLink(base, e.code, e.lang), rule: RULE });
    }

    if (kind === "check") {
      if (!(await allowed(req, "check", LIMIT.checksPerHour, now))) return json(res, 429, { error: "Slow down" });
      const code = String(q.get("code") || "").toLowerCase();
      if (!CODE_RE.test(code)) return json(res, 400, { error: "That code doesn't look right" });
      const inv = await store.get(`invite/${code}`);
      if (!inv || inv.used >= inv.uses) return json(res, 404, { error: "That invite has already been used or doesn't exist" });
      return json(res, 200, { ok: true, kind: inv.kind });
    }

    if (kind === "redeem") {
      if (!onlyKeys(body, ["code", "nick", "showNick"])) return json(res, 400, { error: "Invalid waitlist request" });
      if (!(await allowed(req, "redeem", LIMIT.redeemsPerHour, now))) return json(res, 429, { error: "Slow down" });
      const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
      if (!CODE_RE.test(code)) return json(res, 400, { error: "That code doesn't look right" });
      const nick = body.showNick === true ? clean(body.nick, NICK_MAX) : null;
      const cap = foundingCap();
      if ((await readLine()).members >= cap) return json(res, 409, { error: "The founding class is full", full: true });
      // use the invite (a conditional write: two people with one single-use code can't both get in)
      let ok = false, inv = null;
      await store.bump(`invite/${code}`, (cur) => {
        if (!cur || cur.used >= cur.uses) { ok = false; return cur; }
        ok = true; inv = cur;
        return { ...cur, used: cur.used + 1, joined: [...(cur.joined || []), { nick, at: now.toISOString() }].slice(-500) };
      });
      if (!ok) return json(res, 404, { error: "That invite has already been used or doesn't exist" });
      const m = await newMember(inv.kind, inv.from || null, now);
      let entry = null;
      if (inv.kind === "waitlist" && inv.entry) entry = await store.get(`entry/${inv.entry}`);
      await store.bump("line", (cur) => {
        const l = cur || emptyLine();
        l.members += 1;
        if (inv.kind === "waitlist" && inv.entry) delete l.rows[inv.entry];
        return l;
      });
      // in: the waitlist record (email, name, door) is no longer needed, so it goes
      if (entry) {
        await store.delete(`ref/${entry.code}`);
        if (entry.keyHash) await store.delete(`key/${entry.keyHash}`);
        await store.delete(emailKey(entry.email));
        await store.delete(`entry/${inv.entry}`);
      }
      return json(res, 200, { ok: true, ...m });
    }

    if (kind === "claim") {
      if (Object.keys(body).length) return json(res, 400, { error: "Invalid waitlist request" });
      if (!(await allowed(req, "claim", LIMIT.claimsPerDay, now))) return json(res, 429, { error: "Slow down" });
      let ok = false;
      const cap = foundingCap(), claims = claimCap();
      await store.bump("line", (cur) => {
        const l = cur || emptyLine();
        if (l.claims >= claims || l.members >= cap) { ok = false; return l; }
        ok = true; l.claims += 1; l.members += 1;
        return l;
      });
      if (!ok) return json(res, 409, { error: "Beta member invites are all given out", full: true });
      return json(res, 200, { ok: true, ...(await newMember("beta", null, now)) });
    }

    if (kind === "invites" || kind === "member-leave") {
      const me = await memberFrom(req);
      if (!me) return json(res, 401, { error: "Not a member" });
      if (kind === "member-leave") {
        for (const c of me.codes || []) { const inv = await store.get(`invite/${c}`); if (inv && !inv.used) await store.delete(`invite/${c}`); }
        await store.delete(`member/${me.id}`);
        return json(res, 200, { ok: true });
      }
      const l = q.get("lang");
      const invites = [];
      for (const c of me.codes || []) {
        const inv = await store.get(`invite/${c}`);
        if (!inv) continue;
        invites.push({ code: c, link: inviteLink(base, c, l), used: inv.used >= inv.uses, nick: inv.joined?.[0]?.nick || null });
      }
      return json(res, 200, { memberId: me.id, invites, left: invites.filter((x) => !x.used).length });
    }

    // ---------- admin ----------
    if (kind === "admin-stats") {
      const line = await readLine();
      const waiting = {}, invited = {};
      for (const d of DOORS) { waiting[d] = 0; invited[d] = 0; }
      for (const [d, , , st] of Object.values(line.rows)) (st === "i" ? invited : waiting)[d] = ((st === "i" ? invited : waiting)[d] || 0) + 1;
      return json(res, 200, { inviteOnly: inviteOnly(), foundingCap: foundingCap(), members: line.members, betaClaims: line.claims, waiting, invited, joinedTotal: line.seq });
    }

    if (kind === "admin-release") {
      if (!onlyKeys(body, ["n", "door", "lang"]) || !Number.isInteger(body.n) || body.n < 1 || body.n > 1000) return json(res, 400, { error: "n must be a whole number from 1 to 1000" });
      if (body.door !== undefined && body.door !== null && !DOORS.includes(body.door)) return json(res, 400, { error: "Unknown door" });
      const line = await readLine();
      const outstanding = Object.values(line.rows).filter((r) => r[3] === "i").length;
      const room = Math.max(0, foundingCap() - line.members - outstanding);
      const ids = nextInLine(line, Math.min(body.n, room), body.door || null);
      const list = [];
      for (const id of ids) {
        const e = await store.get(`entry/${id}`);
        if (!e) continue;
        const [code] = await makeCodes(1, { kind: "waitlist", entry: id, uses: 1, created: now.toISOString() });
        await store.set(`entry/${id}`, { ...e, inviteCode: code, invitedAt: now.toISOString() });
        list.push({ id, email: e.email, name: e.name, door: e.door, code, link: inviteLink(base, code, body.lang || e.lang), lang: e.lang });
      }
      await store.bump("line", (cur) => {
        const l = cur || emptyLine();
        for (const x of list) if (l.rows[x.id]) l.rows[x.id][3] = "i";
        return l;
      });
      const invitedList = list.map(({ id: _id, ...x }) => x);
      const delivery = await deliverInvites(invitedList);
      return json(res, 200, { released: invitedList.length, capped: ids.length < body.n, invited: invitedList, delivery });
    }

    if (kind === "admin-codes") {
      if (!onlyKeys(body, ["n", "uses", "label", "lang"]) || !Number.isInteger(body.n) || body.n < 1 || body.n > 100) return json(res, 400, { error: "n must be a whole number from 1 to 100" });
      const uses = body.uses === undefined ? 1 : body.uses;
      if (!Number.isInteger(uses) || uses < 1 || uses > 500) return json(res, 400, { error: "uses must be from 1 to 500" });
      const label = body.label === undefined ? null : clean(body.label, LABEL_MAX);
      const codes = await makeCodes(body.n, { kind: "admin", label, uses, created: now.toISOString() });
      return json(res, 200, { codes: codes.map((code) => ({ code, uses, label, link: inviteLink(base, code, body.lang) })) });
    }

    if (kind === "admin-grant") {
      if (!onlyKeys(body, ["memberId", "n"])) return json(res, 400, { error: "Invalid waitlist request" });
      const codes = await grantInvites(body.memberId, body.n, { now });
      if (!codes) return json(res, 404, { error: "No such member (or n is not 1 to 100)" });
      return json(res, 200, { granted: codes.length, codes });
    }

    if (kind === "admin-remove") {
      if (!onlyKeys(body, ["email"])) return json(res, 400, { error: "Invalid waitlist request" });
      const email = normEmail(body.email);
      if (!validEmail(email)) return json(res, 400, { error: "Check the email address" });
      const id = (await store.get(emailKey(email)))?.id;
      const e = id ? await store.get(`entry/${id}`) : null;
      if (!e) { if (id) await store.delete(emailKey(email)); return json(res, 200, { ok: true, removed: false }); }
      await removeEntry(id, e);
      return json(res, 200, { ok: true, removed: true });
    }
  } catch {
    // Never log: bodies carry email addresses, and keys and tokens ride in headers.
    return json(res, 503, { error: "The waitlist is unavailable right now" });
  }
  return json(res, 400, { error: "Unknown waitlist request" });
}
