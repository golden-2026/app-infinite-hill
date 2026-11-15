// Where a Guide answer comes from (owner, 2026-11-05: "the Guide shows its sources"). The plain-text Guide
// (api/guide.js) ends a teaching answer with a "source:" line; the companion (api/companion.js) sends it as its own
// field. Either way the app shows it as a small line under the answer, never inside it.
// Pure, so tests/features/guide-sources.test.mjs can check it. Nothing here is sent anywhere.

const LINE = /\n[ \t]*[*_]*(source|fuente)s?[*_]*[ \t]*:[*_]*[ \t]*([^\n]+?)[*_]*[ \t]*$/i;

/** Split a trailing "source: …" line off an answer. No line, or an empty one: the answer is unchanged. */
export function splitSource(answer: string, given?: string | null): { text: string; source: string | null } {
  const raw = String(answer || "");
  const m = raw.trimEnd().match(LINE);
  const text = m ? raw.trimEnd().slice(0, m.index).trimEnd() : raw;
  const label = (given || "").trim() || (m ? m[2].trim() : "");
  const source = label.replace(/^(source|fuente)s?\s*:\s*/i, "").replace(/\s+/g, " ").slice(0, 200).trim();
  return { text: text || raw, source: source || null };
}
