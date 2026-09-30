// Builds the motion preview: site.html (the version before the motion pass) + mock/motion.html, with the
// mascot poses inlined. Writes mock/out/site.html. `node mock/build.mjs --apply` also writes it back to the app.
//
// First paint: site.html carries megabytes of inline base64 in the body, so any <style> that sits in the body only
// applies once the parser reaches it, and phones briefly paint the old design first. So every body <style> block
// (in document order) and the motion layer's own CSS (<style id="motion-css">) go at the end of <head>. The
// motion layer's markup and script stay at the end of the body. Running it again gives the same file.
import fs from 'node:fs';
const SITE = '../apps/app/public/site.html';
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
fs.writeFileSync('mock/out/site.html', out);
fs.writeFileSync('mock/out/index.html', '<meta http-equiv="refresh" content="0;url=site.html">');
if (process.argv.includes('--apply')) fs.writeFileSync(SITE, out);
console.log('built', (out.length / 1e6).toFixed(1) + 'MB', mark >= 0 ? '(replaced the earlier motion pass)' : '', hoisted.length ? `(hoisted ${hoisted.length} body styles)` : '(no body styles left to hoist)');
