import type { Stance } from "@/lib/onboard";

// ?why= on /welcome/you, from the website's "which one sounds like you?" picker (apps/app/public/site.html).
// A "what brings you" key (BELIEF_QUESTIONS "why" in content/intake.ts) is kept on the pending profile and that
// question is then skipped on the door. "spiritual" is a first-step answer instead (STANCE_Q): it preselects the
// stance and skips that question. Anything else is ignored.
export const WHY_KEYS = ["own", "roots", "god", "partner", "kids", "calm", "hard", "curious"] as const;
export type WhyKey = (typeof WHY_KEYS)[number];

export function whyParam(raw: unknown): { why: WhyKey | null; stance: Stance | null } {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const k = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (k === "spiritual") return { why: null, stance: "spiritual" };
  return { why: (WHY_KEYS as readonly string[]).includes(k) ? (k as WhyKey) : null, stance: null };
}
