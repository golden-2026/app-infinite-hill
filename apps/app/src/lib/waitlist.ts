// The invite-only launch on the phone: the switch (read from the server), the waitlist, entering with an invite code,
// and a member's own invites. Everything here talks to api/waitlist.js. While the server's switch is off (the default),
// or there is no server (static builds), the gate is "open" and the app works exactly as before.
//
// What this phone keeps under "ih:invite": the last answer about the switch; if it joined the waitlist, its private
// key and door (to show its place again); if it was let in, a member id and secret token (to show its own invites),
// and "admitted". What it sends: to join, the email, door, first name if given, a friend's code if it came through
// one, and the language; to come in, the code and (only if the person chooses) a nickname for whoever invited them.
// Never a lesson, an answer, a journal line, a mood or a Guide question.
import { useEffect, useSyncExternalStore } from "react";
import { getLang } from "@/i18n";
import { readJSON, writeJSON, remove } from "./storage";
import { cleanCode, gate, readStatus, type Gate, type GateStatus } from "./invite-gate";

export const INVITE_KEY = "ih:invite";
const TIMEOUT_MS = 8_000;

export type Place = {
  state: "waiting" | "invited"; door: string; position?: number; waiting?: number; refs?: number; code?: string; link?: string;
  inviteCode?: string; inviteLink?: string; rule?: { places: number; cap: number };
};
export type MyInvite = { code: string; link: string; used: boolean; nick: string | null };
type Saved = {
  status: GateStatus;
  wait: { key: string; door: string } | null;
  member: { memberId: string; token: string } | null;
  admitted: boolean;
  ref: string | null;
};
const empty = (): Saved => ({ status: { on: null, cap: null, full: false }, wait: null, member: null, admitted: false, ref: null });

let state: Saved = { ...empty(), ...readJSON<Partial<Saved>>(INVITE_KEY, {}) };
const listeners = new Set<() => void>();
function set(patch: Partial<Saved>) {
  state = { ...state, ...patch };
  writeJSON(INVITE_KEY, state);
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const get = () => state;
export const useInvite = () => useSyncExternalStore(subscribe, get, get);
export const inviteState = get;
/** The member's id, for server code that grants more invites (api/waitlist.js grantInvites). Null if not a member. */
export const memberId = () => state.member?.memberId ?? null;

async function api(kind: string, { method = "POST", body, query = "", auth }: { method?: string; body?: unknown; query?: string; auth?: string } = {}): Promise<{ status: number; json: any } | null> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const headers: Record<string, string> = {};
    if (method === "POST") headers["Content-Type"] = "application/json";
    if (auth) headers.Authorization = auth;
    const res = await fetch(`/api/waitlist?kind=${kind}${query}`, {
      method, headers, credentials: "omit", referrerPolicy: "no-referrer",
      ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}), ...(controller ? { signal: controller.signal } : {}),
    } as RequestInit);
    const json = await res.json().catch(() => null); // no function deployed: the static host answers with HTML
    return { status: res.status, json };
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---------- the switch ----------
let asking: Promise<GateStatus> | null = null;
/** Ask the server whether invite-only is on (once at a time). Unreachable: keeps what was known (or off, if never read). */
export function refreshGate(): Promise<GateStatus> {
  if (!asking) {
    asking = api("status", { method: "GET" }).then((r) => {
      const next = readStatus(state.status, r ? { ok: r.status === 200, json: r.json } : null);
      set({ status: next });
      return next;
    }).finally(() => { asking = null; });
  }
  return asking;
}
/** The gate for a new person: "open", "asking" (first read still on its way) or "waitlist". Re-reads on mount. */
export function useGate(onboarded: boolean): Gate {
  const s = useInvite();
  useEffect(() => { refreshGate(); }, []);
  return gate({ status: s.status, onboarded, admitted: s.admitted });
}

/** A friend's waitlist code from a share link (?ref=), kept until this phone joins. */
export function rememberRef(v: unknown) { const c = cleanCode(v); if (c) set({ ref: c }); }

