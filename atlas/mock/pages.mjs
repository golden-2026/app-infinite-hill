// The website's footer pages as real pages: /about, /privacy, /keepers … (and /es/about … in Spanish).
// Each one is a small static file in apps/app/public (about.html, about-es.html, …) with the site's header, fonts,
// colours and footer, one readable column, and a Start free button where it fits.
//
// The words are not written here. English comes from the PAGES object in apps/app/public/site.html (the same text the
// footer pop-ups showed), Spanish from mock/es-pages.mjs. So: edit the text there, then rebuild. `node mock/build.mjs
// --apply` and `node mock/build.mjs --lang es --apply` run this too; `node mock/pages.mjs` rebuilds both languages alone.
// Images are linked by URL from /site-art (no base64), so each page stays small. Old links (site.html#p/about) are
// sent here by a tiny script in site.html; two short notes (social, refer) still open as pop-ups on the home page.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PUB = ROOT + 'apps/app/public/';
const ART = ROOT + 'packages/brand/art/';

// Footer pages that became real pages, in footer order. social and refer stay pop-ups (a line or two, "not live yet").
export const REAL = ['about', 'foundation', 'keepers', 'provenance', 'careers', 'science', 'paths', 'nights', 'prayers', 'voices', 'schools', 'promise', 'safety', 'contact', 'privacy', 'terms', 'biometric', 'legal'];
// pages that end with a Start free button (not the legal, contact, careers or schools pages)
const CTA = new Set(['about', 'foundation', 'keepers', 'provenance', 'science', 'paths', 'nights', 'prayers', 'voices', 'promise']);
// the mascot beside the opening lines, as in the pop-ups (approved, redrawn stills only)
const GUY = { about: 'wave', science: 'think', schools: 'laptop', foundation: 'heart', careers: 'hike', nights: 'sleep' };

const T = {
  en: {
    lang: 'en', home: '/', homeLabel: 'infinite hill, home', start: 'Start free', app: '/welcome/you', ctaH: "start now. it's free.",
    pre: '/', anchor: (a) => `/#${a}`,
    cols: [
      ['Practice', [['The house (free)', '#plans'], ['infinite hill plus', '#plans'], ['The table', '#plans'], ['Gift infinite hill', '#gift']]],
      ['Company', [['About', 'about'], ['The Foundation', 'foundation'], ['The Keeper Desk', 'keepers'], ['Keeper &amp; provenance', 'provenance'], ['Careers', 'careers']]],
      ['Learn', [['Research', 'science'], ['Eight paths', 'paths'], ['Golden hour nights', 'nights'], ["Why we don't write prayers", 'prayers'], ['How voices work', 'voices'], ['infinite hill for schools', 'schools']]],
      ['Support', [['FAQ', '#faq'], ['The 100-day promise', 'promise'], ['Safety &amp; hosts', 'safety'], ['Contact', 'contact']]],
      ['Together', [['Instagram', '#p/social'], ['TikTok', '#p/social'], ['YouTube', '#p/social'], ['Refer a friend', '#p/refer']]],
    ],
    legal: [['Privacy', 'privacy'], ['Terms', 'terms'], ['Biometric consent', 'biometric'], ['Legal', 'legal']],
    notAff: 'Not affiliated with any religious institution',
    comp: 'Design comp · Ambassadors and Keepers shown are targets, not signed',
    disc: 'infinite hill teaches from public-domain scripture, to be checked by Keepers of each tradition. It is not a substitute for a congregation, a clergy member, or medical or mental-health care. Off-app gatherings, once they start, will be hosted only by verified institutions and organizers; all off-app events will be 18+.',
    back: '← home',
  },
  es: {
    lang: 'es', home: '/es', homeLabel: 'infinite hill, inicio', start: 'Empieza gratis', app: '/welcome/you?lang=es', ctaH: 'empieza ahora. es gratis.',
    pre: '/es/', anchor: (a) => `/es#${a}`,
    cols: [
      ['Práctica', [['La casa (gratis)', '#plans'], ['infinite hill plus', '#plans'], ['La mesa', '#plans'], ['Regala infinite hill', '#gift']]],
      ['Empresa', [['Quiénes somos', 'about'], ['La fundación', 'foundation'], ['La mesa de guardianes', 'keepers'], ['Guardianes y procedencia', 'provenance'], ['Empleos', 'careers']]],
      ['Aprende', [['Investigación', 'science'], ['Ocho caminos', 'paths'], ['Noches de hora dorada', 'nights'], ['Por qué no escribimos oraciones', 'prayers'], ['Cómo funcionan las voces', 'voices'], ['infinite hill para escuelas', 'schools']]],
      ['Ayuda', [['Preguntas frecuentes', '#faq'], ['La promesa de 100 días', 'promise'], ['Seguridad y anfitriones', 'safety'], ['Contacto', 'contact']]],
      ['Juntos', [['Instagram', '#p/social'], ['TikTok', '#p/social'], ['YouTube', '#p/social'], ['Invita a un amigo', '#p/refer']]],
    ],
    legal: [['Privacidad', 'privacy'], ['Términos', 'terms'], ['Consentimiento biométrico', 'biometric'], ['Legal', 'legal']],
    notAff: 'Sin afiliación con ninguna institución religiosa',
    comp: 'Boceto de diseño · Los embajadores y guardianes que se muestran son personas que buscamos, no han firmado',
    disc: 'infinite hill enseña a partir de escrituras de dominio público, que revisarán guardianes de cada tradición. No sustituye a una congregación, a un ministro religioso ni a la atención médica o de salud mental. Los encuentros fuera de la app, cuando empiecen, los organizarán solo instituciones y organizadores verificados; todos los eventos fuera de la app serán para mayores de 18 años.',
    back: '← inicio',
  },
};

