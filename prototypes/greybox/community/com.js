// community concepts: tiny screen switcher shared by the three mockups.
// screens are <section class="scr" data-name="...">; any element with data-go="N" jumps to screen N (1-based).
(function () {
  var scrs = [].slice.call(document.querySelectorAll(".scr"));
  var dots = document.querySelector(".dots");
  var toastEl = document.createElement("div"); toastEl.className = "toast"; document.querySelector(".phone").appendChild(toastEl);
  var tt;
  window.toast = function (t) { toastEl.textContent = t; toastEl.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove("on"); }, 1800); };
  scrs.forEach(function (s, i) {
    var b = document.createElement("button"); b.textContent = (i + 1) + " " + (s.dataset.name || ""); b.onclick = function () { go(i + 1); }; dots.appendChild(b);
  });
  function go(n) {
    n = Math.max(1, Math.min(scrs.length, n | 0));
    scrs.forEach(function (s, i) { s.classList.toggle("on", i === n - 1); if (i === n - 1) { s.scrollTop = 0; } });
    [].forEach.call(dots.children, function (b, i) { b.classList.toggle("on", i === n - 1); });
    if (history.replaceState) history.replaceState(null, "", "#" + n);
    var s = scrs[n - 1]; if (s && s.dataset.enter && window[s.dataset.enter]) window[s.dataset.enter](s);
  }
  window.go = go;
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-go]"); if (g) { e.preventDefault(); go(+g.dataset.go); if (g.dataset.toast) toast(g.dataset.toast); return; }
    var t = e.target.closest("[data-toast]"); if (t) toast(t.dataset.toast);
    var r = e.target.closest(".reacts button"); if (r) r.classList.toggle("on");
    var c = e.target.closest(".choice button"); if (c && !c.dataset.go) { [].forEach.call(c.parentNode.children, function (x) { x.classList.remove("pick"); }); c.classList.add("pick"); if (c.dataset.next) setTimeout(function () { go(+c.dataset.next); }, 450); }
  });
  window.addEventListener("hashchange", function () { go(+location.hash.slice(1) || 1); });
  go(+(location.hash || "#1").slice(1) || 1);
})();