// ---------- the waitlist ----------
export type JoinResult = { ok: true; place: Place } | { ok: false; reason: "email" | "door" | "already" | "slow" | "offline" };
export async function joinWaitlist(o: { email: string; door: string; name?: string }): Promise<JoinResult> {
  const body: Record<string, string> = { email: o.email.trim(), door: o.door, lang: getLang() };
  if (o.name?.trim()) body.name = o.name.trim();
  if (state.ref) body.ref = state.ref;
  const r = await api("join", { body });
  if (r?.status === 200 && r.json?.key) {
    set({ wait: { key: r.json.key, door: r.json.door }, ref: null });
    return { ok: true, place: { state: "waiting", ...r.json } };
  }
  if (r?.status === 409) return { ok: false, reason: "already" };
  if (r?.status === 429) return { ok: false, reason: "slow" };
  if (r?.status === 400) return { ok: false, reason: r.json?.field === "door" ? "door" : "email" };
  return { ok: false, reason: "offline" };
}

/** Where this phone stands now. null: offline. "gone": the server doesn't know the key any more. */
export async function myPlace(): Promise<Place | "gone" | null> {
  if (!state.wait) return "gone";
  const r = await api("me", { method: "GET", auth: `Waitlist ${state.wait.key}` });
  if (r?.status === 200 && r.json?.state) return r.json as Place;
  if (r?.status === 401) { set({ wait: null }); return "gone"; }
  return null;
}

export async function leaveWaitlist(): Promise<boolean> {
  if (!state.wait) return true;
  const r = await api("leave", { auth: `Waitlist ${state.wait.key}`, body: {} });
  if (r?.status === 200 || r?.status === 401) { set({ wait: null }); return true; }
  return false;
}

// ---------- coming in with a code ----------
export async function checkCode(code: string): Promise<"ok" | "used" | "bad" | "offline"> {
  const c = cleanCode(code);
  if (!c) return "bad";
  const r = await api("check", { method: "GET", query: `&code=${c}` });
  if (r?.status === 200 && r.json?.ok) return "ok";
  if (r?.status === 404) return "used";
  if (r?.status === 400) return "bad";
  return "offline";
}

/** Use the code: this phone is let in and gets its own invites to give. */
export async function redeemCode(code: string, nick: string | null): Promise<"ok" | "used" | "bad" | "full" | "slow" | "offline"> {
  const c = cleanCode(code);
  if (!c) return "bad";
  const n = nick?.trim() ? nick.trim().slice(0, 24) : null;
  const r = await api("redeem", { body: { code: c, ...(n ? { nick: n, showNick: true } : {}) } });
  if (r?.status === 200 && r.json?.memberId && r.json?.token) {
    set({ member: { memberId: r.json.memberId, token: r.json.token }, admitted: true, wait: null });
    return "ok";
  }
  if (r?.status === 404) return "used";
  if (r?.status === 409) return "full";
  if (r?.status === 429) return "slow";
  if (r?.status === 400) return "bad";
  return "offline";
}

// ---------- a member's own invites ----------
/** Someone who was walking before the switch: a member identity of their own (the server caps how many). */
export async function claimInvites(): Promise<"ok" | "full" | "slow" | "offline"> {
  const r = await api("claim", { body: {} });
  if (r?.status === 200 && r.json?.memberId && r.json?.token) { set({ member: { memberId: r.json.memberId, token: r.json.token }, admitted: true }); return "ok"; }
  if (r?.status === 409) return "full";
  if (r?.status === 429) return "slow";
  return "offline";
}

export async function myInvites(): Promise<{ invites: MyInvite[]; left: number } | null> {
  if (!state.member) return null;
  const r = await api("invites", { method: "GET", query: getLang() === "es" ? "&lang=es" : "", auth: `Member ${state.member.memberId}:${state.member.token}` });
  if (r?.status === 200 && Array.isArray(r.json?.invites)) return { invites: r.json.invites, left: r.json.left };
  if (r?.status === 401) set({ member: null }); // the server forgot this member: the card offers to claim again
  return null;
}

/**
 * "Delete everything": the member identity and its unused invites go from the server and this phone, and so does a
 * waitlist place. Only "admitted" stays (no identity in it), so a person who was let in isn't sent back to the line.
 */
export async function forgetInvites() {
  if (state.member) await api("member-leave", { auth: `Member ${state.member.memberId}:${state.member.token}`, body: {} });
  if (state.wait) await api("leave", { auth: `Waitlist ${state.wait.key}`, body: {} });
  const admitted = state.admitted, status = state.status;
  remove(INVITE_KEY);
  state = { ...empty(), status, admitted };
  if (admitted) writeJSON(INVITE_KEY, state);
  listeners.forEach((l) => l());
}