const url = (t, k) => (k.startsWith('#') ? t.anchor(k.slice(1)) : t.pre + k);
const file = (lang, k) => `${k}${lang === 'es' ? '-es' : ''}.html`;
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const attr = (s) => s.replace(/&(?!amp;)/g, '&amp;').replace(/"/g, '&quot;');

/** The PAGES object out of a built site page (base64 never sits inside it). */
export function pagesFrom(html) {
  const a = html.indexOf('const PAGES='), b = html.indexOf('};\n', a);
  if (a < 0 || b < 0) throw new Error('no PAGES object in site.html');
  return Function('return ' + html.slice(a + 'const PAGES='.length, b + 1))();
}

function page(lang, k, [title, body]) {
  const t = T[lang];
  // links between pages: the old pop-up links (#p/contact, data-page) become real ones
  body = body.replace(/href="#p\/([a-z]+)" data-page="\1"/g, (m, p) => `href="${REAL.includes(p) ? t.pre + p : t.anchor('p/' + p)}"`);
  if (/#p\/|data-page/.test(body)) throw new Error(`${lang} ${k}: a pop-up link is left in the page text`);
  const plain = text(title);
  const head = /infinite hill/i.test(plain) ? plain : `${plain} · infinite hill`;
  const lead = text((body.match(/<p>[\s\S]*?<\/p>/) || [''])[0]);
  const desc = lead.length > 158 ? lead.slice(0, 155).replace(/\s+\S*$/, '') + '…' : lead;
  const guy = GUY[k] ? `<img class="pageguy" src="/site-art/guy-${GUY[k]}.webp" alt="" width="706" height="720">` : '';
  const cta = CTA.has(k) ? `\n    <div class="cta"><p class="ctah">${t.ctaH}</p><a class="btn dark big" href="${t.app}">${t.start}</a></div>` : '';
  const cols = t.cols.map(([h, items]) => `<div><h5>${h}</h5><ul>${items.map(([l, to]) => `<li><a href="${url(t, to)}"${to === k ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul></div>`).join('\n      ');
  const legal = t.legal.map(([l, to]) => `<a href="${url(t, to)}"${to === k ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- GENERATED by atlas/mock/pages.mjs from the PAGES text in site.html${lang === 'es' ? ' and atlas/mock/es-pages.mjs' : ''}. Edit that text, not this file. -->
<title>${head}</title>
<meta name="description" content="${attr(desc)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="infinite hill">
<meta property="og:title" content="${attr(head)}">
<meta property="og:description" content="${attr(desc)}">
<link rel="icon" type="image/png" href="/site-art/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" hreflang="en" href="/${k}">
<link rel="alternate" hreflang="es" href="/es/${k}">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site-pages.css">
</head>
<body>
<a class="skip" href="#main">${lang === 'es' ? 'Ir al contenido' : 'Skip to content'}</a>
<header class="top">
  <div class="bar">
    <div class="langsw" role="group" aria-label="Language · Idioma"><a href="/${k}" lang="en" hreflang="en"${lang === 'en' ? ' aria-current="page"' : ''} aria-label="English">EN</a><a href="/es/${k}" lang="es" hreflang="es"${lang === 'es' ? ' aria-current="page"' : ''} aria-label="Español">ES</a></div>
    <a class="logo" href="${t.home}" aria-label="${t.homeLabel}"><img src="/site-art/logo-mark.webp" alt="" width="311" height="320"><span class="mark">infinite hill</span></a>
    <a class="btn dark" href="${t.app}">${t.start}</a>
  </div>
</header>

<main id="main">
  <article class="sheet">
    <a class="kicker" href="${t.home}">${t.back}</a>
    <h1>${title}</h1>
    <div class="body">${guy}${body.trim()}</div>${cta}
  </article>
</main>

<footer>
  <div class="wrap">
    <nav class="cols" aria-label="${lang === 'es' ? 'Más de infinite hill' : 'More from infinite hill'}">
      ${cols}
    </nav>
    <div class="big mark"><img src="/site-art/logo-mark.webp" alt="" width="311" height="320">infinite hill</div>
    <div class="legal"><span>© 2026 Infinite Hill Ventures, Inc.</span>${legal}<span>${t.notAff}</span><span class="comp">${t.comp}</span></div>
    <div class="disc">${t.disc}</div>
  </div>
</footer>
</body>
</html>
`;
}

/** Writes every real page for one language (and the shared CSS and images). Returns the files written. */
export function buildPages(lang, PAGES, outDir = PUB) {
  const missing = REAL.filter((k) => !PAGES[k]);
  if (missing.length) throw new Error(`${lang} pages missing from PAGES: ${missing.join(', ')}`);
  fs.mkdirSync(outDir + 'site-art', { recursive: true });
  fs.copyFileSync(new URL('./pages.css', import.meta.url), outDir + 'site-pages.css');
  for (const p of new Set(Object.values(GUY))) fs.copyFileSync(ART + `guy-${p}.webp`, outDir + `site-art/guy-${p}.webp`);
  const out = [];
  for (const k of REAL) { fs.writeFileSync(outDir + file(lang, k), page(lang, k, PAGES[k])); out.push(file(lang, k)); }
  return out;
}

// node mock/pages.mjs — both languages, straight from site.html and es-pages.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const en = buildPages('en', pagesFrom(fs.readFileSync(PUB + 'site.html', 'utf8')));
  const es = buildPages('es', (await import('./es-pages.mjs')).PAGES);
  console.log(`pages: ${en.length} English + ${es.length} Spanish -> apps/app/public`);
}
