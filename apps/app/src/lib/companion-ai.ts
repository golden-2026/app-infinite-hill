// The companion's AI half (steps 2 and 3): the phone asks the server to shape a day, reflect on a week, or talk.
// CONTRACT shared by the on-device companion (lib/companion/*) and the server (api/companion.js).
// Privacy: the phone sends only what the person can see in "what the companion knows" (short facts they can edit or
// delete), fixed-value profile fields, and today's context. Never raw journal text unless they tap "share this entry".
// Every function returns null when the server or its AI key isn't available; callers then use the on-device version.

export type CompanionProfile = { door: string; depth?: string; openness?: string; commitment?: string; reason?: string; level?: number };
export type CompanionContext = {
  door: string; day: number; hour: number;
  lessonTitle?: string; carry?: string;
  lastFeel?: "slow" | "right" | "hard" | null;
  mood?: string | null; // what they tapped today ("tired", "anxious", "grateful"...), if anything
};
/** A practice the phone offers as a candidate; the server may only choose among these ids. */
export type PracticeCandidate = { id: string; title: string; minutes: number; kind: string; door?: string | null };

export type ShapeRequest = { profile: CompanionProfile; memory: string[]; context: CompanionContext; candidates: PracticeCandidate[] };
/** The shaped day: which practice, whether games step back, and one short line spoken to the person. */
export type ShapeReply = { practiceId: string; quiet: boolean; note: string };

export type ReflectRequest = { profile: CompanionProfile; memory: string[]; week: { kept: string[]; practices: string[]; days: number; feels: string[]; shared?: string[] } };
export type ReflectReply = { text: string; suggestion?: string };

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatRequest = { profile: CompanionProfile; memory: string[]; context: CompanionContext; messages: ChatMessage[] };
/** A chat answer, plus facts the companion proposes remembering (the person approves each before it's kept). */
export type ChatReply = { text: string; remember?: string[]; limited?: boolean };

// The server gives up on the AI after ~9 s (Netlify's limit is 10); past that the phone stops waiting and falls back.
const TIMEOUT_MS = 12_000;
async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const res = await fetch(url, { ...init, ...(controller ? { signal: controller.signal } : {}) });
    // Without the functions deployed, the static host answers with the app's HTML; res.json() then throws → null.
    // 429 = today's AI limit is used up (for this person or the whole site); the caller says so kindly.
    if (res.status === 429) return { limited: true };
    return res.ok ? await res.json() : null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function call<T>(kind: "shape" | "reflect" | "chat", body: unknown): Promise<T | null> {
  try {
    const json = await fetchJson(`/api/companion?kind=${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    // Over the daily limit: a chat says so; shaping and reflecting quietly use the on-device version.
    if (json?.limited) return kind === "chat" ? ({ text: "", limited: true } as T) : null;
    return json && typeof json === "object" && !Array.isArray(json) && !json.error ? (json as T) : null;
  } catch {
    return null;
  }
}

let availability: Promise<boolean> | null = null;
/** Whether the server's AI is on (checked once per session). */
export function companionAvailable(): Promise<boolean> {
  availability ??= fetchJson("/api/companion?kind=status").then((j) => j?.on === true).catch(() => false);
  return availability;
}
export const companionShape = (req: ShapeRequest) => call<ShapeReply>("shape", req);
export const companionReflect = (req: ReflectRequest) => call<ReflectReply>("reflect", req);
export const companionChat = (req: ChatRequest) => call<ChatReply>("chat", req);
