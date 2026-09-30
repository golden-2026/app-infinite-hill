// "Just learn" (profile.answers.practiceMode = "learn"): someone here to learn about a tradition is never asked to
// breathe, sit, or pray. The breath and the sit steps come out of the lesson, and the lesson's practice beats (the
// manuscript's practice script, the outline's "Try this: …", or the generated fallback) become one "how it's done"
// beat that describes what people who keep the path do. The manuscript text itself is never rewritten: in this mode
// it simply isn't shown. Nothing here changes scoring: the breath and the sit were never graded.

type Step = { type: string; id: number; seg?: string; text?: string; head?: string | null; [k: string]: unknown };

export const HOW_ITS_DONE = "how it's done";

/** The outline's "Try this: …" line, said as what practitioners do, never as an instruction to the person. */
export function howItsDoneLine(practiceVoice: string): string {
  const m = /^\s*Try this:\s*(.+?)[.!]?\s*$/i.exec(practiceVoice);
  if (m) return `Here's a practice people on this path keep: “${m[1]}.” You don't have to do it. It's here so you know how it's done.`;
  return "This is where the lesson usually pauses for a minute of practice. People who keep this path make small practices like this part of their day. You're here to learn, so there's nothing to do. Just know that's how it's done.";
}

/**
 * The lesson's steps for someone who is here to learn: no breath, no sit, and the practice told, not asked.
 * `told`: a full script's own "how it's done" line (script.howItsDone), used in place of the generic one when given.
 */
export function learnSteps<T extends Step>(steps: T[], told?: string | null): T[] {
  const practice = steps.filter((s) => s.type === "beat" && /^the practice/.test(String(s.seg || "")));
  const voice = practice.map((s) => String(s.text || "")).join(" ");
  const out: T[] = [];
  let done = false;
  for (const s of steps) {
    if (s.type === "breath" || s.type === "sit") continue;
    if (practice.includes(s)) {
      if (done) continue;
      done = true;
      out.push({ ...s, seg: HOW_ITS_DONE, head: null, text: told && told.trim() ? told.trim() : howItsDoneLine(voice) });
      continue;
    }
    out.push(s);
  }
  return out;
}
