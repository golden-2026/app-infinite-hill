// "sources" at the end of a lesson: the week files keep each script's references (without the quoted words), and
// the app turns them into one plain line each. Loaded straight from the app's TypeScript (Node strips the types).
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileScript } from "../../packages/content/src/lesson-script.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { sourceLine, sourceLines, sourceUse } = await import(pathToFileURL(`${root}apps/app/src/session/sources.ts`).href);
const W = { paraphrased: "paraphrased", original: "original text" };

test("a quoted verse names its public-domain translation; a paraphrase says so", () => {
  assert.equal(sourceLine({ ref: "Psalm 23:1", work: "The Bible", translation: "KJV (1769)", quoted: true }, W), "Psalm 23:1 · The Bible · KJV (1769)");
  assert.equal(sourceLine({ ref: "Qur'an 4:103", work: "The Qur'an", translation: null, quoted: false }, W), "Qur'an 4:103 · The Qur'an · paraphrased");
  // a translation named without a quotation is still a paraphrase
  assert.equal(sourceUse({ ref: "x", work: "y", translation: "Pickthall 1930", quoted: false }, W), "paraphrased");
  // the original language, quoted as written
  assert.equal(sourceUse({ ref: "Ang 1", work: "Guru Granth Sahib", translation: "public domain (original), transliterated", quoted: true }, W), "original text");
  // the words a person sees can be Spanish
  assert.equal(sourceLine({ ref: "Juan 3:16", work: "The Bible", translation: null, quoted: false }, { paraphrased: "parafraseado", original: "texto original" }), "Juan 3:16 · The Bible · parafraseado");
});

test("the day's lines keep the script's order, drop repeats and junk, and an outline-only day has none", () => {
  const src = [
    { ref: "Qur'an 4:86", work: "The Qur'an", translation: "Pickthall 1930", quoted: true },
    { ref: "Qur'an 4:86", work: "The Qur'an", translation: "Pickthall 1930", quoted: true },
    null,
    { ref: "", work: "" },
    { ref: "Sahih Muslim 54", work: "Hadith", translation: null, quoted: false },
  ];
  assert.deepEqual(sourceLines(src, W), ["Qur'an 4:86 · The Qur'an · Pickthall 1930", "Sahih Muslim 54 · Hadith · paraphrased"]);
  assert.deepEqual(sourceLines(undefined, W), []);
  assert.deepEqual(sourceLines([], W), []);
});

test("the built week file keeps ref, work and translation, and only a yes/no for the quoted words", () => {
  const c = compileScript({ day: 1, sources: [{ ref: "Psalm 23:1", work: "The Bible", translation: "KJV (1769)", quoted: "The LORD is my shepherd; I shall not want." }, { ref: "John 3:16", work: "The Bible", translation: null, quoted: null }] });
  assert.deepEqual(c.sources, [
    { ref: "Psalm 23:1", work: "The Bible", translation: "KJV (1769)", quoted: true },
    { ref: "John 3:16", work: "The Bible", translation: null, quoted: false },
  ]);
  assert.ok(!JSON.stringify(c.sources).includes("shepherd"), "the quoted words never ship");
});
