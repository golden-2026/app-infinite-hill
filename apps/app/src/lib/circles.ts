// Circles: a teacher or a house of worship brings their people in as a group (api/circles.js). People sign in with
// the anonymous friend identity (lib/friends: a random id + a secret token on this phone; no email, no account).
// The phone only ever sends: the circle's name, door, leader name and note (when creating), a nickname if the person
// chooses to appear by one, whether it's a family membership, and "walked on <date>" after a lesson. Never a lesson,
// an answer, a journal line, a mood or a Guide question. Children never join or create circles: the phone is the
// parent's, so a parent can join on the family's behalf (one membership; the family's walks count as walked).
// Offline or with no server (static builds), the circles card says so and the app works as before.
import { useSyncExternalStore } from "react";
import { readJSON, writeJSON, remove } from "./storage";
import { ensureJoined, friendsState } from "./friends";

export const CIRCLES_KEY = "ih:circles";
const TIMEOUT_MS = 8_000;
export const NOTE_MAX = 280;
export const NAME_MAX = 48;
export const LEADER_MAX = 32;
export const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
/** Under this many people, a circle is "just getting started" (no small numbers to feel lonely about). */
export const SMALL = 3;

export type CircleMember = { nick: string; family: boolean; walked: boolean; me: boolean };
export type Circle = {
  id: string; code: string; name: string; door: string; leaderName: string; welcome: string | null; isLeader: boolean;
  note: string | null; noteOn: string | null; count: number; walkedToday: number;
  members: CircleMember[]; me: { nick: string | null; family: boolean };
};
export type Peek = { name: string; door: string; leaderName: string; welcome: string | null; count: number };
type Saved = { circles: Circle[]; fetchedAt: string | null; reachable: boolean | null; walked: string | null; pending: string | null };
const empty = (): Saved => ({ circles: [], fetchedAt: null, reachable: null, walked: null, pending: null });

let state: Saved = { ...empty(), ...readJSON<Partial<Saved>>(CIRCLES_KEY, {}) };
const listeners = new Set<() => void>();
function set(patch: Partial<Saved>) {
  state = { ...state, ...patch };
  writeJSON(CIRCLES_KEY, state);
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const get = () => state;
export const useCircles = () => useSyncExternalStore(subscribe, get, get);
export const circlesState = get;

/** "k7m 2qx", "K7M-2QX" → "K7M2QX". */
export const normalizeCode = (s: string) => String(s || "").toUpperCase().replace(/[\s-]/g, "");
/** "K7M2QX" → "K7M-2QX", easier to read out loud. */
export const prettyCode = (c: string) => (c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : c);
export const cleanLine = (s: string, max: number) => s.replace(/[\u0000-\u001F\u007F<>{}]/g, "").replace(/\s+/g, " ").trim().slice(0, max).trim();

/** The share link: opens the join screen (during onboarding too). */
export function circleLink(code: string, lang?: string) {
  const origin = (globalThis as any).location?.origin || "https://infinitehill.app";
  return `${origin}/circle?c=${code}${lang === "es" ? "&lang=es" : ""}`;
}

async function api(kind: string, { method = "POST", body, query = "", auth = true }: { method?: string; body?: unknown; query?: string; auth?: boolean } = {}): Promise<any | null> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const headers: Record<string, string> = {};
    if (method === "POST") headers["Content-Type"] = "application/json";
    const f = friendsState();
    if (auth && f.friendId && f.token) headers.Authorization = `Friend ${f.friendId}:${f.token}`;
    const res = await fetch(`/api/circles?kind=${kind}${query}`, { method, headers, ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}), ...(controller ? { signal: controller.signal } : {}) });
    // no functions deployed: the static host answers with the app's HTML, and .json() throws
    const json = await res.json().catch(() => null);
    return res.ok ? json : json ? { error: json.error, status: res.status } : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type Fail = "offline" | "missing" | "full" | "many" | "slow" | "bad";
const failOf = (r: any): Fail => (!r ? "offline" : r.status === 404 ? "missing" : r.status === 409 ? (/full/i.test(r.error || "") ? "full" : "many") : r.status === 429 ? "slow" : r.status === 400 ? "bad" : "offline");
const upsert = (c: Circle) => set({ circles: [...state.circles.filter((x) => x.id !== c.id), c], reachable: true });

