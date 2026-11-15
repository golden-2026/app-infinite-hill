/* Infinite Hill "remix": viewers choose how a film plays (music, energy, captions, finn, look).
   Shared by the story episodes (episodes/<id>/index.html, from engine.html) and the curriculum player (episodes/c/player.html).
   Presentation only: the story text and scripture lines never change. Nothing is sent anywhere.
   2026-11-08: "cinema" captions (huge Anton, one lime keyword) are the og style in both players; each player passes it as caps.og.
   Picks live on this phone in localStorage "ih-remix": { v: 1, all: true, fav: {...}, films: { <film>: {...} | { dc: true } } }.
     fav    = favourites, used on every film (when "all" is on)
     films  = a per-film override; { dc: true } means "director's cut" (ignore favourites for this film)
   Host API:
     var rx = IHRemix.create({ key, root, music: { list, og }, caps: { list: [[id, label]], og }, energy: true, finn: false,
       looks: { list, og, thumb: function (look) { return webp url } } | null, holy: { look, label } | null,
       finnSrc, apply: function (state, changedKeys) {} });
     rx.button (host places it), rx.state (current picks), rx.open(), rx.close(), rx.isOpen() */
(function () {
"use strict";
var KEY = "ih-remix";
var MUSIC_NAMES = { afrobeats: "afro", amapiano: "piano", trap: "trap", house: "house", drill: "drill", lofi: "lo-fi", dembow: "dembow", bhangra: "bhangra",
  gospel: "gospel", synthwave: "synth", cinematic: "epic", boombap: "boom bap", ukg: "garage", ambient: "float", dnb: "d&b", bhajanclub: "bhajan club",
  phonk: "phonk", jersey: "jersey", daf: "daf", claps: "claps", march: "march", heartbeat: "heartbeat", riqq: "riqq" };
var LOOK_NAMES = { original: "original", cinema: "cinema", popcinema: "pop cinema", neon: "neon", woodblock: "woodblock", glass: "stained glass", film35: "35mm",
  inkwash: "ink wash", popart: "pop art", afrofuture: "afrofuture", vhs: "vhs", ukiyo: "ukiyo-e" };
var ENERGY = [["chill", "chill"], ["og", "og"], ["hype", "hype"]];
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function load() {
  var d = null; try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (!d || typeof d !== "object") d = {};
  if (!d.fav || typeof d.fav !== "object") d.fav = {};
  if (!d.films || typeof d.films !== "object") d.films = {};
  if (d.all == null) d.all = true;
  d.v = 1; return d;
}
function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

var CSS = [
".rx-btn{position:absolute;z-index:7;display:inline-flex;align-items:center;gap:6px;border:0;cursor:pointer;background:#EEFF6A;color:#0A0A0A;",
"font:400 15px/1 Anton,Impact,'Arial Narrow Bold',sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:9px 12px 7px;border-radius:999px;",
"box-shadow:3px 3px 0 #0A0A0A,0 6px 18px rgba(0,0,0,.35);transform:rotate(-3deg);transition:transform .15s;-webkit-tap-highlight-color:transparent}",
".rx-btn:active{transform:rotate(-3deg) scale(.94)}.rx-btn svg{width:15px;height:15px;margin-top:-2px}",
".rx-btn.rx-on::after{content:'';position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:#F3EFE4;box-shadow:0 0 0 2px #0A0A0A}",
".rx-btn:focus-visible,.rx-sheet button:focus-visible{outline:3px solid #EEFF6A;outline-offset:3px}",
".rx-back{position:absolute;inset:0;z-index:20;background:rgba(5,6,12,.55);opacity:0;transition:opacity .25s;pointer-events:none}",
".rx-back.on{opacity:1;pointer-events:auto}",
".rx-sheet{position:absolute;left:0;right:0;bottom:0;z-index:21;max-height:82%;overflow-y:auto;overscroll-behavior:contain;background:#0A0A0A;color:#F3EFE4;",
"border-radius:24px 24px 0 0;box-shadow:0 -2px 0 #EEFF6A,0 -20px 60px rgba(0,0,0,.6);padding:10px 18px calc(18px + env(safe-area-inset-bottom,0px));",
"transform:translateY(104%);transition:transform .32s cubic-bezier(.2,1.1,.3,1);font-family:Manrope,'Segoe UI',system-ui,sans-serif;touch-action:pan-y;text-align:left}",
".rx-sheet.on{transform:none}",
".rx-grab{width:44px;height:5px;border-radius:3px;background:rgba(243,239,228,.3);margin:0 auto 12px}",
".rx-h{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}",
".rx-h h2{margin:0;font:400 46px/.9 Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.005em}.rx-h h2 b{font-weight:400;color:#EEFF6A}",
".rx-x{flex:none;width:38px;height:38px;border-radius:50%;border:0;background:#1d1d1d;color:#F3EFE4;display:grid;place-items:center;cursor:pointer}.rx-x svg{width:16px;height:16px}",
".rx-sub{margin:8px 0 2px;font:700 14px/1.4 Manrope,sans-serif;color:rgba(243,239,228,.72)}",
".rx-sec{margin-top:16px}.rx-lab{display:flex;align-items:center;gap:8px;font:800 11px/1 Manrope,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#EEFF6A;margin-bottom:9px}",
".rx-lab small{font-weight:700;letter-spacing:.04em;text-transform:none;color:rgba(243,239,228,.5);font-size:12px}",
".rx-chips{display:flex;flex-wrap:wrap;gap:7px}",
".rx-chip{position:relative;border:0;cursor:pointer;background:#1d1d1d;color:#F3EFE4;box-shadow:inset 0 0 0 2px #2c2c2c;border-radius:999px;padding:10px 14px;font:800 14px/1 Manrope,sans-serif;text-transform:lowercase}",
".rx-chip[aria-pressed=true]{background:#EEFF6A;color:#0A0A0A;box-shadow:2px 2px 0 #F3EFE4}",
".rx-chip .og{display:inline-block;margin-left:6px;font:400 10px/1 Anton,Impact,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:2px 4px 1px;border-radius:3px;background:#F3EFE4;color:#0A0A0A;vertical-align:1px}",
".rx-looks{display:flex;gap:9px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none}.rx-looks::-webkit-scrollbar{display:none}",
".rx-sw{flex:none;width:72px;border:0;background:none;color:#F3EFE4;padding:0;cursor:pointer;text-align:center;font:800 11.5px/1.15 Manrope,sans-serif;text-transform:lowercase}",
".rx-sw i{display:block;width:72px;height:96px;border-radius:12px;margin-bottom:6px;background:#1d1d1d center/cover no-repeat;box-shadow:inset 0 0 0 2px #2c2c2c}",
".rx-sw[aria-pressed=true] i{box-shadow:0 0 0 3px #EEFF6A,3px 3px 0 3px #F3EFE4}.rx-sw[aria-pressed=true]{color:#EEFF6A}",
".rx-sw[disabled]{cursor:default;opacity:.32}.rx-sw[disabled][aria-pressed=true]{opacity:1}",
".rx-holy{display:flex;align-items:center;gap:10px;background:#EEFF6A;color:#0A0A0A;border-radius:14px;padding:10px 12px;margin-bottom:10px;font:800 14px/1.32 Manrope,sans-serif}",
".rx-holy img{width:44px;height:44px;flex:none;object-fit:contain}",
".rx-foot{margin-top:18px;display:grid;gap:10px}",
".rx-all{display:flex;align-items:center;justify-content:space-between;gap:12px;border:0;background:#1d1d1d;color:#F3EFE4;border-radius:14px;padding:12px 14px;font:700 14px/1.3 Manrope,sans-serif;cursor:pointer;text-align:left}",
".rx-all .tg{flex:none;width:44px;height:26px;border-radius:999px;background:#3a3a3a;position:relative;transition:background .2s}",
".rx-all .tg::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#F3EFE4;transition:transform .2s}",
".rx-all[aria-pressed=true] .tg{background:#EEFF6A}.rx-all[aria-pressed=true] .tg::after{transform:translateX(18px);background:#0A0A0A}",
".rx-row{display:flex;gap:10px}",
".rx-done{flex:1;border:0;cursor:pointer;border-radius:999px;padding:15px 18px;background:#EEFF6A;color:#0A0A0A;font:800 16px/1 Manrope,sans-serif;box-shadow:0 5px 0 #b9c93a}",
".rx-reset{flex:1.3;border:0;cursor:pointer;border-radius:999px;padding:15px 12px;background:transparent;color:#F3EFE4;box-shadow:inset 0 0 0 2px rgba(243,239,228,.4);font:800 14px/1.1 Manrope,sans-serif}",
".rx-clear{justify-self:center;border:0;background:none;color:rgba(243,239,228,.55);font:700 12.5px Manrope,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:4px}",
".rx-toast{position:absolute;z-index:22;left:50%;top:calc(96px + env(safe-area-inset-top,0px));transform:translateX(-50%) rotate(-2deg);background:#EEFF6A;color:#0A0A0A;",
"font:400 18px/1 Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.04em;padding:9px 14px 7px;border-radius:6px;box-shadow:3px 3px 0 #0A0A0A;opacity:0;transition:opacity .25s;pointer-events:none;white-space:nowrap}",
".rx-toast.on{opacity:1}",
"@media (prefers-reduced-motion: reduce){.rx-sheet,.rx-back,.rx-btn{transition:none}}"
].join("");
var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/></svg>';
var XI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function create(o) {
  if (!document.getElementById("rx-css")) { var st = document.createElement("style"); st.id = "rx-css"; st.textContent = CSS; document.head.appendChild(st); }
  var root = o.root, film = String(o.key || "film");
  var music = o.music && o.music.list && o.music.list.length ? o.music : null;
  var caps = o.caps && o.caps.list && o.caps.list.length ? o.caps : null;
  var looks = o.looks && o.looks.list && o.looks.list.length ? o.looks : null;
  var holy = o.holy && looks ? o.holy : null;
  if (holy && looks.list.indexOf(holy.look) < 0 && holy.look !== "original") holy.look = looks.og;
  var OG = { music: music ? music.og : null, energy: "og", cap: caps ? caps.og : null, finn: true, look: looks ? looks.og : null };
  function valid(k, v) {
    if (v == null) return false;
    if (k === "music") return !!music && music.list.indexOf(v) >= 0;
    if (k === "cap") return !!caps && caps.list.some(function (c) { return c[0] === v; });
    if (k === "energy") return v === "og" || v === "chill" || v === "hype";
    if (k === "finn") return !!o.finn && typeof v === "boolean";
    if (k === "look") return !!looks && !holy && (v === "original" || looks.list.indexOf(v) >= 0);
    return false;
  }
  function compute() {
    var d = load(), mine = d.films[film] || {}, out = {};
    Object.keys(OG).forEach(function (k) {
      var v = OG[k];
      if (!mine.dc && d.all && valid(k, d.fav[k])) v = d.fav[k];
      if (valid(k, mine[k])) v = mine[k];
      out[k] = v;
    });
    if (holy) out.look = holy.look;
    return out;
  }
  function isRemixed(s) { return Object.keys(OG).some(function (k) { return s[k] !== OG[k]; }); }
  var state = compute();

  var btn = document.createElement("button");
  btn.className = "rx-btn"; btn.type = "button"; btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-label", "Remix this film");
  btn.innerHTML = ICON + "<span>remix</span>";
  var back = document.createElement("div"); back.className = "rx-back";
  var sheet = document.createElement("div"); sheet.className = "rx-sheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "Remix this film"); sheet.hidden = true;
  var toastEl = document.createElement("div"); toastEl.className = "rx-toast"; toastEl.setAttribute("role", "status");
  root.appendChild(back); root.appendChild(sheet); root.appendChild(toastEl);
  // the reel never scrolls; focusing inside the sheet must not nudge it sideways
  root.addEventListener("scroll", function () { if (root.scrollLeft || root.scrollTop) { root.scrollLeft = 0; root.scrollTop = 0; } });
  // the sheet is its own world: taps, swipes and arrow keys must not reach the film underneath
  [btn, sheet, back].forEach(function (el) { ["pointerdown", "pointerup", "pointermove", "click", "touchstart", "touchend", "keydown", "wheel"].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); if (ev === "keydown" && e.key === "Escape") close(); }, { passive: ev !== "keydown" && ev !== "click" }); }); });
  btn.addEventListener("click", function () { open(); });
  back.addEventListener("click", function () { close(); });

  function chip(k, v, label, isOg) { return '<button type="button" class="rx-chip" data-k="' + k + '" data-v="' + esc(v) + '" aria-pressed="' + (String(state[k]) === String(v)) + '">' + esc(label) + (isOg ? '<span class="og">og</span>' : '') + '</button>'; }
  function render() {
    var d = load(), h = '<div class="rx-grab"></div><div class="rx-h"><h2>remix <b>it.</b></h2><button type="button" class="rx-x" data-act="close" aria-label="Close">' + XI + '</button></div>' +
      '<p class="rx-sub">same story, your vibe. change it on any film. i’ll remember.</p>';
    if (music) h += '<div class="rx-sec"><div class="rx-lab">music' + (o.drumsOnly ? '<small>drums only on this one</small>' : '') + '</div><div class="rx-chips">' +
      music.list.map(function (g) { return chip("music", g, MUSIC_NAMES[g] || g, g === music.og); }).join("") + '</div></div>';
    h += '<div class="rx-sec"><div class="rx-lab">energy</div><div class="rx-chips">' + ENERGY.map(function (e) { return chip("energy", e[0], e[1], false); }).join("") + '</div></div>';
    if (caps) h += '<div class="rx-sec"><div class="rx-lab">captions</div><div class="rx-chips">' + caps.list.map(function (c) { return chip("cap", c[0], c[1], c[0] === caps.og); }).join("") + '</div></div>';
    if (o.finn) h += '<div class="rx-sec"><div class="rx-lab">finn<small>his little pop-ups</small></div><div class="rx-chips">' + chip("finn", "true", "on", false) + chip("finn", "false", "off", false) + '</div></div>';
    if (looks) {
      var all = ["original"].concat(looks.list);
      h += '<div class="rx-sec"><div class="rx-lab">look</div>' +
        (holy ? '<div class="rx-holy">' + (o.finnSrc ? '<img src="' + esc(o.finnSrc) + '" alt="">' : '') + '<span>' + esc(holy.label) + '</span></div>' : '') +
        '<div class="rx-looks">' + all.map(function (l) {
          var on = state.look === l, dis = holy && !on;
          return '<button type="button" class="rx-sw" data-k="look" data-v="' + esc(l) + '" aria-pressed="' + on + '"' + (dis ? ' disabled' : '') + '><i style="background-image:url(&quot;' + esc(looks.thumb(l)) + '&quot;)"></i>' + esc(LOOK_NAMES[l] || l) + (l === looks.og ? ' ·&nbsp;og' : '') + '</button>';
        }).join("") + '</div></div>';
    }
    h += '<div class="rx-foot"><button type="button" class="rx-all" data-act="all" aria-pressed="' + !!d.all + '"><span>use my picks on every film</span><span class="tg"></span></button>' +
      '<div class="rx-row"><button type="button" class="rx-reset" data-act="reset">reset to the director’s cut</button><button type="button" class="rx-done" data-act="close">done</button></div>' +
      '<button type="button" class="rx-clear" data-act="clear">forget all my picks</button></div>';
    sheet.innerHTML = h;
    revealLook();
  }
  function revealLook() { var row = sheet.querySelector(".rx-looks"), sw = row && row.querySelector('[aria-pressed="true"]');
    if (sw && sw.offsetLeft - row.offsetLeft + sw.offsetWidth > row.clientWidth) row.scrollLeft = sw.offsetLeft - row.offsetLeft - 24; }
  sheet.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.disabled) return;
    var act = b.dataset.act;
    if (act === "close") return close();
    var d = load();
    if (act === "all") { d.all = !d.all; save(d); return update([], "") ; }
    if (act === "reset") { d.films[film] = { dc: true }; save(d); return update(null, "director’s cut. as made."); }
    if (act === "clear") { d.fav = {}; d.films = {}; d.all = true; save(d); return update(null, "fresh start."); }
    var k = b.dataset.k; if (!k) return;
    var v = b.dataset.v; if (k === "finn") v = v === "true";
    if (!valid(k, v)) return;
    var mine = d.films[film] && !d.films[film].dc ? d.films[film] : (d.films[film] && d.films[film].dc ? { dc: true } : {});
    mine[k] = v; d.films[film] = mine; if (d.all) d.fav[k] = v; save(d);
    var label = k === "music" ? (MUSIC_NAMES[v] || v) : k === "look" ? (LOOK_NAMES[v] || v) : k === "cap" ? (caps.list.filter(function (c) { return c[0] === v; })[0] || [0, v])[1] : k === "finn" ? (v ? "finn’s back" : "finn’s chilling") : v === "og" ? "og energy" : v;
    update(null, k === "finn" ? label : label + (k === "energy" && v !== "og" ? " mode" : "") + ".");
  });
  function update(keys, msg) {
    var was = state; state = compute(); rx.state = state;
    var changed = Object.keys(OG).filter(function (k) { return was[k] !== state[k]; });
    var keepScroll = sheet.scrollTop; render(); sheet.scrollTop = keepScroll;
    btn.classList.toggle("rx-on", isRemixed(state));
    if (changed.length) { try { o.apply(state, changed); } catch (e) { if (window.console) console.warn("remix", e); } }
    if (msg) toast(msg);
  }
  function toast(m) { toastEl.textContent = m; toastEl.classList.add("on"); clearTimeout(toast.id); toast.id = setTimeout(function () { toastEl.classList.remove("on"); }, 1600); }
  var lastFocus = null;
  function open() { if (rx.isOpen()) return; render(); lastFocus = document.activeElement; sheet.hidden = false; void sheet.offsetWidth; revealLook(); sheet.classList.add("on"); back.classList.add("on");
    var f = sheet.querySelector(".rx-x") || sheet.querySelector("button"); setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} root.scrollLeft = 0; root.scrollTop = 0; }, 330); }
  function close() { if (!rx.isOpen()) return; sheet.classList.remove("on"); back.classList.remove("on"); setTimeout(function () { if (!sheet.classList.contains("on")) sheet.hidden = true; }, 340);
    try { (lastFocus && document.contains(lastFocus) ? lastFocus : btn).focus({ preventScroll: true }); } catch (e) {} }
  var rx = { button: btn, state: state, open: open, close: close, isOpen: function () { return sheet.classList.contains("on"); }, og: OG, names: { music: MUSIC_NAMES, look: LOOK_NAMES } };
  btn.classList.toggle("rx-on", isRemixed(state));
  return rx;
}
// which genres a film may offer: percussion-only for Muslim films; faith-specific genres only in their own faith
var FAITH_ONLY = { bhangra: ["marigold", "nectar", "wild"], gospel: ["olive", "angelus", "wild"], bhajanclub: ["marigold", "wild"] };
var MELODIC = ["afrobeats", "amapiano", "trap", "house", "drill", "lofi", "dembow", "bhangra", "gospel", "synthwave", "cinematic", "boombap", "ukg", "ambient", "dnb", "bhajanclub", "phonk", "jersey"];
var PERC = ["daf", "claps", "march", "heartbeat", "riqq"];
function genresFor(home, drumsOnly) {
  if (drumsOnly || home === "datepalm" || home === "islam") return PERC.slice();
  return MELODIC.filter(function (g) { return !FAITH_ONLY[g] || FAITH_ONLY[g].indexOf(home) >= 0; });
}
// tempo, swing and scale used when a viewer picks a genre the film wasn't built with (midpoints of build.mjs ranges)
var GENRE_FEEL = { afrobeats: [106, .1, "dorian"], amapiano: [111, .14, "minor"], trap: [143, 0, "harm"], house: [123, .04, "minor"], drill: [142, 0, "phrygian"],
  lofi: [80, .24, "dorian"], dembow: [99, 0, "minor"], bhangra: [102, .08, "mixo"], gospel: [92, .2, "major"], synthwave: [109, 0, "minor"], cinematic: [88, 0, "harm"],
  boombap: [90, .16, "minor"], ukg: [132, .22, "minor"], ambient: [68, 0, "pentmin"], dnb: [172, 0, "minor"], bhajanclub: [103, 0, "mixo"], phonk: [137, 0, "phrygian"],
  jersey: [141, 0, "dorian"], daf: [100, .08, null], claps: [104, .06, null], march: [90, 0, null], heartbeat: [66, 0, null], riqq: [111, .1, null] };
window.IHRemix = { create: create, genresFor: genresFor, feel: GENRE_FEEL, KEY: KEY };
})();
