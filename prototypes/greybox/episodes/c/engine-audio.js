/* Infinite Hill curriculum episodes: music + particle kinds.
   COPIED (not linked) from GB/episodes/engine.html on 2026-11-06 (lines 389-735 music, 774-818 particle kinds),
   so the other agent's engine can keep changing without breaking this player. Only this wrapper is new. */
window.IHEngine = function (ST, COLORS, g2) {
var DRUMS_ONLY = !!ST.drumsOnly, W = 390, H = 844;
function rng(seed) { var a = seed >>> 0 || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function glowSprite(c, core) { var s = document.createElement("canvas"); s.width = s.height = 64; var x = s.getContext("2d");
  var gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, core || c); gr.addColorStop(0.3, c + "cc"); gr.addColorStop(1, c + "00"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s; }
var sprites = COLORS.map(function (c) { return glowSprite(c); });
var whiteSprite = glowSprite("#FFF4D6", "#FFFFFF");
function pc() { return (Math.random() * COLORS.length) | 0; }
var ctx = null, master, musicBus, musicLP, verb, noiseBuf, droneGain, droneNodes = [];
function clock() { return ctx ? ctx.currentTime : performance.now() / 1000; }
var STATS = {};   // per-instrument hit counts (QA reads these to prove the music differs)
function initAudio() {
  if (ctx) return;
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { ctx = new AC(); } catch (e) { ctx = null; return; }
  master = ctx.createGain(); master.gain.value = 0.9;
  var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  master.connect(comp); comp.connect(ctx.destination);
  musicLP = ctx.createBiquadFilter(); musicLP.type = "lowpass"; musicLP.frequency.value = GEN.lp || 18000; musicLP.Q.value = 0.8;
  musicBus = ctx.createGain(); musicBus.gain.value = 0.62; musicBus.connect(musicLP); musicLP.connect(master);
  verb = ctx.createConvolver(); var len = ctx.sampleRate * (GEN.room || 1.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  verb.buffer = ir; var vg = ctx.createGain(); vg.gain.value = GEN.wet || 0.28; verb.connect(vg); vg.connect(musicBus);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var nd = noiseBuf.getChannelData(0); for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
  droneGain = ctx.createGain(); droneGain.gain.value = 0;
  if (GEN.drone && !DRUMS_ONLY) {
    // a harmonium-ish drone on the tonic and fifth
    var dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 1100; dlp.Q.value = 2;
    var lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.18; lfoG.gain.value = 380; lfo.connect(lfoG); lfoG.connect(dlp.frequency); lfo.start();
    var r = ROOT * 4;
    [r, r * 1.004, r * 1.5, r * 1.497, r * 2].forEach(function (f, k) {
      var o = ctx.createOscillator(); o.type = k % 2 ? "square" : "sawtooth"; o.frequency.value = f;
      var g = ctx.createGain(); g.gain.value = k === 4 ? 0.05 : 0.08; o.connect(g); g.connect(dlp); o.start(); droneNodes.push(o);
    });
    dlp.connect(droneGain); droneGain.connect(musicBus); var dv = ctx.createGain(); dv.gain.value = 0.3; droneGain.connect(dv); dv.connect(verb);
  }
}
function env(g, t, a, peak, dec) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
function osc(type, f, t, dur, out) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); var g = ctx.createGain(); o.connect(g); g.connect(out || musicBus); o.start(t); o.stop(t + dur + 0.05); return { o: o, g: g }; }
function noise(t, dur, type, freq, q, out) { var s = ctx.createBufferSource(); s.buffer = noiseBuf; var f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
  var g = ctx.createGain(); s.connect(f); f.connect(g); g.connect(out || musicBus); s.start(t, Math.random()); s.stop(t + dur + 0.05); return { s: s, f: f, g: g }; }
function filt(type, f, q) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 1; return b; }
function thru(o, node) { o.o.disconnect(); o.o.connect(node); node.connect(o.g); return o; }
function hold(g, t, a, peak, dur, rel) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel); }