/** The join preview behind a link or a code: name, door, leader, how many people. */
export async function peekCircle(code: string): Promise<{ ok: true; circle: Peek } | { ok: false; why: Fail }> {
  const c = normalizeCode(code);
  if (!CODE_RE.test(c)) return { ok: false, why: "missing" };
  const r = await api("peek", { method: "GET", query: `&code=${c}`, auth: false });
  return r?.name ? { ok: true, circle: r } : { ok: false, why: failOf(r) };
}

export async function createCircle(o: { name: string; door: string; leaderName: string; welcome?: string }, date: string): Promise<{ ok: true; circle: Circle } | { ok: false; why: Fail }> {
  if (!(await ensureJoined())) return { ok: false, why: "offline" };
  const r = await api("create", { body: { name: o.name, door: o.door, leaderName: o.leaderName, ...(o.welcome ? { welcome: o.welcome } : {}) }, query: `&date=${date}` });
  if (r?.circle) { upsert(r.circle); return { ok: true, circle: r.circle }; }
  return { ok: false, why: failOf(r) };
}

export async function joinCircle(code: string, o: { nick?: string | null; family?: boolean }, date: string): Promise<{ ok: true; circle: Circle } | { ok: false; why: Fail }> {
  const c = normalizeCode(code);
  if (!CODE_RE.test(c)) return { ok: false, why: "missing" };
  if (!(await ensureJoined())) return { ok: false, why: "offline" };
  const r = await api("join", { body: { code: c, ...(o.nick ? { nick: o.nick } : {}), ...(o.family ? { family: true } : {}) }, query: `&date=${date}` });
  if (r?.circle) { upsert(r.circle); return { ok: true, circle: r.circle }; }
  return { ok: false, why: failOf(r) };
}

export async function refreshCircles(date: string) {
  const f = friendsState();
  if (!f.friendId || !f.token) { if (state.circles.length) set({ circles: [] }); return; }
  const r = await api("mine", { method: "GET", query: `&date=${date}` });
  if (Array.isArray(r?.circles)) set({ circles: r.circles, fetchedAt: new Date().toISOString(), reachable: true });
  else set({ reachable: false });
}

/** "walked today": once a day, only the date, only when this phone is in a circle. */
export async function markWalked(date: string) {
  const mark = `${date}:${state.circles.map((c) => c.id).sort().join(",")}`; // again when a circle is joined later that day
  if (!state.circles.length || state.walked === mark) return;
  const r = await api("walked", { body: { date } });
  if (r?.ok) { set({ walked: mark }); await refreshCircles(date); }
}

export async function showAs(id: string, nick: string | null) {
  const r = await api("show", { body: { circleId: id, nick } });
  if (r?.ok) set({ circles: state.circles.map((c) => (c.id === id ? { ...c, me: { ...c.me, nick } } : c)) });
  return !!r?.ok;
}

export async function postNote(id: string, note: string, date: string) {
  const r = await api("note", { body: { circleId: id, note }, query: `&date=${date}` });
  if (r?.ok) set({ circles: state.circles.map((c) => (c.id === id ? { ...c, note: note.trim() || null, noteOn: note.trim() ? date : null } : c)) });
  return !!r?.ok;
}

export async function leaveCircle(id: string) {
  const r = await api("leave", { body: { circleId: id } });
  if (r?.ok) set({ circles: state.circles.filter((c) => c.id !== id) });
  return !!r?.ok;
}

/** Leave every circle (when someone leaves friends altogether). */
export async function leaveAllCircles() {
  const f = friendsState();
  const r = f.friendId && f.token ? await api("forget", { body: {} }) : { ok: true };
  if (r?.ok) { remove(CIRCLES_KEY); state = empty(); listeners.forEach((l) => l()); }
  return !!r?.ok;
}

/** A join that couldn't reach the server (offline during sign-up): kept here and tried again later (CirclesSync). */
export const keepPending = (code: string) => set({ pending: normalizeCode(code) });
export async function joinPending(date: string) {
  const code = state.pending;
  if (!code) return;
  const r = await joinCircle(code, {}, date);
  if (r.ok || r.why !== "offline") set({ pending: null }); // joined, or the code is gone: either way, stop trying
}
