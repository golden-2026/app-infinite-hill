// Lessons become episodes (2026-11-06). The episode engine builds episodes/<id>/index.html and lists the ids in
// episodes/list.json. We read that list at runtime, so a story plays as an episode the moment its id is listed and
// falls back to the old play.html until then. The list may be ["id", ...], [{ id }, ...], { episodes: [...] } or
// { "<id>": {...} }; every shape is read the same way. An episode's end card links to hill-app.html?done=<id>.
(function () {
  var set = null, waiters = [];
  function ids(j) {
    if (!j) return [];
    if (Array.isArray(j)) return j.map(function (x) { return typeof x === "string" ? x : x && (x.id || x.slug); });
    var a = j.episodes || j.ids || j.list || j.items;
    if (Array.isArray(a)) return ids(a);
    return Object.keys(j).filter(function (k) { return /^[a-z0-9-]+$/.test(k); });
  }
  function done(list) {
    set = {}; list.forEach(function (id) { if (id && /^[a-z0-9-]+$/.test(id)) set[id] = 1; });
    var w = waiters; waiters = []; w.forEach(function (f) { try { f(); } catch (e) {} });
  }
  // file:// has no fetch; the fallback (play.html) is the right answer there
  if (/^https?:$/.test(location.protocol)) {
    fetch("episodes/list.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { done(ids(j)); }, function () { done([]); });
  } else done([]);
  window.IHEp = {
    has: function (id) { return !!(set && id && set[id]); },
    ready: function (f) { if (set) f(); else waiters.push(f); },
    url: function (id) { return "episodes/" + id + "/index.html"; }
  };
})();