var I = {
  /* drums */
  kick: function (t, v) { var a = osc("sine", 160, t, 0.5); a.o.frequency.exponentialRampToValueAtTime(42, t + 0.13); env(a.g, t, 0.003, 1.1 * v, 0.42); var c = noise(t, 0.02, "highpass", 3000, 0.7); env(c.g, t, 0.001, 0.25 * v, 0.02); },
  kickSoft: function (t, v) { var a = osc("sine", 120, t, 0.4); a.o.frequency.exponentialRampToValueAtTime(48, t + 0.1); env(a.g, t, 0.006, 0.8 * v, 0.3); },
  kick808: function (t, v) { var f = ROOT * 1.5; var a = osc("sine", f * 3, t, 1.1); a.o.frequency.exponentialRampToValueAtTime(f, t + 0.06); env(a.g, t, 0.003, 1.0 * v, 0.95);
    var c = noise(t, 0.015, "highpass", 2500, 0.7); env(c.g, t, 0.001, 0.2 * v, 0.015); },
  snare: function (t, v) { var n = noise(t, 0.22, "bandpass", 1900, 0.7); env(n.g, t, 0.001, 0.55 * v, 0.17); var a = osc("triangle", 200, t, 0.12); a.o.frequency.exponentialRampToValueAtTime(150, t + 0.08); env(a.g, t, 0.001, 0.35 * v, 0.09); },
  gated: function (t, v) { var n = noise(t, 0.36, "bandpass", 1700, 0.6); n.g.connect(verb); hold(n.g, t, 0.002, 0.5 * v, 0.24, 0.02); var a = osc("triangle", 180, t, 0.14); env(a.g, t, 0.001, 0.3 * v, 0.1); },
  rim: function (t, v) { var a = osc("square", 820, t, 0.04); thru(a, filt("bandpass", 1700, 3)); env(a.g, t, 0.001, 0.35 * v, 0.03); var n = noise(t, 0.03, "highpass", 3500, 1); env(n.g, t, 0.001, 0.2 * v, 0.02); },
  snap: function (t, v) { var n = noise(t, 0.06, "bandpass", 2600, 1.6); env(n.g, t, 0.001, 0.7 * v, 0.05); n.g.connect(verb); },
  clap: function (t, v) { for (var k = 0; k < 3; k++) { var n = noise(t + k * 0.011, 0.16, "bandpass", 1600, 1.2); env(n.g, t + k * 0.011, 0.001, 0.45 * v, k === 2 ? 0.16 : 0.02); if (k === 2) n.g.connect(verb); } },
  clapStack: function (t, v) { I.clap(t, v); I.clap(t + 0.018, v * 0.7); var n = noise(t, 0.3, "bandpass", 1100, 0.8); env(n.g, t, 0.002, 0.25 * v, 0.25); n.g.connect(verb); },
  hatC: function (t, v) { var n = noise(t, 0.04, "highpass", 8200, 0.9); env(n.g, t, 0.001, 0.2 * v, 0.03); },
  hatO: function (t, v) { var n = noise(t, 0.3, "highpass", 7200, 0.8); env(n.g, t, 0.002, 0.16 * v, 0.24); },
  shaker: function (t, v) { var n = noise(t, 0.05, "highpass", 7500, 0.8); env(n.g, t, 0.003, 0.14 * v, 0.04); },
  conga: function (t, v) { var a = osc("sine", 340, t, 0.25); a.o.frequency.exponentialRampToValueAtTime(300, t + 0.05); env(a.g, t, 0.002, 0.45 * v, 0.17); var n = noise(t, 0.02, "bandpass", 1200, 1); env(n.g, t, 0.001, 0.15 * v, 0.015); },
  congaLo: function (t, v) { var a = osc("sine", 215, t, 0.3); a.o.frequency.exponentialRampToValueAtTime(190, t + 0.06); env(a.g, t, 0.002, 0.5 * v, 0.22); },
  agogo: function (t, v) { var f = (STATS.agogo || 0) % 2 ? 587 : 880; var a = osc("square", f, t, 0.2); thru(a, filt("bandpass", f * 1.4, 4)); env(a.g, t, 0.001, 0.22 * v, 0.16); },
  timbale: function (t, v) { var a = osc("triangle", 520, t, 0.2); env(a.g, t, 0.001, 0.4 * v, 0.14); var n = noise(t, 0.05, "bandpass", 4000, 2); env(n.g, t, 0.001, 0.2 * v, 0.04); },
  taiko: function (t, v) { var a = osc("sine", 95, t, 0.9); a.o.frequency.exponentialRampToValueAtTime(52, t + 0.18); env(a.g, t, 0.003, 1.1 * v, 0.75); var n = noise(t, 0.3, "lowpass", 380, 1); env(n.g, t, 0.002, 0.5 * v, 0.25); n.g.connect(verb); },
  tom: function (t, v) { var a = osc("sine", 170, t, 0.4); a.o.frequency.exponentialRampToValueAtTime(110, t + 0.16); env(a.g, t, 0.002, 0.6 * v, 0.3); },
  dagga: function (t, v) { var a = osc("sine", 118, t, 0.4); a.o.frequency.exponentialRampToValueAtTime(58, t + 0.09); env(a.g, t, 0.002, 0.9 * v, 0.32);
    var b = osc("triangle", 180, t, 0.2); b.o.frequency.exponentialRampToValueAtTime(90, t + 0.06); env(b.g, t, 0.002, 0.25 * v, 0.12);
    var n = noise(t, 0.08, "lowpass", 900, 1); env(n.g, t, 0.001, 0.4 * v, 0.07); },
  tilli: function (t, v) { var n = noise(t, 0.1, "bandpass", 2600, 1.4); env(n.g, t, 0.001, 0.55 * v, 0.07); n.g.connect(verb); var a = osc("sine", 540, t, 0.08); env(a.g, t, 0.001, 0.18 * v, 0.05); },
  na: function (t, v) { var a = osc("sine", 690, t, 0.4); env(a.g, t, 0.002, 0.32 * v, 0.28); var b = osc("sine", 1380, t, 0.2); env(b.g, t, 0.002, 0.1 * v, 0.12); a.g.connect(verb); },
  ge: function (t, v) { var a = osc("sine", 82, t, 0.6); a.o.frequency.linearRampToValueAtTime(118, t + 0.32); env(a.g, t, 0.004, 0.75 * v, 0.5); },
  /* frame drum family (the only sounds a percussion-only episode may use, with claps and shaker) */
  dum: function (t, v) { var f = ROOT * 2.2; var a = osc("sine", f * 1.3, t, 0.6); a.o.frequency.exponentialRampToValueAtTime(f, t + 0.05); env(a.g, t, 0.003, 0.95 * v, 0.45);
    var n = noise(t, 0.12, "lowpass", 260, 1); env(n.g, t, 0.002, 0.45 * v, 0.1); a.g.connect(verb); },
  dumBig: function (t, v) { var f = ROOT * 1.6; var a = osc("sine", f * 1.6, t, 2.0); a.o.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.4); env(a.g, t, 0.004, 1.2 * v, 1.7);
    var n = noise(t, 0.6, "lowpass", 300, 0.8); env(n.g, t, 0.003, 0.7 * v, 0.5); n.g.connect(verb); },
  tek: function (t, v) { var n = noise(t, 0.06, "bandpass", ROOT * 40, 2.2); env(n.g, t, 0.001, 0.55 * v, 0.05); var a = osc("sine", ROOT * 12, t, 0.05); env(a.g, t, 0.001, 0.18 * v, 0.035); },
  jingle: function (t, v) { for (var k = 0; k < 3; k++) { var n = noise(t + k * 0.009, 0.08, "highpass", 9000, 1.5); env(n.g, t + k * 0.009, 0.001, 0.12 * v, 0.07); } },
  /* fx */
  crash: function (t, v) { var n = noise(t, 2.2, "highpass", 4500, 0.6); env(n.g, t, 0.002, 0.5 * v, 2.0); n.g.connect(verb); },
  boom: function (t, v) { var a = osc("sine", 70, t, 2.4); a.o.frequency.exponentialRampToValueAtTime(28, t + 1.8); env(a.g, t, 0.004, 1.2 * v, 2.2); var n = noise(t, 1.2, "lowpass", 400, 0.7); env(n.g, t, 0.003, 0.7 * v, 1.1); },
  crack: function (t, v) { var n = noise(t, 0.3, "highpass", 1200, 0.9); env(n.g, t, 0.001, 0.8 * v, 0.22); n.g.connect(verb); var b = noise(t, 0.6, "lowpass", 200, 1); env(b.g, t, 0.003, 0.9 * v, 0.55); },
  vinyl: function (t, v) { var n = noise(t, 0.01, "highpass", 3000, 1); env(n.g, t, 0.001, 0.08 * v, 0.008); },
  riser: function (t, dur) { var n = noise(t, dur, "bandpass", 300, 5); n.f.frequency.setValueAtTime(300, t); n.f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    n.g.gain.setValueAtTime(0.0001, t); n.g.gain.exponentialRampToValueAtTime(0.4, t + dur); n.g.gain.setValueAtTime(0.0001, t + dur + 0.01); },
  sweep: function (t, dur) { var a = osc("sawtooth", ROOT * 2, t, dur); a.o.frequency.exponentialRampToValueAtTime(ROOT * 16, t + dur); a.g.gain.setValueAtTime(0.0001, t); a.g.gain.exponentialRampToValueAtTime(0.05, t + dur); a.g.gain.setValueAtTime(0.0001, t + dur + 0.01); },
  /* bass */
  sub808: function (t, f, dur, v, to) { var a = osc("sine", f, t, dur + 0.15); if (to) a.o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.9);
    var ws = ctx.createWaveShaper(), cv = new Float32Array(256); for (var i = 0; i < 256; i++) { var x = i / 128 - 1; cv[i] = Math.tanh(x * 2.2); } ws.curve = cv; thru(a, ws); hold(a.g, t, 0.005, 0.7 * v, dur, 0.08); },
  sawb: function (t, f, dur, v) { var a = osc("sawtooth", f, t, dur + 0.1); var lp = filt("lowpass", 900, 1); lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(160, t + dur); thru(a, lp); env(a.g, t, 0.006, 0.32 * v, dur);
    var s = osc("sine", f, t, dur + 0.1); env(s.g, t, 0.006, 0.55 * v, dur); },
  pluckb: function (t, f, dur, v) { var a = osc("triangle", f, t, 0.4); var lp = filt("lowpass", 1400, 2); lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(200, t + 0.2); thru(a, lp); env(a.g, t, 0.003, 0.7 * v, Math.min(dur, 0.3)); },
  reese: function (t, f, dur, v) { var lp = filt("lowpass", 520, 1.4), g = ctx.createGain(); lp.connect(g); g.connect(musicBus);
    var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.7; lg.gain.value = 260; l.connect(lg); lg.connect(lp.frequency); l.start(t); l.stop(t + dur + 0.1);
    [0.993, 1.007].forEach(function (d) { var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f * d; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
    hold(g, t, 0.01, 0.26 * v, dur, 0.05); var s = osc("sine", f, t, dur + 0.1); hold(s.g, t, 0.01, 0.4 * v, dur, 0.05); },
  sineb: function (t, f, dur, v) { var s = osc("sine", f, t, dur + 0.2); hold(s.g, t, 0.02, 0.6 * v, dur, 0.1); var h = osc("triangle", f * 2, t, dur + 0.2); hold(h.g, t, 0.02, 0.06 * v, dur, 0.1); },
  organb: function (t, f, dur, v) { [1, 2, 3].forEach(function (m, k) { var s = osc("sine", f * m, t, dur + 0.1); hold(s.g, t, 0.01, [0.5, 0.22, 0.1][k] * v, dur, 0.06); }); },
  logd: function (t, f, dur, v) { var a = osc("sine", f * 2, t, 0.6); a.o.frequency.setValueAtTime(f * 3.2, t); a.o.frequency.exponentialRampToValueAtTime(f * 2, t + 0.03); env(a.g, t, 0.002, 0.8 * v, 0.42);
    var b = osc("triangle", f * 4, t, 0.2); env(b.g, t, 0.002, 0.12 * v, 0.1); },
  /* leads */
  reed: function (t, f, dur, v) { var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(); o1.type = "square"; o2.type = "sawtooth"; o1.frequency.value = f; o2.frequency.value = f * 1.004;
    var vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.6; vg.gain.value = f * 0.012; vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
    var bp = filt("bandpass", 1500, 1.1); var g = ctx.createGain(); o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(musicBus); g.connect(verb);
    hold(g, t, 0.03, 0.15 * v, dur * 0.85, dur * 0.15); [o1, o2, vib].forEach(function (o) { o.start(t); o.stop(t + dur + 0.05); }); },
  marimba: function (t, f, dur, v) { var a = osc("sine", f, t, 0.6); env(a.g, t, 0.002, 0.32 * v, 0.45); var b = osc("sine", f * 4, t, 0.2); env(b.g, t, 0.001, 0.08 * v, 0.08); a.g.connect(verb); },
  bell: function (t, f, dur, v) { var c = osc("sine", f, t, 1.6), m = ctx.createOscillator(), mg = ctx.createGain(); m.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 1.2);
    m.connect(mg); mg.connect(c.o.frequency); m.start(t); m.stop(t + 1.7); env(c.g, t, 0.002, 0.2 * v, 1.4); c.g.connect(verb); },
  epiano: function (t, f, dur, v) { var c = osc("sine", f, t, 1.4), m = ctx.createOscillator(), mg = ctx.createGain(); m.frequency.value = f; mg.gain.setValueAtTime(f * 0.9, t); mg.gain.exponentialRampToValueAtTime(f * 0.02, t + 0.5);
    m.connect(mg); mg.connect(c.o.frequency); m.start(t); m.stop(t + 1.5); env(c.g, t, 0.003, 0.22 * v, Math.max(0.5, Math.min(1.2, dur * 1.5))); c.g.connect(verb); },
  organ: function (t, f, dur, v) { [1, 2, 3, 4].forEach(function (m, k) { var s = osc("sine", f * m, t, dur + 0.1); hold(s.g, t, 0.01, [0.12, 0.08, 0.05, 0.03][k] * v, dur, 0.05); if (!k) s.g.connect(verb); }); },
  brass: function (t, f, dur, v) { var lp = filt("lowpass", 400, 2), g = ctx.createGain(); lp.connect(g); g.connect(musicBus); g.connect(verb);
    lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(2600, t + 0.07); lp.frequency.exponentialRampToValueAtTime(1300, t + 0.3);
    [1, 1.006, 0.5].forEach(function (d) { var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f * d; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
    hold(g, t, 0.03, 0.09 * v, dur, 0.08); },
  tumbi: function (t, f, dur, v) { var a = osc("square", f * 1.04, t, 0.3); a.o.frequency.exponentialRampToValueAtTime(f, t + 0.03); thru(a, filt("bandpass", 2600, 3)); env(a.g, t, 0.001, 0.5 * v, 0.2); a.g.connect(verb); },
  arp: function (t, f, dur, v) { var a = osc("sawtooth", f, t, 0.3); var lp = filt("lowpass", 3200, 3); lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.18); thru(a, lp); env(a.g, t, 0.002, 0.14 * v, 0.2); a.g.connect(verb); },
  piano: function (t, f, dur, v) { var a = osc("triangle", f, t, 1.4); env(a.g, t, 0.002, 0.3 * v, 1.1); var b = osc("sine", f * 2, t, 0.8); env(b.g, t, 0.002, 0.1 * v, 0.6); var c = osc("sine", f * 3, t, 0.4); env(c.g, t, 0.002, 0.04 * v, 0.3); a.g.connect(verb); },
  chop: function (t, f, dur, v) { var g = ctx.createGain(); g.connect(musicBus); g.connect(verb); [700, 1150].forEach(function (fm) { var bp = filt("bandpass", fm, 6); bp.connect(g); var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(bp); o.start(t); o.stop(t + 0.25); });
    env(g, t, 0.005, 0.5 * v, 0.17); },
  cowbell: function (t, f, dur, v) { var g = ctx.createGain(), bp = filt("bandpass", f * 2.2, 2); bp.connect(g); g.connect(musicBus); [1, 1.48].forEach(function (m) { var o = ctx.createOscillator(); o.type = "square"; o.frequency.value = f * m; o.connect(bp); o.start(t); o.stop(t + 0.4); });
    env(g, t, 0.001, 0.32 * v, 0.3); },
  pluck: function (t, f, dur, v) { var a = osc("sawtooth", f, t, 0.35); var lp = filt("lowpass", 3800, 1); lp.frequency.setValueAtTime(3800, t); lp.frequency.exponentialRampToValueAtTime(300, t + 0.22); thru(a, lp); env(a.g, t, 0.002, 0.18 * v, 0.26); a.g.connect(verb); },
  glass: function (t, f, dur, v) { var a = osc("sine", f, t, 2); env(a.g, t, 0.004, 0.18 * v, 1.7); var b = osc("sine", f * 2.76, t, 1); env(b.g, t, 0.003, 0.05 * v, 0.8); a.g.connect(verb); b.g.connect(verb); },
  flute: function (t, f, dur, v) { var a = osc("sine", f, t, dur + 0.1); var vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5; vg.gain.value = f * 0.008; vib.connect(vg); vg.connect(a.o.frequency); vib.start(t); vib.stop(t + dur + 0.1);
    hold(a.g, t, 0.06, 0.2 * v, dur, 0.08); a.g.connect(verb); var n = noise(t, dur, "bandpass", f * 2, 4); hold(n.g, t, 0.05, 0.04 * v, dur, 0.05); },
  /* pads: (t, freqs, dur, v) */
  warm: function (t, fs, dur, v) { var lp = filt("lowpass", 900, 0.7), g = ctx.createGain(); lp.connect(g); g.connect(musicBus); g.connect(verb);
    fs.forEach(function (f) { [0.996, 1.004].forEach(function (d) { var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f * d; o.connect(lp); o.start(t); o.stop(t + dur + 0.6); }); });
    hold(g, t, 0.4, 0.035 * v, dur, 0.5); },
  strings: function (t, fs, dur, v) { var lp = filt("lowpass", 1900, 0.6), g = ctx.createGain(); lp.connect(g); g.connect(musicBus); g.connect(verb);
    fs.forEach(function (f) { [0.994, 1, 1.006].forEach(function (d) { var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f * d; o.connect(lp); o.start(t); o.stop(t + dur + 0.8); }); });
    hold(g, t, 0.6, 0.026 * v, dur, 0.7); },
  choir: function (t, fs, dur, v) { var g = ctx.createGain(); g.connect(musicBus); g.connect(verb); var b1 = filt("bandpass", 620, 5), b2 = filt("bandpass", 1050, 6); b1.connect(g); b2.connect(g);
    fs.forEach(function (f) { var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(b1); o.connect(b2); var vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 4.5 + Math.random(); vg.gain.value = f * 0.006; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.8); o.start(t); o.stop(t + dur + 0.8); });
    hold(g, t, 0.5, 0.2 * v, dur, 0.6); },
  organpad: function (t, fs, dur, v) { fs.forEach(function (f) { I.organ(t, f, dur, 0.55 * v); }); },
  glasspad: function (t, fs, dur, v) { var g = ctx.createGain(); g.connect(musicBus); g.connect(verb); fs.forEach(function (f) { var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * 2; o.connect(g); o.start(t); o.stop(t + dur + 1);
    var o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = f * 4.003; var g2b = ctx.createGain(); g2b.gain.value = 0.25; o2.connect(g2b); g2b.connect(g); o2.start(t); o2.stop(t + dur + 1); });
    hold(g, t, 0.9, 0.05 * v, dur, 0.9); }
};
var PERC_OK = { dum: 1, dumBig: 1, tek: 1, jingle: 1, clap: 1, clapStack: 1, shaker: 1 };
function play(name) {
  if (!ctx || !I[name]) return;
  if (DRUMS_ONLY && !PERC_OK[name]) return;      // percussion-only episodes: frame drum, claps and shaker, nothing else
  STATS[name] = (STATS[name] || 0) + 1;
  try { I[name].apply(null, [].slice.call(arguments, 1)); } catch (e) {}
}

