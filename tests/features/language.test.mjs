// The language choice (apps/app/src/i18n/core.ts), the dictionaries (apps/app/src/i18n/strings/*.ts) and the fixed
// `lang` the phone sends to the companion (apps/app/src/lib/companion-ai.ts), loaded straight from the app's
// TypeScript (Node strips the types; these files have no runtime imports).
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { register } from "node:module";

// area files may spread in helper files imported without an extension (Metro resolves them); resolve those to .ts here
const hooks = String.raw`export async function resolve(spec, ctx, next) {
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\.\w+$/.test(spec) && ctx.parentURL?.includes("/apps/app/src/")) {
    try { return await next(spec + ".ts", ctx); } catch {}
  }
  return next(spec, ctx);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);

const SRC = new URL("../../apps/app/src/", import.meta.url);
const core = await import(new URL("i18n/core.ts", SRC).href);
const { chooseLang, langFromTag, setLangState, getLang, subscribeLang, render, formatNumber, pluralForm, missingKeys } = core;

test("device language: es-* goes to Spanish, everything else stays English", () => {
  for (const tag of ["es", "es-MX", "es-419", "es_US", "ES-es", " es-AR "]) assert.equal(langFromTag(tag), "es", tag);
  for (const tag of ["en", "en-US", "pt-BR", "fr", "eu", "est", "", null, undefined]) assert.equal(langFromTag(tag), "en", String(tag));
});

test("the choice: a ?lang= link, then the saved choice, then the phone's first language", () => {
  assert.equal(chooseLang({ device: ["es-MX", "en-US"] }), "es");
  assert.equal(chooseLang({ device: ["en-US", "es-MX"] }), "en"); // only the first preferred language counts
  assert.equal(chooseLang({ device: [] }), "en");
  assert.equal(chooseLang({ device: "es-CO" }), "es");
  assert.equal(chooseLang({ saved: "en", device: ["es-MX"] }), "en"); // their choice under You beats the phone
  assert.equal(chooseLang({ saved: "es", device: ["en-US"] }), "es");
  assert.equal(chooseLang({ url: "es", saved: "en", device: ["en-US"] }), "es"); // the website's Spanish "Start free"
  assert.equal(chooseLang({ url: "EN", saved: "es" }), "en");
  // junk is ignored, never trusted
  assert.equal(chooseLang({ url: "fr", saved: "de", device: ["en-GB"] }), "en");
  assert.equal(chooseLang({ url: "<script>", saved: { lang: "es" }, device: ["es-ES"] }), "es");
});

test("switching the language notifies once, lives on globalThis for import-free modules, and never takes junk", () => {
  let calls = 0;
  const off = subscribeLang(() => { calls += 1; });
  setLangState("es");
  assert.equal(getLang(), "es");
  assert.equal(globalThis.__ihLang, "es");
  setLangState("es");
  assert.equal(calls, 1);
  setLangState("fr");
  assert.equal(getLang(), "en");
  off();
  setLangState("es");
  assert.equal(calls, 2);
  setLangState("en");
});

test("plurals and numbers in both languages", () => {
  const dicts = {
    en: { d: { one: "{count} day", other: "{count} days" }, hi: "hi {name}" },
    es: { d: { one: "{count} día", other: "{count} días" } },
  };
  assert.equal(render(dicts, "d", { count: 1 }, "en"), "1 day");
  assert.equal(render(dicts, "d", { count: 0 }, "en"), "0 days");
  assert.equal(render(dicts, "d", { count: 1 }, "es"), "1 día");
  assert.equal(render(dicts, "d", { count: 2 }, "es"), "2 días");
  assert.equal(render(dicts, "d", { count: 12500 }, "es"), "12,500 días");
  assert.equal(render(dicts, "hi", { name: "Ana" }, "es"), "hi Ana"); // falls back to English, never blank
  assert.equal(render(dicts, "missing", {}, "es"), "missing");
  assert.equal(pluralForm({ one: "uno", other: "otros" }, 1_000_000, "es"), "otros"); // "many" falls back to other
  assert.equal(formatNumber(2026, "es"), "2026"); // years are never grouped
  assert.equal(formatNumber(2026, "en"), "2026");
  assert.equal(formatNumber(1.5, "es"), "1.5");
  assert.equal(formatNumber(10000, "en"), "10,000");
});

// every area's Spanish has every English key, the same shape, and the same {slots}
const dir = new URL("i18n/strings/", SRC);
const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
const SPANISH_ONLY_SLOTS = { "companion.fact.why.partnerDoor": ["{theDoor}"], "session.card.yearText": ["{daysN}", "{lessonsN}", "{wordsN}"] };
const slots = (m) => [...new Set(JSON.stringify(m).match(/\{\w+\}/g) || [])].sort();

test("the Spanish dictionaries are complete, with the same slots as the English", async () => {
  assert.ok(files.length >= 5, files.join(", "));
  const index = readFileSync(new URL("index.ts", dir), "utf8");
  let keys = 0;
  for (const f of files) {
    const mod = await import(new URL(f, dir).href);
    if (!mod.en || !mod.es) continue; // a helper file spread into an area file
    const { missing, extra, shape } = missingKeys(mod.en, mod.es);
    assert.deepEqual({ missing, extra, shape }, { missing: [], extra: [], shape: [] }, f);
    for (const k of Object.keys(mod.en)) {
      keys += 1;
      // a Spanish line may need a slot the English doesn't (an article: "el hinduismo"); those callers pass both
      if (!SPANISH_ONLY_SLOTS[k]) assert.deepEqual(slots(mod.es[k]), slots(mod.en[k]), `${f}: ${k} keeps its slots`);
      const es = mod.es[k];
      if (typeof es === "string") assert.ok(es.trim() || !String(mod.en[k]).trim(), `${f}: ${k} is not blank`);
      else assert.ok(es.one && es.other, `${f}: ${k} has one and other`);
    }
    // every area file is merged into the app (directly, or through another area file)
    const name = f.replace(/\.ts$/, "");
    const merged = index.includes(`"./${name}"`) || files.some((g) => g !== f && readFileSync(new URL(g, dir), "utf8").includes(`"./${name}"`));
    assert.ok(merged, `${f} is merged into strings/index.ts`);
  }
  assert.ok(keys > 50, `${keys} keys`);
});

test("the companion requests carry the fixed lang the app is in", async () => {
  const ai = await import(new URL("lib/companion-ai.ts", SRC).href);
  const bodies = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    bodies.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ text: "ok" }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const req = { profile: { door: "HINDUISM" }, memory: [], context: { door: "HINDUISM", day: 1, hour: 9 }, messages: [{ role: "user", content: "hola" }] };
    setLangState("es");
    assert.equal(ai.answerLang(), "es");
    await ai.companionChat(req);
    setLangState("en");
    await ai.companionChat(req);
    assert.equal(bodies[0].profile.lang, "es");
    assert.equal(bodies[1].profile.lang, "en");
    assert.equal(req.profile.lang, undefined); // the caller's object is left alone
  } finally {
    globalThis.fetch = originalFetch;
    setLangState("en");
  }
});
