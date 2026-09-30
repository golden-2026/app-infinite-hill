// Builds the motion preview: site.html (the version before the motion pass) + mock/motion.html, with the
// mascot poses inlined. Writes mock/out/site.html. `node mock/build.mjs --apply` also writes it back to the app.
//
// First paint: site.html carries megabytes of inline base64 in the body, so any <style> that sits in the body only
// applies once the parser reaches it, and phones briefly paint the old design first. So every body <style> block
// (in document order) and the motion layer's own CSS (<style id="motion-css">) go at the end of <head>. The
// motion layer's markup and script stay at the end of the body. Running it again gives the same file.
//
// Spanish: `node mock/build.mjs --lang es [--apply]` runs this same build, then translates the result with the text in
// mock/es.mjs (exact English -> Spanish pairs, motion layer included) and mock/es-pages.mjs (the pop-up pages), points
// every way into the app at ?lang=es, and writes mock/out/site-es.html (with --apply, apps/app/public/site-es.html,
// served at /es by public/_redirects). It never writes site.html, so the English output is unchanged. After editing
// the English copy or motion.html, rebuild both: `--apply`, then `--lang es --apply`; a stale pair stops the build.
import fs from 'node:fs';
const SITE = '../apps/app/public/site.html';
const SITE_ES = '../apps/app/public/site-es.html';
const li = process.argv.indexOf('--lang');
const LANG = li > 0 ? process.argv[li + 1] : 'en';
if (!['en', 'es'].includes(LANG)) throw new Error('--lang must be en or es');
let src = fs.readFileSync(SITE, 'utf8');
// strip an earlier motion pass (everything from its marker to the script that closes it)
const mark = src.indexOf('<!-- MOTION PASS');
if (mark >= 0) {
  const end = src.indexOf('</script>', src.indexOf('the lesson loop inside the phone', mark) >= 0 ? src.indexOf('the lesson loop inside the phone', mark) : src.indexOf('the phone: pick a door', mark));
  src = src.slice(0, mark) + src.slice(end + '</script>'.length);
}
// ...and its CSS from an earlier build, wherever it sits
src = src.replace(/<style id="motion-css">[\s\S]*?<\/style>\r?\n?/g, '');

let add = fs.readFileSync('mock/motion.html', 'utf8');
for (const p of ['wave', 'cheer', 'jump', 'joy', 'meditate', 'namaste', 'thumbs', 'walk', 'stride', 'climb', 'globe', 'point', 'idea', 'think', 'heart', 'peace']) {
  const b64 = fs.readFileSync(`../packages/brand/art/guy-${p}.webp`).toString('base64');
  add = add.split(`{{GUY_${p.toUpperCase()}}}`).join(`data:image/webp;base64,${b64}`);
}
// the motion layer's CSS goes to <head>; its markup and script stay at the end of <body>
const css = add.match(/<style>[\s\S]*?<\/style>/);
if (!css) throw new Error('motion.html has no <style> block');
add = add.replace(css[0], '');
const motionCss = css[0].replace('<style>', '<style id="motion-css">');

// hoist every <style> block in the body into the head, keeping their order (they only hold CSS, never script)
const headEnd = src.indexOf('</head>');
const bodyStart = src.indexOf('<body', headEnd);
if (headEnd < 0 || bodyStart < 0) throw new Error('no </head> or <body>');
let head = src.slice(0, headEnd), body = src.slice(headEnd);
const hoisted = [];
body = body.replace(/<style(\s[^>]*)?>[\s\S]*?<\/style>/g, (m) => { hoisted.push(m); return ''; });
head += (hoisted.length ? '<!-- body styles, hoisted by mock/build.mjs so the first paint is the real design -->\n' + hoisted.join('\n') + '\n' : '') + motionCss + '\n';
src = head + body;

src = src.replace(/\s*<\/body>(?![\s\S]*<\/body>)/, '\n</body>'); // no blank lines piling up before </body> run after run
const i = src.lastIndexOf('</body>');
const out = src.slice(0, i) + add + src.slice(i);
fs.mkdirSync('mock/out', { recursive: true });
if (LANG === 'es') {
  // Spanish: the same build, translated. Never touches site.html; writes site-es.html next to it (served at /es).
  const es = await translate(out, await import('./es.mjs'));
  fs.writeFileSync('mock/out/site-es.html', es);
  if (process.argv.includes('--apply')) fs.writeFileSync(SITE_ES, es);
  console.log('built es', (es.length / 1e6).toFixed(1) + 'MB', process.argv.includes('--apply') ? '-> ' + SITE_ES : '-> mock/out/site-es.html');
} else {
  fs.writeFileSync('mock/out/site.html', out);
  fs.writeFileSync('mock/out/index.html', '<meta http-equiv="refresh" content="0;url=site.html">');
  if (process.argv.includes('--apply')) fs.writeFileSync(SITE, out);
  console.log('built', (out.length / 1e6).toFixed(1) + 'MB', mark >= 0 ? '(replaced the earlier motion pass)' : '', hoisted.length ? `(hoisted ${hoisted.length} body styles)` : '(no body styles left to hoist)');
}

// English page -> Spanish page: inline base64 is set aside, the pop-up PAGES object is swapped whole, <title> becomes the
// Spanish head (title, description, og:*), then every [english, spanish] pair in es.mjs runs. Any pair or page that no
// longer matches stops the build, and so does any way into the app that doesn't carry lang=es.
async function translate(html, { PAIRS, PAGES, HEAD }) {
  const kept = [];
  html = html.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, (m) => `\u0000${kept.push(m) - 1}\u0000`);
  const a = html.indexOf('const PAGES='), b = html.indexOf('};\n', a);
  if (a < 0 || b < 0) throw new Error('no PAGES object');
  const en = Function('return ' + html.slice(a + 'const PAGES='.length, b + 1))();
  const gone = Object.keys(en).filter((k) => !PAGES[k]), extra = Object.keys(PAGES).filter((k) => !en[k]);
  if (gone.length || extra.length) throw new Error(`Spanish PAGES out of step: missing ${gone.join(', ') || '-'}; extra ${extra.join(', ') || '-'}`);
  html = html.slice(0, a) + 'const PAGES=' + JSON.stringify(PAGES).replace(/<\/script/gi, '<\\/script') + ';' + html.slice(b + 2);
  if (!/<title>[^<]*<\/title>/.test(html)) throw new Error('no <title>');
  html = html.replace(/<title>[^<]*<\/title>/, () => HEAD);
  const missing = [];
  for (const [from, to] of PAIRS) {
    if (!html.includes(from)) { missing.push(from.slice(0, 90)); continue; }
    html = html.split(from).join(to);
  }
  if (missing.length) throw new Error(`${missing.length} Spanish pair(s) no longer match the English page:\n  ` + missing.join('\n  '));
  const bare = [...html.matchAll(/['"(]\/welcome\/[^'"\s)]*/g)].filter((m) => !html.slice(m.index, m.index + 70).includes('lang=es'));
  if (bare.length) throw new Error('app links without lang=es: ' + bare.map((m) => m[0]).join(' '));
  return html.replace(/\u0000(\d+)\u0000/g, (_, n) => kept[Number(n)]);
}