/* ---------- genres ----------
   Pattern strings are 16 (or 32) steps. Velocity: . rest, - soft, o mid, x full, X accent.
   Bass: x root, 5 fifth, 8 octave, 3 third, 7 seventh (scale degrees), - holds the note.
   Tracks: k kick, s snare/clap, h hat, H open hat, p perc, q perc 2, c chord stab, b bass. l = lead rhythm (32 steps). */
var SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixo: [0, 2, 4, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11], phrydom: [0, 1, 4, 5, 7, 8, 10], pentmin: [0, 3, 5, 7, 10], pentmaj: [0, 2, 4, 7, 9], lydian: [0, 2, 4, 6, 7, 9, 11] };
var GENRES = {
  afrobeats: { kit: { k: "kick", s: "rim", h: "shaker", p: "conga", q: "agogo" }, bass: "pluckb", lead: "marimba", pad: "warm", padLv: [0.6, 0.4, 0.3], prog: [0, 5, 3, 4], leadIn: [3], stab: "marimba",
    m1: { k: "x.........x.....", p: "....o.....o..o..", h: "-.-.-.-.-.-.-.-.", b: "x---------5-----" },
    m2: { k: "x..x......x.....", s: "....x.......x...", h: "o-o-o-o-o-o-o-o-", p: "..o..o....o..o.o", b: "x..x..5...x..8.." },
    m3: { k: "x..x..x...x..x..", s: "....x..x....x...", h: "xoxoxoxoxoxoxoxo", p: "..o.xo...o.xo..o", q: "x..x..x...x.x...", b: "x..x..5.x..x.8.." },
    l: "x..x..x.x...x...x..x..x...x.x...", roll: "conga", drop: ["boom", "crash", "kick"] },
  amapiano: { kit: { k: "kickSoft", s: "clap", h: "shaker", p: "rim", q: "hatO" }, bass: "logd", lead: "epiano", pad: "warm", padLv: [0.7, 0.5, 0.4], prog: [0, 5, 2, 6], leadIn: [1, 3], stab: "epiano",
    m1: { h: "-.-.o.-.-.-.o.-.", c: "x.......x.......", b: "x.......x......." },
    m2: { k: "x...x...x...x...", h: "-o-o-o-o-o-o-o-o", p: "..x.....x..x....", c: "x.....x.........", b: "x..x...x.x..x..." },
    m3: { k: "x...x...x...x...", s: "....x.......x...", h: "xoxoxoxoxoxoxoxo", p: "..x..x..x..x..x.", q: "..o...o...o...o.", c: "x.....x.......x.", b: "x..x...x.x..x..5" },
    l: "x.......x...x.......x...x...x...", roll: "rim", drop: ["boom", "crash", "kickSoft"] },
  trap: { kit: { k: "kick808", s: "snap", h: "hatC", p: "clap", q: "hatO" }, bass: "sub808", glide: true, lead: "bell", pad: "glasspad", padLv: [0.9, 0.6, 0.5], prog: [0, 5, 3, 6], leadIn: [1, 3], scale: "harm",
    m1: { h: "x...x...x...x...", b: "x---------------" },
    m2: { k: "x.......x..x....", s: "........x.......", h: "xxxxxxxxxxxxxxxx", b: "x-------x--x----" },
    m3: { k: "x.....x...x.x...", s: "........x.......", p: "........x.......", h: "x.xxx.x.xxxxx.xx", q: "......x.........", b: "x-----x---x-x---" },
    l: "x.......x.......x...x...x.......", roll: "hatC", drop: ["kick808", "crash", "boom"] },
  house: { kit: { k: "kick", s: "clap", h: "hatC", p: "hatO", q: "shaker" }, bass: "sawb", lead: "organ", pad: "organpad", padLv: [0.5, 0.3, 0], prog: [0, 3, 4, 3], leadIn: [], stab: "organ",
    m1: { h: "..-...-...-...-.", c: "x...............", b: "x---------------" },
    m2: { k: "x...x...x...x...", h: "..x...x...x...x.", q: "xoxoxoxoxoxoxoxo", b: "..x...x...x...x." },
    m3: { k: "x...x...x...x...", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", p: "..x...x...x...x.", c: "..x..x....x..x..", b: "..x...x...x.5.x." },
    l: "x.x...x...x.x...x.x...x...x.x...", roll: "clap", drop: ["kick", "crash", "boom"] },
  drill: { kit: { k: "kick808", s: "snare", h: "hatC", p: "rim", q: "snap" }, bass: "sub808", glide: true, lead: "strings_lead", pad: "strings", padLv: [0.8, 0.6, 0.4], prog: [0, 1, 5, 4], leadIn: [2, 3], scale: "phrygian",
    m1: { h: "x..x..x.x..x..x.", b: "x---------------" },
    m2: { k: "x.....x.........", s: "........x.......", h: "x..x..x.x..x..x.", b: "x-----x---------" },
    m3: { k: "x.....x...x...x.", s: "....x.......x..x", h: "x..x..xxx..x..x.", p: "...x.......x....", b: "x-----x-3-x---5-" },
    l: "x..x..x...x.....x..x..x...x.x...", roll: "hatC", drop: ["kick808", "crash", "snare"] },
  lofi: { kit: { k: "kickSoft", s: "rim", h: "hatC", p: "vinyl", q: "shaker" }, bass: "sineb", lead: "epiano", pad: "warm", padLv: [0.8, 0.6, 0.5], prog: [1, 4, 0, 5], leadIn: [1, 2, 3], lp: 3400, swing: 1, stab: "epiano", sev: true,
    m1: { p: "x.....x....x....", c: "x...............", b: "x-------5-------" },
    m2: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", p: "x.....x....x....", b: "x-----5-x-------" },
    m3: { k: "x.....x.x.x.....", s: "....x.......x..o", h: "x.xox.x.x.xox.x.", p: "x.....x....x....", c: "x.......x.......", b: "x-----5-x---3---" },
    l: "x...x.....x.......x...x.x.......", roll: "hatC", drop: ["kickSoft", "crash"] },
  dembow: { kit: { k: "kick", s: "snare", h: "hatC", p: "timbale", q: "shaker" }, bass: "sawb", lead: "brass", pad: "", padLv: [0, 0, 0], prog: [0, 5, 6, 4], leadIn: [3],
    m1: { p: "...x..x....x..x.", b: "x-------x-------" },
    m2: { k: "x...x...x...x...", s: "...x..x....x..x.", h: "x.x.x.x.x.x.x.x.", b: "x..x..x.x..x..x." },
    m3: { k: "x...x...x...x...", s: "...x..x....x..x.", h: "xxxxxxxxxxxxxxxx", p: "..o...o...o...o.", q: "x.x.x.x.x.x.x.x.", b: "x..x..x.x..x..5." },
    l: "x.x.x...x.x.x...x.x.x...x...x...", roll: "timbale", drop: ["boom", "crash", "kick"] },
  bhangra: { kit: { k: "dagga", s: "clap", h: "shaker", p: "tilli", q: "na" }, bass: "sineb", lead: "tumbi", pad: "", padLv: [0, 0, 0], prog: [0, 0, 6, 4], leadIn: [2, 3], scale: "mixo",
    m1: { k: "x.......x.......", p: "....x.......x...", b: "x---------------" },
    m2: { k: "x..x..x.x..x..x.", p: "..x..x....x..x..", h: "-o-o-o-o-o-o-o-o", b: "x.......x......." },
    m3: { k: "x..x..x.x..x..x.", s: "....x.......x...", p: "..x..x.x..x..x.x", h: "xoxoxoxoxoxoxoxo", q: "......x.......x.", b: "x..x....x..x...." },
    l: "x.xxx.x.x.xxx.x.x.x.x.x.x.x.x...", roll: "tilli", drop: ["dagga", "crash", "boom"] },
  gospel: { kit: { k: "kick", s: "clapStack", h: "hatC", p: "tom", q: "shaker" }, bass: "organb", lead: "organ", pad: "choir", padLv: [0.9, 0.7, 0.6], prog: [0, 3, 4, 3], leadIn: [3], swing: 1, sev: true,
    m1: { c: "x.......x.......", b: "x-------x-------" },
    m2: { k: "x.......x.......", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", b: "x---x---5---x---" },
    m3: { k: "x..x....x.x.....", s: "....X.......X...", h: "xoxoxoxoxoxoxoxo", p: "..............xx", c: "..x.......x.....", b: "x--x---5x-x-8---" },
    l: "x...x.x.x.......x...x.x.x...x...", roll: "tom", drop: ["clapStack", "crash", "kick"] },
  synthwave: { kit: { k: "kick", s: "gated", h: "hatC", p: "tom", q: "hatO" }, bass: "sawb", lead: "arp", arp: true, pad: "strings", padLv: [0.8, 0.6, 0.6], prog: [0, 5, 2, 6], leadIn: [2, 3], scale: "minor",
    m1: { b: "x---------------" },
    m2: { k: "x.......x.......", h: "x.x.x.x.x.x.x.x.", b: "x.x.x.x.x.x.x.x." },
    m3: { k: "x...x...x...x...", s: "....x.......x...", h: "xxxxxxxxxxxxxxxx", q: "..x...x...x...x.", b: "x.x.x.x.8.x.x.x." },
    l: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", roll: "tom", drop: ["boom", "crash", "gated"] },
  cinematic: { kit: { k: "taiko", s: "snare", h: "", p: "tom", q: "crack" }, bass: "sineb", lead: "brass", pad: "strings", padLv: [1, 0.9, 0.8], prog: [0, 5, 2, 6], leadIn: [3], scale: "harm", room: 3,
    m1: { k: "x...............", b: "x---------------" },
    m2: { k: "x.......x.......", p: "....x..x....x.x.", b: "x-------x-------" },
    m3: { k: "x..x..x.x.......", s: "....x.......x.xx", p: "..x...x...x.xxxx", b: "x-------5-------" },
    l: "x-------x...x...x-------x.x.x...", roll: "tom", drop: ["taiko", "boom", "crash"] },
  boombap: { kit: { k: "kick", s: "snare", h: "hatC", p: "vinyl", q: "shaker" }, bass: "sineb", lead: "piano", pad: "", padLv: [0, 0, 0], prog: [0, 3, 5, 4], leadIn: [2, 3], swing: 1, lp: 7000, sev: true,
    m1: { p: "x.....x....x....", h: "x...x...x...x...", b: "x-------5-------" },
    m2: { k: "x......xx.......", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", b: "x------xx-------" },
    m3: { k: "x......xx.x.....", s: "....x.......x...", h: "x.x.x.xox.x.x.xo", p: "x.....x....x....", b: "x------xx-5-----" },
    l: "x.....x.x.......x...x.....x.....", roll: "snare", drop: ["kick", "crash", "snare"] },
  ukg: { kit: { k: "kick", s: "snare", h: "hatC", p: "rim", q: "shaker" }, bass: "reese", lead: "chop", pad: "organpad", padLv: [0.6, 0.4, 0], prog: [0, 5, 3, 4], leadIn: [2, 3], swing: 1, stab: "organ", sev: true,
    m1: { h: "..-...-...-...-.", c: "x.......", b: "x---------------" },
    m2: { k: "x.........x.....", h: "..x.x.x...x.x.x.", p: "......x.......x.", b: "x---------x-----" },
    m3: { k: "x.........x..x..", s: "....x.......x...", h: "x.xxx.x.x.xxx.x.", p: "......x.......x.", c: "...x.....x......", b: "x-----x---x--x--" },
    l: "..x..x....x..x....x..x.x..x.....", roll: "rim", drop: ["kick", "crash", "boom"] },
  ambient: { kit: { k: "kickSoft", s: "", h: "shaker", p: "tom", q: "" }, bass: "sineb", lead: "glass", pad: "glasspad", padLv: [1, 1, 0.9], prog: [0, 3, 0, 5], leadIn: [1, 2, 3], scale: "pentmin", room: 3.2, wet: 0.45,
    m1: { b: "x---------------" },
    m2: { k: "x...............", h: "....-.......-...", b: "x---------------" },
    m3: { k: "x.......x.......", h: "--o---o---o---o-", p: "............x...", b: "x-------5-------" },
    l: "x.......x.....x.........x.......", roll: "shaker", drop: ["boom", "kickSoft"] },
  dnb: { kit: { k: "kick", s: "snare", h: "hatC", p: "shaker", q: "hatO" }, bass: "reese", lead: "pluck", pad: "warm", padLv: [0.8, 0.5, 0.4], prog: [0, 5, 3, 4], leadIn: [3],
    m1: { b: "x---------------" },
    m2: { k: "x.........x.....", h: "x.x.x.x.x.x.x.x.", b: "x---------x-----" },
    m3: { k: "x.........x.....", s: "....x.......x...", h: "xoxoxoxoxoxoxoxo", p: "..x...x...x...x.", q: ".......x........", b: "x-----x---x-----" },
    l: "x..x..x.x.......x..x..x.x.x.....", roll: "snare", drop: ["boom", "crash", "kick"] },
  bhajanclub: { kit: { k: "kick", s: "clap", h: "tilli", p: "dagga", q: "na" }, bass: "sawb", lead: "reed", pad: "", drone: true, padLv: [0, 0, 0], prog: [0, 6, 4, 5], leadIn: [3], scale: "mixo",
    m1: { p: "x.....x...x.....", q: "..-.x...-...x.x.", b: "x---------------" },
    m2: { k: "x.......x.......", p: "x.....x.x.....x.", h: "..x.x.....x.x...", q: "....o.......o...", b: "x.........x....." },
    m3: { k: "x...x...x...x...", p: "x..x..x.x..x..x.", h: "..x.x..x..x.x..x", s: "....x.......x...", b: "x..x..x...x...x." },
    l: "x.xxx.x.x...x...x.x.x.x.x.x.....", roll: "tilli", drop: ["boom", "crash", "kick"] },
  phonk: { kit: { k: "kick808", s: "clap", h: "hatC", p: "snap", q: "hatO" }, bass: "sub808", glide: true, lead: "cowbell", pad: "", padLv: [0, 0, 0], prog: [0, 0, 5, 4], leadIn: [2, 3], scale: "phrygian",
    m1: { h: "x.x.x.x.x.x.x.x.", b: "x---------------" },
    m2: { k: "x.....x.x.......", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", b: "x-----x-x-------" },
    m3: { k: "x.....x.x.....x.", s: "....x.......x...", h: "xxxxxxxxxxxxxxxx", q: "..x.......x.....", b: "x-----x-x-----x-" },
    l: "x.x.x.xxx.x.x.x.x.x.x.xxx.x.x...", roll: "hatC", drop: ["kick808", "crash", "clap"] },
  jersey: { kit: { k: "kick", s: "clap", h: "hatC", p: "snap", q: "hatO" }, bass: "sub808", lead: "pluck", pad: "warm", padLv: [0.6, 0.3, 0.2], prog: [0, 3, 5, 4], leadIn: [3], scale: "dorian",
    m1: { h: "..x...x...x...x.", b: "x---------------" },
    m2: { k: "x..x..x...x.....", h: "x.x.x.x.x.x.x.x.", b: "x..x..x...x....." },
    m3: { k: "x..x..x...x.x.x.", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", p: "...x.......x....", b: "x..x..x...x.x.x." },
    l: "x.x...x...x.x...x.x...x.x.x.....", roll: "clap", drop: ["kick", "crash", "boom"] },
  /* percussion only (crescent): frame drum, claps, shaker */
  daf: { perc: true, kit: { k: "dum", s: "clap", h: "shaker", p: "tek", q: "jingle" }, prog: [0], leadIn: [],
    m1: { k: "x.......x.......", p: "....-.......-...", q: "x...............", h: "" },
    m2: { k: "x.....x.x.......", p: "..o.x..o..o.x.o.", q: "x.......x.......", h: "-.-.-.-.-.-.-.-." },
    m3: { k: "x..x..x.x.....x.", s: "....x.......x...", p: "..oxo..o..oxo.oo", q: "x...x...x...x...", h: "oxoxoxoxoxoxoxox" },
    roll: "tek", drop: ["dumBig", "clapStack", "jingle"] },
  claps: { perc: true, kit: { k: "dum", s: "clap", h: "shaker", p: "clapStack", q: "tek" }, prog: [0], leadIn: [],
    m1: { s: "x.....x.....x...", k: "x...............", h: "" },
    m2: { k: "x.......x.......", s: "x..x..x...x..x..", h: "-.-.-.-.-.-.-.-." },
    m3: { k: "x..x....x..x....", s: "x..x..x.x.x..x..", p: "....x.......x...", q: "..o...o...o...o.", h: "xoxoxoxoxoxoxoxo" },
    roll: "clap", drop: ["dumBig", "clapStack", "clapStack"] },
  march: { perc: true, kit: { k: "dum", s: "tek", h: "shaker", p: "jingle", q: "clap" }, prog: [0], leadIn: [],
    m1: { k: "x.......x.......", h: "" },
    m2: { k: "x...x...x...x...", s: "..x...x...x...x.", h: "x.x.x.x.x.x.x.x." },
    m3: { k: "x...x...x..xx...", s: "..x.x.x...x.xxxx", p: "x...............", q: "....x.......x...", h: "xxxxxxxxxxxxxxxx" },
    roll: "tek", drop: ["dumBig", "jingle", "clapStack"] },
  heartbeat: { perc: true, kit: { k: "dum", s: "tek", h: "shaker", p: "jingle", q: "clap" }, prog: [0], leadIn: [],
    m1: { k: "x.x.............", h: "" },
    m2: { k: "x.x.....x.x.....", h: "....-.......-..." },
    m3: { k: "x.x...x.x.x...x.", s: "....x.......x...", h: "-o-o-o-o-o-o-o-o", q: "....x.......x...", p: "x..............." },
    roll: "tek", drop: ["dumBig", "jingle"] },
  riqq: { perc: true, kit: { k: "dum", s: "tek", h: "jingle", p: "shaker", q: "clap" }, prog: [0], leadIn: [],
    m1: { h: "x...x...x...x...", k: "x...............", s: "" },
    m2: { k: "x.....x...x.....", s: "..x.x...x.x.x..x", h: "x.x.x.x.x.x.x.x.", p: "-o-o-o-o-o-o-o-o" },
    m3: { k: "x.....x...x...x.", s: "..xxx.x.x.xxx.xx", h: "xxxxxxxxxxxxxxxx", p: "oxoxoxoxoxoxoxox", q: "....x.......x..." },
    roll: "tek", drop: ["dumBig", "clapStack", "jingle"] }
};
I.strings_lead = function (t, f, dur, v) { I.brass(t, f, Math.max(dur, 0.18), v * 0.8); I.pluck(t, f * 2, dur, v * 0.5); };
var GEN = GENRES[ST.genre] || (DRUMS_ONLY ? GENRES.daf : GENRES.afrobeats);
if (DRUMS_ONLY && !GEN.perc) GEN = GENRES.daf;
var BPM = ST.bpm || 104, SIX = 60 / BPM / 4, SWING = ST.swing != null ? ST.swing : (GEN.swing ? 0.16 : 0);
var ROOT = 32.703 * Math.pow(2, ((ST.key || 0) % 12) / 12); if (ROOT < 38) ROOT *= 2;   // bass register, 38–76 Hz
var SCALE = SCALES[ST.scale || GEN.scale || "minor"] || SCALES.minor;
function semis(d) { var n = SCALE.length, o = Math.floor(d / n), i = ((d % n) + n) % n; return SCALE[i] + 12 * o; }
function hzOf(base, d) { return base * Math.pow(2, semis(d) / 12); }
var VEL = { ".": 0, "-": 0.35, "o": 0.6, "x": 0.85, "X": 1.1 };
// a lead motif made for this episode only: rhythm from the genre, pitches from a seeded walk over the scale
function makeMel() {
  var r = rng((ST.seed || 1) * 7 + 3), L = GEN.l || "", out = [], d = 4 + ((r() * 3) | 0);
  for (var s = 0; s < 32; s++) {
    if (L[s] !== "x") { out.push(null); continue; }
    var len = 1; while (s + len < 32 && L[s + len] !== "x" && len < 4) len++;
    var stepD = [-2, -1, -1, 0, 1, 1, 2, 3][(r() * 8) | 0]; d = Math.max(0, Math.min(10, d + stepD));
    if (s === 31 || s === 15) d = d - (d % 2);
    out.push({ d: d, len: len });
  }
  return out;
}
var MEL = makeMel();
/* remix: swap the genre live (key and seed stay; tempo, swing and scale follow the new genre, the day's own pick keeps its own) */
var GEN_OG = GEN, BPM_OG = BPM, SWING_OG = SWING, SCALE_OG = SCALE, GEN_NAME = GEN === GENRES[ST.genre] ? ST.genre : "fallback";
function setGenre(name) {
  var G = GENRES[name]; if (!G || (DRUMS_ONLY && !G.perc)) return false;
  var mine = G === GEN_OG, feel = (window.IHRemix && IHRemix.feel[name]) || [104, 0, "minor"];
  GEN = G; GEN_NAME = mine ? (GEN_OG === GENRES[ST.genre] ? ST.genre : "fallback") : name;
  BPM = mine ? BPM_OG : feel[0]; SIX = 60 / BPM / 4; SWING = mine ? SWING_OG : (feel[1] || 0);
  SCALE = mine ? SCALE_OG : (SCALES[G.scale || feel[2] || "minor"] || SCALES.minor);
  MEL = makeMel(); arpI = 0;
  if (ctx) setMood(mood);
  return true;
}
var ARP = [0, 2, 4, 7, 4, 2], arpI = 0;
function chordDegs(bar) { var r = (GEN.prog || [0])[bar % (GEN.prog || [0]).length]; return GEN.sev ? [r, r + 2, r + 4, r + 6] : [r, r + 2, r + 4]; }

var step = 0, nextT = 0, mood = 0, building = null, beats = [];
function beat(t, s, kind) { beats.push({ t: t, s: s, kind: kind || "k" }); }
function chAt(pat, s) { if (!pat) return "."; return pat[s % pat.length] || "."; }
function playStep(s, t) {
  var M = mood; if (M === 0 || M === "pillar") return;
  var key = M === 1 ? "m1" : M === 3 ? "m3" : "m2", P = GEN[key] || {}, p = s % 16, bar = Math.floor(s / 16);
  var tt = t + (p % 2 === 1 ? SWING * SIX : 0), K = GEN.kit, cd = chordDegs(bar);
  var gameSoft = M === "game" ? 0.75 : 1;
  ["k", "s", "h", "H", "p", "q"].forEach(function (tr) {
    var inst = K[tr]; if (!inst || !P[tr]) return; var v = VEL[chAt(P[tr], s)]; if (!v) return;
    play(inst, tt, v * gameSoft);
    if (tr === "k" && v >= 0.6) beat(tt, 0.8); else if (tr === "s" && v >= 0.6) beat(tt, 0.55, "c"); else if (tr === "p" && v >= 0.6) beat(tt, 0.3, "d");
  });
  if (building) { var prog = Math.min(1, (t - building.t0) / building.dur); if (Math.random() < prog * prog) play(GEN.roll || "hatC", tt, 0.3 + prog * 0.6); }
  if (GEN.perc) return;
  // bass
  var bc = chAt(P.b, s);
  if (bc && bc !== "." && bc !== "-") {
    var off = { x: 0, "5": 4, "8": 7, "3": 2, "7": 6 }[bc] || 0, len = 1, pat = P.b;
    while (len < 16 && chAt(pat, s + len) === "-") len++;
    if (len === 1) len = GEN.glide ? 2 : 1.6;
    var bf = hzOf(ROOT, cd[0] + off), nx = null;
    if (GEN.glide) { var nc = chAt(pat, s + Math.ceil(len)); if (nc && nc !== "." && nc !== "-") { var no = { x: 0, "5": 4, "8": 7, "3": 2, "7": 6 }[nc] || 0; if (no !== off) nx = hzOf(ROOT, cd[0] + no); } }
    play(GEN.bass, tt, bf, len * SIX, 0.85, nx);
  }
  // chord stabs
  if (P.c && VEL[chAt(P.c, s)] && GEN.stab) cd.slice(0, 3).forEach(function (d) { play(GEN.stab, tt, hzOf(ROOT * 4, d), SIX * 2, 0.55); });
  // pad, once a bar
  var pl = (GEN.padLv || [0, 0, 0])[key === "m1" ? 0 : key === "m2" ? 1 : 2];
  if (p === 0 && GEN.pad && pl > 0) play(GEN.pad, t, cd.map(function (d) { return hzOf(ROOT * 4, d); }), SIX * 16, pl);
  // lead
  var li = GEN.leadIn || [], lk = M === 1 ? 1 : M === 3 ? 3 : 2;
  if (M !== "game" && li.indexOf(lk) >= 0) {
    if (GEN.arp) { if (chAt(GEN.l, s) === "x") { var ad = cd[0] + ARP[arpI++ % ARP.length]; play(GEN.lead, tt, hzOf(ROOT * 8, ad), SIX, lk === 3 ? 0.9 : 0.55); } }
    else { var m = MEL[s % 32]; if (m && (lk === 3 || s % 32 < 16 || lk === 1)) play(GEN.lead, tt, hzOf(ROOT * 8, m.d), m.len * SIX, lk === 3 ? 0.9 : 0.6); }
  }
}
function tick() { var now = clock(); if (nextT < now - 0.3) nextT = now + 0.03; while (nextT < now + 0.12) { playStep(step, nextT); nextT += SIX; step++; } }
setInterval(tick, 25);
function setMood(m) {
  var was = mood; mood = m; building = null;
  if (!ctx) return;
  var t = ctx.currentTime;
  var dg = (m === 0 || m === "pillar" || !GEN.drone) ? 0 : (m === 1 ? 0.5 : 0.36);
  droneGain.gain.cancelScheduledValues(t); droneGain.gain.setTargetAtTime(dg, t, 0.4);
  musicLP.frequency.cancelScheduledValues(t); musicLP.frequency.setTargetAtTime(GEN.lp || 18000, t, 0.05);
}
function dropFx(t, v) { (GEN.drop || ["boom", "crash", "kick"]).forEach(function (n, k) { play(n, t + (n === "crash" ? 0.01 : 0), (v || 1) * (k ? 0.9 : 1.15)); }); }
function dropNow() {
  var t = clock() + 0.02; nextT = t; step = 0; mood = 3; building = null;
  if (ctx) { musicLP.frequency.cancelScheduledValues(ctx.currentTime); musicLP.frequency.setValueAtTime(GEN.lp || 18000, ctx.currentTime); duck(false); }
  dropFx(t, 1); beat(t, 2.2, "drop");
}
function hush() { if (!ctx) return; var t = ctx.currentTime; musicLP.frequency.cancelScheduledValues(t); musicLP.frequency.setTargetAtTime(320, t, 0.12); }
function duck(on) { if (!ctx) return; musicBus.gain.setTargetAtTime(on ? 0.26 : 0.62, ctx.currentTime, 0.15); }
function celebrate() { var t = clock() + 0.02, inst = GEN.kit.p || GEN.kit.k; for (var k = 0; k < 6; k++) play(inst, t + k * SIX * 0.5, 0.9); play(DRUMS_ONLY ? "jingle" : "crash", t + 3 * SIX, 0.7); }
function nopeSound() { var t = clock() + 0.01; play(GEN.kit.p || "tek", t, 0.9); play(GEN.kit.k, t + 0.12, 0.6); }
var KIND = {
  petals: { n: 40, born: function (p, burst) { p.s = 7 + Math.random() * 9; p.vr = (Math.random() - 0.5) * 0.15; if (!burst) { p.vy = 0.6 + Math.random() * 0.8; p.vx = Math.random() - 0.5; } p.max = burst ? 140 : 420; },
    move: function (p, dt, T) { p.vy += 0.02 * dt; p.vx += Math.sin(T * 1.4 + p.seed) * 0.03 * dt; p.vx *= 0.98; p.vy = Math.min(p.vy, 1.8); },
    draw: function (p, a) { g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot); g2.scale(1, 0.55 + 0.45 * Math.sin(p.rot * 2)); g2.globalAlpha = a; g2.fillStyle = COLORS[p.c]; g2.beginPath(); g2.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 7); g2.fill(); g2.restore(); }, blend: "source-over", amb: [0.05, 0.12, 0.3] },
  sparks: { n: 60, born: function (p, burst) { p.s = 1.5 + Math.random() * 2; p.max = 40 + Math.random() * 40; if (!burst) { p.vy = -(2 + Math.random() * 4); p.vx = (Math.random() - 0.5) * 2; } },
    move: function (p, dt) { p.vy += 0.14 * dt; p.vx *= 0.985; },
    draw: function (p, a) { g2.globalAlpha = a; g2.strokeStyle = COLORS[p.c]; g2.lineWidth = p.s; g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); g2.stroke(); g2.drawImage(sprites[p.c], p.x - 6, p.y - 6, 12, 12); }, blend: "lighter", amb: [0.03, 0.1, 0.5], from: "bottom" },
  waves: { n: 4, born: function (p) { p.ring = true; p.s = 6; p.max = 70; },
    move: function (p, dt) { p.s += 3.2 * dt; p.vx = p.vy = 0; },
    draw: function (p, a) { g2.globalAlpha = a * 0.9; g2.strokeStyle = COLORS[p.c]; g2.lineWidth = 3 * a + 0.5; g2.beginPath(); g2.ellipse(p.x, p.y, p.s, p.s * 0.38, 0, 0, 7); g2.stroke(); }, blend: "lighter", amb: [0.01, 0.02, 0.05] },
  stars: { n: 30, born: function (p, burst) { p.s = 2 + Math.random() * 4; p.max = burst ? 70 : 200; if (!burst) { p.vx = 0; p.vy = 0; } },
    move: function (p, dt) { p.vx *= 0.94; p.vy *= 0.94; },
    draw: function (p, a, T) { var tw = 0.5 + 0.5 * Math.sin(T * 6 + p.seed), s = p.s * (0.7 + tw * 0.6); g2.globalAlpha = a * (0.4 + tw * 0.6); g2.fillStyle = "#FFFFFF";
      g2.beginPath(); g2.moveTo(p.x, p.y - s * 2.4); g2.lineTo(p.x + s * 0.35, p.y); g2.lineTo(p.x, p.y + s * 2.4); g2.lineTo(p.x - s * 0.35, p.y); g2.closePath(); g2.fill();
      g2.beginPath(); g2.moveTo(p.x - s * 2.4, p.y); g2.lineTo(p.x, p.y + s * 0.35); g2.lineTo(p.x + s * 2.4, p.y); g2.lineTo(p.x, p.y - s * 0.35); g2.closePath(); g2.fill();
      g2.drawImage(sprites[p.c], p.x - s * 3, p.y - s * 3, s * 6, s * 6); }, blend: "lighter", amb: [0.06, 0.1, 0.2], spread: true },
  lanterns: { n: 9, born: function (p, burst) { p.s = 12 + Math.random() * 16; p.max = 520; p.vy = -(0.35 + Math.random() * 0.5); p.vx = (Math.random() - 0.5) * (burst ? 1.4 : 0.3); },
    move: function (p, dt, T) { p.vx += Math.sin(T * 0.8 + p.seed) * 0.004 * dt; p.vx *= 0.99; p.vy = Math.max(p.vy - 0.002 * dt, -1.1); },
    draw: function (p, a, T) { var fl = 0.85 + 0.15 * Math.sin(T * 9 + p.seed); g2.globalAlpha = a * 0.7 * fl; g2.drawImage(whiteSprite, p.x - p.s * 2.2, p.y - p.s * 2.2, p.s * 4.4, p.s * 4.4);
      g2.globalAlpha = a * fl; g2.fillStyle = COLORS[p.c]; var w = p.s * 0.8, h = p.s * 1.1; g2.beginPath(); if (g2.roundRect) g2.roundRect(p.x - w / 2, p.y - h / 2, w, h, w * 0.35); else g2.rect(p.x - w / 2, p.y - h / 2, w, h); g2.fill();
      g2.fillStyle = "rgba(255,250,220,.9)"; g2.fillRect(p.x - w * 0.18, p.y + h * 0.15, w * 0.36, h * 0.2); }, blend: "lighter", amb: [0.012, 0.02, 0.04], from: "bottom" },
  confetti: { n: 70, born: function (p, burst) { p.s = 5 + Math.random() * 6; p.vr = (Math.random() - 0.5) * 0.4; p.max = 160; if (!burst) { p.vy = 1 + Math.random(); p.vx = Math.random() - 0.5; } },
    move: function (p, dt) { p.vy += 0.09 * dt; p.vx *= 0.97; p.vy *= 0.985; },
    draw: function (p, a) { g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot); g2.scale(1, Math.cos(p.rot * 3)); g2.globalAlpha = a; g2.fillStyle = COLORS[p.c]; g2.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6); g2.restore(); }, blend: "source-over", amb: [0.02, 0.06, 0.5] },
  embers: { n: 45, born: function (p, burst) { p.s = 2 + Math.random() * 4; p.max = 120 + Math.random() * 120; if (!burst) { p.vy = -(0.5 + Math.random() * 1.2); p.vx = (Math.random() - 0.5) * 0.6; } p.c = Math.random() < 0.6 ? 3 : pc(); },
    move: function (p, dt, T) { p.vy -= 0.01 * dt; p.vx += Math.sin(T * 3 + p.seed) * 0.02 * dt; p.vx *= 0.97; p.vy *= 0.99; },
    draw: function (p, a, T) { var fl = 0.6 + 0.4 * Math.sin(T * 14 + p.seed); g2.globalAlpha = a * fl; g2.drawImage(sprites[p.c], p.x - p.s * 3, p.y - p.s * 3, p.s * 6, p.s * 6); g2.fillStyle = "#FFE2A8"; g2.fillRect(p.x - 1, p.y - 1, 2, 2); }, blend: "lighter", amb: [0.1, 0.2, 0.45], from: "bottom" },
  snow: { n: 50, born: function (p, burst) { p.s = 1.5 + Math.random() * 3.5; p.max = 600; if (!burst) { p.vy = 0.4 + Math.random() * 0.7; p.vx = (Math.random() - 0.5) * 0.3; } },
    move: function (p, dt, T) { p.vy += (0.8 - p.vy) * 0.02 * dt; p.vx += Math.sin(T + p.seed) * 0.01 * dt; p.vx *= 0.98; },
    draw: function (p, a) { g2.globalAlpha = a * 0.9; g2.fillStyle = "#FFFFFF"; g2.beginPath(); g2.arc(p.x, p.y, p.s, 0, 7); g2.fill(); }, blend: "source-over", amb: [0.25, 0.35, 0.5] },
  leaves: { n: 30, born: function (p, burst) { p.s = 8 + Math.random() * 8; p.vr = (Math.random() - 0.5) * 0.1; p.max = 420; if (!burst) { p.vy = 0.6 + Math.random() * 0.6; p.vx = (Math.random() - 0.5); } },
    move: function (p, dt, T) { p.vy += (1.1 - p.vy) * 0.02 * dt; p.vx += Math.sin(T * 1.1 + p.seed) * 0.05 * dt; p.vx *= 0.97; p.rot += Math.sin(T + p.seed) * 0.02 * dt; },
    draw: function (p, a) { g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot); g2.globalAlpha = a; g2.fillStyle = COLORS[p.c]; g2.beginPath(); g2.moveTo(-p.s, 0); g2.quadraticCurveTo(0, -p.s * 0.7, p.s, 0); g2.quadraticCurveTo(0, p.s * 0.7, -p.s, 0); g2.fill();
      g2.strokeStyle = "rgba(0,0,0,.25)"; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(-p.s, 0); g2.lineTo(p.s, 0); g2.stroke(); g2.restore(); }, blend: "source-over", amb: [0.04, 0.08, 0.2] },
  bubbles: { n: 24, born: function (p, burst) { p.s = 5 + Math.random() * 14; p.max = 300; if (!burst) { p.vy = -(0.5 + Math.random() * 0.9); p.vx = 0; } },
    move: function (p, dt, T) { p.vy = Math.max(p.vy - 0.006 * dt, -1.6); p.vx = Math.sin(T * 2 + p.seed) * 0.6; },
    draw: function (p, a) { g2.globalAlpha = a * 0.85; g2.strokeStyle = COLORS[p.c]; g2.lineWidth = 2; g2.beginPath(); g2.arc(p.x, p.y, p.s, 0, 7); g2.stroke();
      g2.fillStyle = "rgba(255,255,255,.75)"; g2.beginPath(); g2.arc(p.x - p.s * 0.35, p.y - p.s * 0.35, p.s * 0.18, 0, 7); g2.fill(); }, blend: "source-over", amb: [0.03, 0.06, 0.15], from: "bottom" },
  rice: { n: 70, born: function (p, burst) { p.s = 2.2 + Math.random() * 1.6; p.vr = (Math.random() - 0.5) * 0.5; p.max = 150; p.c = Math.random() < 0.8 ? -1 : pc(); if (burst) p.vy -= 3; else { p.vy = 0.5; p.vx = 0; } },
    move: function (p, dt) { p.vy += 0.22 * dt; p.vx *= 0.99; if (p.y > H - 30 && p.vy > 0) { p.vy *= -0.3; p.vx *= 0.6; } },
    draw: function (p, a) { g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot); g2.globalAlpha = a; g2.fillStyle = p.c < 0 ? "#FFF8EC" : COLORS[p.c]; g2.beginPath(); g2.ellipse(0, 0, p.s * 1.8, p.s * 0.75, 0, 0, 7); g2.fill(); g2.restore(); }, blend: "source-over", amb: [0, 0.03, 0.2] },
  light: { n: 14, born: function (p, burst) { p.s = 20 + Math.random() * 60; p.max = burst ? 110 : 360; if (!burst) { p.vy = -0.15 - Math.random() * 0.3; p.vx = (Math.random() - 0.5) * 0.3; } else { p.vx *= 0.4; p.vy *= 0.4; } },
    move: function (p, dt) { p.vx *= 0.99; p.vy *= 0.995; },
    draw: function (p, a) { g2.globalAlpha = a * 0.35; g2.drawImage(sprites[p.c], p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); g2.globalAlpha = a * 0.25; g2.drawImage(whiteSprite, p.x - p.s * 0.4, p.y - p.s * 0.4, p.s * 0.8, p.s * 0.8); }, blend: "lighter", amb: [0.05, 0.08, 0.16], spread: true }
};
return {
  initAudio: initAudio, setMood: setMood, dropNow: dropNow, celebrate: celebrate, nopeSound: nopeSound, hush: hush, duck: duck, play: play,
  get ctx() { return ctx; }, get master() { return master; }, beats: beats, STATS: STATS, get GEN() { return GEN; }, get BPM() { return BPM; }, ROOT: ROOT, KIND: KIND, setGenre: setGenre,
  get mood() { return mood; }, size: function (w, h) { W = w; H = h; },
  get genreName() { return GEN_NAME; }, genres: Object.keys(GENRES)
};
};
