// Friends: friend streaks and the friends-only weekly board, through the small server piece in api/friends.js.
// The phone joins anonymously (a random friend id + a secret token kept here under "ih:friends"; no email, no account)
// and only ever sends: today's date, whether today's lesson is done, the streak number, golden or not, this week's
// light, the nickname the person chose, and whether they joined the board. Never the door, answers, journal or mood.
// Offline or with no server (static builds), everything here quietly does nothing and the app works as before;
// friends just show when they were last seen.
import { useSyncExternalStore } from "react";
import { addDays, type Sit } from "@ih/domain";
import { readJSON, writeJSON, remove } from "./storage";
import { forgetFriendWalkers } from "./walkers";

export const FRIENDS_KEY = "ih:friends";
const TIMEOUT_MS = 8_000;
export const FRIEND_MILESTONES = [7, 30, 100];

export type Friend = {
  id: string; nick: string; streak: number; doneToday: boolean; golden: boolean; together: number;
  onBoard: boolean; weekLight: number | null; lastSeen: string | null; faded: boolean;
};
type Saved = {
  friendId: string | null; token: string | null; nick: string | null; board: boolean;
  friends: Friend[]; fetchedAt: string | null; reachable: boolean | null;
};
const empty = (): Saved => ({ friendId: null, token: null, nick: null, board: false, friends: [], fetchedAt: null, reachable: null });

let state: Saved = { ...empty(), ...readJSON<Partial<Saved>>(FRIENDS_KEY, {}) };
const listeners = new Set<() => void>();
function set(patch: Partial<Saved>) {
  state = { ...state, ...patch };
  writeJSON(FRIENDS_KEY, state);
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const get = () => state;
export const useFriends = () => useSyncExternalStore(subscribe, get, get);
export const friendsState = get;

const NICK_MAX = 24;
export const cleanNick = (s: string) => s.replace(/[\u0000-\u001F\u007F<>{}]/g, "").replace(/\s+/g, " ").trim().slice(0, NICK_MAX).trim();

async function api(kind: string, { method = "POST", body, query = "" }: { method?: string; body?: unknown; query?: string } = {}): Promise<any | null> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const headers: Record<string, string> = {};
    if (method === "POST") headers["Content-Type"] = "application/json";
    if (state.friendId && state.token && kind !== "join") headers.Authorization = `Friend ${state.friendId}:${state.token}`;
    const res = await fetch(`/api/friends?kind=${kind}${query}`, { method, headers, ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}), ...(controller ? { signal: controller.signal } : {}) });
    // no functions deployed: the static host answers with the app's HTML, and .json() throws
    const json = await res.json().catch(() => null);
    if (res.status === 401 && kind !== "join") set({ friendId: null, token: null }); // the server forgot us: join again next time
    return res.ok ? json : json ? { error: json.error, status: res.status } : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** An anonymous friend identity, made once. Returns false when the server can't be reached. */
export async function ensureJoined(): Promise<boolean> {
  if (state.friendId && state.token) return true;
  const r = await api("join", { body: {} });
  if (!r?.friendId || !r?.token) { set({ reachable: false }); return false; }
  set({ friendId: r.friendId, token: r.token, reachable: true });
  return true;
}

/** A single-use invite code for a lantern link (about 7 days), or null offline. */
export async function makeInvite(): Promise<string | null> {
  if (!(await ensureJoined())) return null;
  const r = await api("invite", { body: {} });
  return typeof r?.code === "string" ? r.code : null;
}

export async function acceptInvite(code: string): Promise<{ ok: boolean; nick?: string; message?: string }> {
  if (!/^[a-z2-9]{10}$/.test(code)) return { ok: false, message: "that invite link looks incomplete." };
  if (!(await ensureJoined())) return { ok: false, message: "couldn't reach friends right now. try again in a bit." };
  const r = await api("accept", { body: { code } });
  if (r?.ok) return { ok: true, nick: r.friend?.nick };
  return { ok: false, message: r?.status === 404 ? "that invite has expired. ask them for a new lantern." : r?.status === 409 ? "a friend list is full (30 friends)." : r?.status === 400 ? "that's your own lantern." : "couldn't reach friends right now. try again in a bit." };
}

export function setNick(nick: string) { const n = cleanNick(nick); if (n) set({ nick: n }); }
export function setBoard(on: boolean) { set({ board: on }); }

/** This week's light (the board's score): 10 for each lesson finished since Monday, 5 more for each clean run. */
export function weekLight(sits: Pick<Sit, "date" | "kidId">[], runs: { date: string; acc: number }[] | undefined, today: string, kidId: string | null = null): number {
  const monday = addDays(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7));
  const lessons = sits.filter((s) => (s.kidId || null) === kidId && s.date >= monday && s.date <= today).length;
  const clean = kidId ? 0 : (runs || []).filter((r) => r.date >= monday && r.date <= today && r.acc >= 1).length;
  return lessons * 10 + clean * 5;
}

/** Tell friends how today stands, then refresh the list. Only when this phone has friends or an identity. */
export async function checkin(o: { date: string; doneToday: boolean; streak: number; golden: boolean; weekLight: number }) {
  if (!state.friendId || !state.token) return false;
  const r = await api("checkin", { body: { ...o, nick: state.nick ?? undefined, board: state.board } });
  return !!r?.ok;
}

export async function refreshFriends(date: string) {
  if (!state.friendId || !state.token) return;
  const r = await api("friends", { method: "GET", query: `&date=${date}` });
  if (Array.isArray(r?.friends)) set({ friends: r.friends, fetchedAt: new Date().toISOString(), reachable: true });
  else set({ reachable: false });
}

export async function unfriend(id: string) {
  const r = await api("remove", { body: { friendId: id } });
  if (r?.ok) set({ friends: state.friends.filter((f) => f.id !== id) });
  return !!r?.ok;
}

/** Delete me from friends everywhere (the server copy and this phone's). */
export async function leaveFriends() {
  const r = state.token ? await api("leave", { body: {} }) : { ok: true };
  if (r?.ok) {
    // friends who reached "walking with" through a lantern invite go with them (other lanterns stay)
    forgetFriendWalkers(state.friends.map((f) => f.nick));
    remove(FRIENDS_KEY); state = empty(); listeners.forEach((l) => l());
  }
  return !!r?.ok;
}

/** "12 days together", "last seen 3 days ago". */
export const togetherWords = (n: number) => `${n} ${n === 1 ? "day" : "days"} together`;
export function lastSeenWords(date: string | null, today: string) {
  if (!date) return "not seen yet";
  const d = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86_400_000);
  return d <= 0 ? "here today" : d === 1 ? "last seen yesterday" : `last seen ${d} days ago`;
}
