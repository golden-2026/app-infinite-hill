// The invite-only gate, decided (pure, import-free so plain Node can test it). The switch lives on the server
// (INVITE_ONLY, read by GET /api/waitlist?kind=status); the phone only remembers the last answer. See api/waitlist.js.
//
//   open      the app works exactly as before (switch off, no server, already walking, or let in by an invite)
//   asking    the switch has never been read on this phone and the answer hasn't come back yet: show nothing new
//   waitlist  the switch is on and this phone hasn't been let in: the waitlist screen instead of onboarding

export type Gate = "open" | "asking" | "waitlist";
/** What the phone remembers about the switch. on: null = never read yet. */
export type GateStatus = { on: boolean | null; cap: number | null; full: boolean };

export const INVITE_CODE_RE = /^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/;
export const REF_CODE_RE = INVITE_CODE_RE;

/** "AbCd-EfGh " → "abcdefgh", or null when it can't be a code. */
export function cleanCode(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const c = v.trim().toLowerCase().replace(/[\s-]/g, "");
  return INVITE_CODE_RE.test(c) ? c : null;
}

/**
 * Where a new person goes. Already onboarded (walking before the switch, or let in earlier): always open. Let in by an
 * invite (admitted): open. Otherwise it follows the switch.
 */
export function gate(o: { status: GateStatus; onboarded: boolean; admitted: boolean }): Gate {
  if (o.onboarded || o.admitted) return "open";
  if (o.status.on === null) return "asking";
  return o.status.on ? "waitlist" : "open";
}

/**
 * Read the server's answer. Anything but a clear { inviteOnly: true } means off: a static host without the function
 * answers with the app's HTML, an old server doesn't know the route. A failed request (offline) keeps what was known.
 */
export function readStatus(prev: GateStatus, res: { ok: boolean; json: unknown } | null): GateStatus {
  if (!res) return prev.on === null ? { on: false, cap: null, full: false } : prev;
  const j = res.json as { inviteOnly?: unknown; foundingCap?: unknown; full?: unknown } | null;
  if (!res.ok || !j || j.inviteOnly !== true) return { on: false, cap: null, full: false };
  const cap = typeof j.foundingCap === "number" && Number.isInteger(j.foundingCap) && j.foundingCap > 0 ? j.foundingCap : null;
  return { on: true, cap, full: j.full === true };
}

/** The members' invites card shows only while the switch is on, and only to someone already in. */
export const showInvitesCard = (status: GateStatus, onboarded: boolean) => status.on === true && onboarded;
