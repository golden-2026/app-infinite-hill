// "sources" at the end of a lesson: the day's references, one line each, from the script's `sources`
// (docs/curriculum/SCRIPT_GUIDE.md §8; build-lessons keeps ref, work, translation and quoted as a yes/no).
// Kept free of React so it can be tested in plain Node. Outline-only days have no script and so no lines.

export type LessonSource = { ref?: string | null; work?: string | null; translation?: string | null; quoted?: boolean | string | null };
export type SourceWords = { paraphrased: string; original: string };

const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");

/** How the day used the text: the public-domain translation it quoted, "original text", or "paraphrased". */
export function sourceUse(s: LessonSource, words: SourceWords): string {
  const tr = clean(s.translation);
  if (!s.quoted || !tr) return words.paraphrased;
  // "public domain (original)", "public domain (original) Latin": the text in its own language, quoted as written
  if (/^public domain \(original\)/i.test(tr)) return words.original;
  return tr;
}

/** One reference as a line: "Psalm 23:1 · The Bible · KJV (1769)", "Qur'an 4:103 · The Qur'an · paraphrased". */
export function sourceLine(s: LessonSource, words: SourceWords): string {
  const ref = clean(s.ref);
  const work = clean(s.work);
  const head = ref && work && ref.toLowerCase() === work.toLowerCase() ? [ref] : [ref, work].filter(Boolean);
  return [...head, sourceUse(s, words)].join(" · ");
}

/** The day's lines, in the script's order, without repeats. None (an outline-only day, no sources) → []. */
export function sourceLines(sources: unknown, words: SourceWords): string[] {
  if (!Array.isArray(sources)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sources) {
    if (!s || typeof s !== "object" || (!clean((s as LessonSource).ref) && !clean((s as LessonSource).work))) continue;
    const line = sourceLine(s as LessonSource, words);
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}
