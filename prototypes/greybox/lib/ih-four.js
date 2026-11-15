// IH4: four old-app features for the new app (2026-11-07, owner-approved), shared by hill-app.html and hill-chat.html.
//   1. Spanish: the language (EN/ES), stored in the app's own state (ih-hill-app-demo .lang), defaulted from the phone.
//      The UI is translated in place from lib/ih-es.js (exact lines, plus patterns for lines with numbers or names).
//      Lesson and episode content stays as written. Anything inside [translate="no"] is never touched.
//   2. Journal: private pages on this phone only (localStorage "ih-journal"). Never sent, never logged.
//   3. Rematch: wrong first picks from the lesson player (localStorage "ih-missed"), spaced 1, 3, 7, 14 days
//      (the old app's lib/missed.ts rules: right moves it further out, wrong brings it back tomorrow).
//   4. Seasons: each faith's holy days and season quests, from the old app's content/seasons.ts (lib/ih-seasons.js).
(function () {
  var KEY = "ih-hill-app-demo";
  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function pad(n) { return ("0" + n).slice(-2); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(date, n) { var d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ── 1. language ──
  var Q = /[?&]lang=(en|es)\b/.exec(location.search);
  function phoneLang() { var l = (navigator.languages && navigator.languages[0]) || navigator.language || "en"; return /^es\b/i.test(l) ? "es" : "en"; }
  // 2026-11-14: the hill app keeps its state in "ih-hill-doors" (a page can name its own key in window.IH4_KEY).
  // read that first, then the older demo key, so the EN/ES choice survives a reload on every page.
  function savedLang() {
    var keys = window.IH4_KEY ? [window.IH4_KEY] : ["ih-hill-doors", KEY];
    for (var i = 0; i < keys.length; i++) { var s = read(keys[i], null); if (s && (s.lang === "es" || s.lang === "en")) return s.lang; }
    return null;
  }
  var saved = savedLang(), LANG = Q ? Q[1] : saved || phoneLang();
  function lang() { return LANG; }
  function isEs() { return LANG === "es"; }
  // a small fill-in for lines written in code: t("en", "es", { n: 3 }) → "{n}" filled in
  function t(en, es, vars) { var s = isEs() && es != null ? es : en; if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); return s; }

  // the in-place translator: exact lines first, then patterns. whitespace around a line is kept.
  var DICT = null, PATS = null, LOW = null, MISS = window.__ihMiss = {};
  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  function norm(s) { return s.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim(); }
  function one(s) {
    var hit = DICT[s];
    // 2026-11-14: a line lowercased for the house style still finds its Spanish ("Family circle" → "family circle")
    if (hit == null) { var lo = LOW[s.toLowerCase()]; if (lo != null) hit = s.charAt(0) === s.charAt(0).toLowerCase() ? lo.charAt(0).toLowerCase() + lo.slice(1) : lo; }
    if (hit == null) for (var i = 0; i < PATS.length; i++) { var m = PATS[i][0].exec(s); if (m) { hit = typeof PATS[i][1] === "function" ? PATS[i][1].apply(null, m) : s.replace(PATS[i][0], PATS[i][1]); break; } }
    return hit;
  }
  function tr(raw) {
    if (!DICT) { var E = window.IH_ES || {}; DICT = E.dict || {}; PATS = E.pats || []; LOW = {}; Object.keys(DICT).forEach(function (k) { if (k.length < 4) return; var l = k.toLowerCase(); /* 2026-11-15: no short keys ("Tu" → "Ma" made "tu gente" read "ma gente") */ if (LOW[l] == null) LOW[l] = DICT[k]; }); }
    var s = norm(raw); if (!s || !/[a-z]/i.test(s)) return null;
    var hit = one(s);
    // a line built from several sentences (e.g. the guide's hello + where your lessons start): sentence by sentence
    if (hit == null && /[.!?…]\s+\S/.test(s)) {
      var parts = s.split(/(?<=[.!?…])\s+/), done = 0;
      var outp = parts.map(function (p) { var x = one(p); if (x != null) { done++; return x; } return p; });
      if (done && done === parts.length) hit = outp.join(" ");
    }
    if (hit == null) { if (window.__ihHarvest) MISS[s] = (MISS[s] || 0) + 1; return null; }
    var lead = /^\s*/.exec(raw)[0], tail = /\s*$/.exec(raw)[0];
    return lead + hit + tail;
  }
  // translate the lowercased variant too, when a line is shown in a different case than it is written
  function skip(el) { for (var e = el; e && e.nodeType === 1; e = e.parentNode) { if (e.getAttribute && (e.getAttribute("translate") === "no" || e.getAttribute("data-es-done") === "1")) return true; var n = e.nodeName; if (n === "SCRIPT" || n === "STYLE" || n === "TEXTAREA" || n === "CODE") return true; } return false; }
  var mine = typeof WeakMap === "function" ? new WeakMap() : null;
  function doText(node) {
    if (!node.parentNode || skip(node.parentNode)) return;
    var v = node.nodeValue; if (mine && mine.get(node) === v) return;
    var x = tr(v); if (x != null && x !== v) { node.nodeValue = x; if (mine) mine.set(node, x); }
  }
  function doAttrs(el) {
    if (skip(el)) return;
    for (var i = 0; i < ATTRS.length; i++) { var a = ATTRS[i], v = el.getAttribute(a); if (!v) continue; var x = tr(v); if (x != null && x !== v) el.setAttribute(a, x); }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || skip(root)) return;
    // a heading with markup inside ("your <em>cards</em>") carries its whole Spanish in data-es
    if (root.querySelectorAll) [].forEach.call(root.querySelectorAll("[data-es]"), function (e) { if (e.dataset.esDone !== "1") { e.innerHTML = e.getAttribute("data-es"); e.dataset.esDone = "1"; } });
    doAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  var started = false;
  function start() {
    try { document.documentElement.lang = LANG; } catch (e) {}
    if (started || !isEs()) return; started = true;
    walk(document.body);
    if (document.title) { var tt = tr(document.title); if (tt) document.title = tt; }
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === "characterData") doText(m.target);
        else if (m.type === "attributes") { if (m.target.nodeType === 1) doAttrs(m.target); }
        else for (var k = 0; k < m.addedNodes.length; k++) walk(m.addedNodes[k]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // one line through the dictionary, for code that builds text it then reads back (e.g. a share card on canvas)
  function say(s) { if (!isEs()) return s; var x = tr(String(s)); return x == null ? s : x; }
  // a link to another screen keeps Spanish along (2026-11-11): "lesson.html?day=2" → "lesson.html?day=2&lang=es"
  function withLang(u) {
    u = String(u || ""); if (!isEs() || /[?&]lang=/.test(u) || /^(tel|sms|mailto|javascript|about):/i.test(u)) return u;
    var h = u.indexOf("#"), base = h < 0 ? u : u.slice(0, h), frag = h < 0 ? "" : u.slice(h);
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "lang=es" + frag;
  }

  // the switch itself: two pills. the app saves the choice in its own state, then the page reloads in that language
  function switchHTML(id) {
    return '<div class="ih4-lang" id="' + (id || "langSw") + '" role="group" aria-label="language"><button type="button" data-l="en" class="' + (LANG === "en" ? "on" : "") + '" aria-pressed="' + (LANG === "en") + '" translate="no">EN</button><button type="button" data-l="es" class="' + (LANG === "es" ? "on" : "") + '" aria-pressed="' + (LANG === "es") + '" translate="no">ES</button></div>';
  }
  function wireSwitch(el, setInState) {
    if (!el) return;
    [].forEach.call(el.querySelectorAll("button"), function (b) {
      b.onclick = function () { var l = b.dataset.l; if (l === LANG) return; setInState(l); var u = location.href.replace(/([?&])lang=(en|es)&?/, "$1").replace(/[?&]$/, ""); location.replace(u); };
    });
  }

  // ── crisis care, in the current language (988 / AYUDA / local emergency). warm first, every time ──
  function careHTML(spanishWords) {
    var en = "i'm really glad you told me. you matter, and you don't have to carry this alone. if you're in danger or thinking about hurting yourself, please call or text <b>988</b> (in the US) right now, or your local emergency number. i'm right here too.";
    var es = "me alegra mucho que me lo hayas contado. importas, y no tienes que cargar con esto a solas. si estás en peligro o piensas en hacerte daño, llama ahora al <b>988</b> y oprime 2, o escribe <b>AYUDA</b> al 988 (en EE. UU.), o llama a tu número de emergencia local. aquí sigo contigo.";
    var esLine = "<br><br>si hablas español: llama al <b>988</b> y oprime 2, o escribe <b>AYUDA</b> al 988. fuera de EE. UU., llama a tu número de emergencia local.";
    var btns = isEs()
      ? '<div class="carebtns"><a href="tel:988">llamar al 988</a><a href="sms:988?body=AYUDA">escribir AYUDA al 988</a><a href="tel:112">¿fuera de EE. UU.? 112</a></div><small class="careout">fuera de EE. UU., también sirve cualquier número de emergencia local (en México, el 911). si puedes, cuéntaselo hoy a alguien de confianza.</small>'
      : '<div class="carebtns"><a href="tel:988">call 988</a><a href="sms:988">text 988</a><a href="tel:112">not in the US? 112</a></div><small class="careout">outside the US, any local emergency number works too. if you can, tell someone you trust tonight.</small>';
    return (isEs() ? es : en + (spanishWords ? esLine : "")) + btns;
  }

  // ── 2. the journal: private pages, this phone only ──
  var JKEY = "ih-journal";
  function jList() { var a = read(JKEY, []); return Array.isArray(a) ? a.filter(function (p) { return p && typeof p.text === "string" && p.id; }) : []; }
  function jSave(list) { write(JKEY, list.slice(-400)); }
  function jAdd(p) { var list = jList(), page = { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: iso(), at: Date.now(), prompt: p.prompt || "", about: p.about || "", text: String(p.text || "").slice(0, 5000) }; list.push(page); jSave(list); return page; }
  function jEdit(id, text) { var list = jList(); list.forEach(function (p) { if (p.id === id) { p.text = String(text || "").slice(0, 5000); p.edited = Date.now(); } }); jSave(list); }
  function jDel(id) { jSave(jList().filter(function (p) { return p.id !== id; })); }
  function jToday() { var d = iso(); return jList().filter(function (p) { return p.date === d; }); }
  // the guide's journal prompt for the day (2026-11-14: the path's guide says it, never Finn), tied to the day's lesson when there is one (its title is the lesson's own words)
  function jPrompt(L) {
    if (L && L.title) return t("today's story was “{t}”. what's one line from it you want to keep?", "la historia de hoy fue “{t}”. ¿qué frase de ella te quieres guardar?", { t: L.title.toLowerCase() });
    var d = new Date().getDate(), P = [
      ["what's one thing from today you don't want to forget?", "¿qué cosa de hoy no quieres olvidar?"],
      ["who showed up for you today, even in a small way?", "¿quién estuvo para ti hoy, aunque fuera en algo pequeño?"],
      ["what's sitting heavy right now? write it down and set it here.", "¿qué te pesa ahora mismo? escríbelo y déjalo aquí."],
      ["what made you smile today?", "¿qué te hizo sonreír hoy?"]
    ][d % 4];
    return t(P[0], P[1]);
  }

  // ── 3. rematch: wrong first picks, spaced 1, 3, 7 and 14 days apart (old app lib/missed.ts) ──
  var MKEY = "ih-missed", INTERVALS = [1, 3, 7, 14], MAX = 80;
  function mList() { var a = read(MKEY, []); return Array.isArray(a) ? a.filter(function (c) { return c && c.id && c.q && Array.isArray(c.o) && c.o.length > 1 && typeof c.a === "number" && /^\d{4}-\d{2}-\d{2}$/.test(c.due || ""); }) : []; }
  function mSave(list) { if (list.length > MAX) list = list.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, MAX); write(MKEY, list); }
  // a first try that slipped: back tomorrow (box 0). the same question missed again starts over.
  function noteMiss(c) {
    if (!c || !c.q || !c.o || c.o.length < 2) return;
    var id = c.id || ((c.door || "") + "|" + c.q).toLowerCase().slice(0, 160), list = mList(), had = list.filter(function (x) { return x.id === id; })[0];
    var card = { id: id, door: c.door || "", day: c.day || 0, title: c.title || "", q: String(c.q).slice(0, 400), o: c.o.map(function (x) { return String(x).slice(0, 300); }), a: c.a, why: String(c.why || "").slice(0, 400), box: 0, due: addDays(iso(), INTERVALS[0]), misses: (had ? had.misses : 0) + 1 };
    mSave(list.filter(function (x) { return x.id !== id; }).concat([card]));
  }
  function mDue(door, n) { var d = iso(); return mList().filter(function (c) { return (!door || !c.door || c.door === door) && c.due <= d; }).sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : b.misses - a.misses; }).slice(0, n || 5); }
  function mRecall(id, ok) {
    var d = iso(), list = mList(), c = list.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    if (!ok) { c.box = 0; c.due = addDays(d, INTERVALS[0]); c.misses++; }
    else { c.box++; if (c.box >= INTERVALS.length) list = list.filter(function (x) { return x !== c; }); else c.due = addDays(d, INTERVALS[c.box]); }
    mSave(list);
  }

  // ── 4. seasons and holy days (old app content/seasons.ts + content/couple.ts holiday dates) ──
  var SD = window.IH_SEASONS || { rows: [], en: {}, es: {}, doors: {}, ny: [], notesEn: {}, notesEs: {} };
  var GRACE = 7, OFFER = 7, NOTICE = 45; // 2026-11-14: only a holy day within ~45 days shows; further out, no card (no "coming up · sep 30")
  var HOME_DOOR = { olive: "CHRISTIANITY", angelus: "CATHOLIC", pomegranate: "JUDAISM", datepalm: "ISLAM", marigold: "HINDUISM", lotus: "BUDDHISM", nectar: "SIKHISM", wild: "SPIRITUAL" };
  function def(key) { var e = SD.en[key] || {}, s = SD.es[key] || {}; return isEs() ? s : e; }
  var SEASONS = SD.rows.map(function (r) { return { id: r.key + "-" + r.start.slice(0, 4), key: r.key, start: r.start, end: r.end, note: r.note, length: daysBetween(r.start, r.end) + 1, doors: SD.doors[r.key] || [] }; });
  function phaseOf(s, d) { if (d < s.start) return daysBetween(d, s.start) <= OFFER ? "soon" : "upcoming"; if (d <= s.end) return "active"; return daysBetween(s.end, d) <= GRACE ? "grace" : "past"; }
  function seasonDay(s, d) { return d < s.start ? 0 : d > s.end ? s.length : daysBetween(s.start, d) + 1; }
  var WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], WD_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MO = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], MO_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function monthDay(d) { return isEs() ? +d.slice(8, 10) + " " + MO_ES[+d.slice(5, 7) - 1] : MO[+d.slice(5, 7) - 1] + " " + +d.slice(8, 10); }
  function whenWords(today, date) {
    var n = daysBetween(today, date), wd = new Date(date + "T12:00:00Z").getUTCDay();
    if (isEs()) return n <= 0 ? "hoy" : n === 1 ? "mañana" : n < 7 ? "el " + WD_ES[wd] : n === 7 ? "en una semana" : "en " + n + " días";
    return n <= 0 ? "today" : n === 1 ? "tomorrow" : n < 7 ? WD[wd] : n === 7 ? "a week from today" : "in " + n + " days";
  }
  function noteDate(note, re) { var m = re.exec(note || ""); return m ? m[1] : null; }
  // the holy days themselves: each one's date is a row of the old data (a season's first or last day, the day before,
  // or a date written in that row's note). [season, at, en, es, note pattern]
  var HD = [
    ["lent", "start", "ash wednesday", "el miércoles de ceniza"], ["lent", "note", "easter", "la Pascua", /easter (\d{4}-\d\d-\d\d)/],
    ["advent", "start", "the first sunday of advent", "el primer domingo de Adviento"], ["advent", "end", "christmas eve", "la Nochebuena"],
    ["ramadan", "start", "the first day of ramadan", "el primer día del Ramadán"], ["ramadan", "note", "eid al-fitr", "Eid al-Fitr", /eid al-fitr (\d{4}-\d\d-\d\d)/],
    ["awe", "start", "rosh hashanah", "Rosh Hashaná"], ["awe", "end", "yom kippur", "Yom Kipur"],
    ["omer", "before", "passover", "Pésaj"], ["omer", "note", "shavuot", "Shavuot", /shavuot (\d{4}-\d\d-\d\d)/],
    ["navratri", "start", "the first night of navaratri", "la primera noche de Navaratri"], ["navratri", "note", "vijayadashami", "Vijayadashami", /vijayadashami (\d{4}-\d\d-\d\d)/],
    ["diwali", "note", "diwali", "Diwali", /lakshmi puja (\d{4}-\d\d-\d\d)/],
    ["vaisakhi", "end", "vaisakhi", "Vaisakhi"], ["gurpurab", "end", "guru nanak's gurpurab", "el Gurpurab de Guru Nanak"],
    ["vesak", "end", "vesak", "Vesak"], ["vassa", "start", "the first day of vassa", "el primer día de Vassa"],
    ["newyear", "start", "the new year", "el año nuevo"], ["solstice-june", "start", "the june solstice", "el solsticio de junio"], ["solstice-dec", "start", "the december solstice", "el solsticio de diciembre"]
  ];
  var HOLY = [];
  HD.forEach(function (h) {
    SEASONS.forEach(function (s) {
      if (s.key !== h[0]) return;
      var d = h[1] === "start" ? s.start : h[1] === "end" ? s.end : h[1] === "before" ? addDays(s.start, -1) : noteDate(s.note, h[4]);
      if (d) HOLY.push({ id: h[2].replace(/\W+/g, "-") + "-" + d, date: d, en: h[2], es: h[3], doors: s.doors, season: s.id });
    });
  });
  // holy days with no season row of their own (dates checked; never invented): Hanukkah 2026 begins at sundown Dec 4, through Dec 12
  [["hanukkah-2026-12-04", "2026-12-04", "the first night of hanukkah", "la primera noche de Janucá", ["JUDAISM"]]].forEach(function (x) { HOLY.push({ id: x[0], date: x[1], en: x[2], es: x[3], doors: x[4] }); });
  // the islamic new year comes from the old app's new-year list
  SD.ny.forEach(function (y) { if (y.door === "ISLAM") HOLY.push({ id: "islamic-new-year-" + y.date, date: y.date, en: y.name, es: y.es, doors: ["ISLAM"] }); });
  HOLY.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  function doorOf(home) { return HOME_DOOR[home] || null; }
  // the next holy day for ONE faith (today counts), within NOTICE days. never another faith's.
  function holyNext(home, d) {
    var door = doorOf(home); d = d || iso(); if (!door) return null;
    var h = HOLY.filter(function (x) { return x.doors.indexOf(door) >= 0 && x.date >= d && daysBetween(d, x.date) <= NOTICE; })[0];
    if (!h) return null;
    var later = HOLY.filter(function (x) { return x.doors.indexOf(door) >= 0 && x.date > h.date; })[0];
    return { id: h.id, date: h.date, name: isEs() ? h.es : h.en, away: daysBetween(d, h.date), when: whenWords(d, h.date), day: monthDay(h.date), season: h.season, next: later ? { name: isEs() ? later.es : later.en, day: monthDay(later.date) } : null };
  }
  function questProgress(s, lessonDates, restDates, d) {
    var L = {}, R = {}; (lessonDates || []).forEach(function (x) { L[x] = 1; }); (restDates || []).forEach(function (x) { R[x] = 1; });
    var openUntil = addDays(s.end, GRACE), stones = [], litOn = [];
    for (var i = 0; i < s.length; i++) { var x = addDays(s.start, i); if (x > d) stones.push("later"); else if (L[x]) { stones.push("lit"); litOn.push(x); } else if (R[x]) { stones.push("rest"); litOn.push(x); } else stones.push(x === d ? "today" : "missed"); }
    for (var y = addDays(s.end, 1); y <= d && y <= openUntil; y = addDays(y, 1)) { if (!L[y]) continue; var k = stones.indexOf("missed"); if (k < 0) break; stones[k] = "caught"; litOn.push(y); }
    var lit = litOn.length, missed = stones.filter(function (z) { return z === "missed"; }).length, finished = lit >= s.length;
    var left = d > openUntil ? 0 : daysBetween(d < s.start ? s.start : d, openUntil) + 1 - (L[d] ? 1 : 0);
    return { day: seasonDay(s, d), length: s.length, lit: lit, missed: missed, stones: stones, phase: phaseOf(s, d), finished: finished, finishedOn: finished ? litOn.sort()[s.length - 1] : null, toGo: s.length - lit, canStillFinish: !finished && s.length - lit <= left, openUntil: openUntil };
  }
  function seasonInfo(s) { var D = def(s.key); return { id: s.id, key: s.key, name: D.name, about: D.about, badge: D.badge, start: s.start, end: s.end, length: s.length, days: monthDay(s.start) + " – " + monthDay(s.end), note: s.note ? (isEs() ? SD.notesEs[s.note] : SD.notesEn[s.note]) || "" : "" }; }
  // the one quest card for Today, for ONE faith: a joined quest under way first, else an offer (soon or under way)
  function questCard(o) {
    var door = doorOf(o.home), d = o.today || iso(), quests = o.quests || {}; if (!door) return null;
    var near = SEASONS.filter(function (s) { return s.doors.indexOf(door) >= 0; }).map(function (s) { var x = Object.create(s); x.phase = phaseOf(s, d); return x; })
      .filter(function (s) { return s.phase === "soon" || s.phase === "active" || s.phase === "grace"; });
    for (var i = 0; i < near.length; i++) {
      var s = near[i], q = quests[s.id]; if (!q || !q.joined || s.phase === "soon") continue;
      var p = questProgress(s, o.lessonDates, o.restDates, d);
      if (p.finished && p.finishedOn && daysBetween(p.finishedOn, d) > 3) continue;
      if (!p.finished && s.phase === "grace" && !p.canStillFinish) continue;
      return { kind: "progress", s: seasonInfo(s), p: p, joined: true };
    }
    for (var j = 0; j < near.length; j++) {
      var s2 = near[j], q2 = quests[s2.id];
      if ((q2 && q2.declined) || s2.phase === "grace") continue;
      if (q2 && q2.joined) return { kind: "offer", s: seasonInfo(s2), joined: true, when: whenWords(d, s2.start) };
      if (s2.phase === "active" && d === s2.end) continue;
      return { kind: "offer", s: seasonInfo(s2), joined: false, when: whenWords(d, s2.start), day: seasonDay(s2, d), before: d < s2.start };
    }
    return null;
  }
  function seasonById(id) { return SEASONS.filter(function (s) { return s.id === id; })[0] || null; }
  // today's line: a question to sit with ("practice" people) or how people keep it (everyone else). never asks anyone to pray.
  function seasonLine(id, d, mode) { var s = seasonById(id); if (!s) return ""; var D = def(s.key), list = mode === "practice" ? D.ask : D.learn, k = Math.max(0, seasonDay(s, d < s.start ? s.start : d) - 1); return list[k % list.length]; }
  function datesMayVary() { return isEs() ? "las fechas pueden variar según la comunidad" : "dates may vary by community"; }

  // spanish words for the feelings loop and the two-minute reset (the English lists live in each app)
  var FEEL_ES = [["grief", /(muri[oó]|falleci|funeral|velorio|duelo|extra[nñ]o a|perd[ií] a (mi|mis|un|una))/i], ["angry", /(enoj|coraje|furios|rabia|odio|pelea|pele[eé]|discut|grit[eé]|explot[eé]|frustra|molest)/i], ["worry", /(preocup|ansi|estr[eé]s|miedo|asustad|nervios|p[aá]nico|no puedo dormir|diagn[oó]stic|enferm|dinero|deudas|trabajo|examen|resultados)/i], ["lost", /(perdid|estancad|vac[ií]|sol[oa]\b|soledad|confundid|prop[oó]sito|rumbo|triste|cansad|sin sentido)/i], ["good", /(bien|feliz|agradecid|incre[ií]ble|genial|bendecid|emocionad|alegr)/i]];
  var HARD_ES = /(grit[eé]|pele[eé]|discut[ií]|explot[eé]|perd[ií] la paciencia|me enoj[eé])/i;
  function feelEs(t) { for (var i = 0; i < FEEL_ES.length; i++) if (FEEL_ES[i][1].test(t)) return FEEL_ES[i][0]; return null; }

  window.IH4 = {
    feelEs: feelEs, hardEs: function (t) { return HARD_ES.test(t); },
    lang: lang, isEs: isEs, t: t, say: say, withLang: withLang, start: start, switchHTML: switchHTML, wireSwitch: wireSwitch, careHTML: careHTML, esc: esc, iso: iso, addDays: addDays,
    journal: { list: jList, add: jAdd, edit: jEdit, del: jDel, today: jToday, prompt: jPrompt, KEY: JKEY },
    rematch: { note: noteMiss, due: mDue, recall: mRecall, all: mList, KEY: MKEY, INTERVALS: INTERVALS },
    seasons: { holyNext: holyNext, questCard: questCard, questProgress: function (id, L, R, d) { var s = seasonById(id); return s ? questProgress(s, L, R, d || iso()) : null; }, info: function (id) { var s = seasonById(id); return s ? seasonInfo(s) : null; }, line: seasonLine, datesMayVary: datesMayVary, monthDay: monthDay, whenWords: whenWords, doorOf: doorOf, HOLY: HOLY, SEASONS: SEASONS }
  };
})();
