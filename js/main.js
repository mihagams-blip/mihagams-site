/* GAM(E)S — hero video deferral, sticky nav, scrollspy, HUD. */
(function () {
  "use strict";
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches ||
    new URLSearchParams(location.search).has("static");
  var SAVE = navigator.connection && navigator.connection.saveData;

  /* ---- HUD (computed from data, never hardcoded) ---- */
  var hud = document.getElementById("hud");
  if (hud) {
    var live = PROJECTS.filter(function (p) { return p.url; }).length;
    var items = [];
    if (PROJECTS.length) items.push("<b>" + PROJECTS.length + "</b> builds");
    if (live) items.push("<b>" + live + "</b> live");
    if (TRACKS.length) items.push("<b>" + TRACKS.length + "</b> tracks");
    items.push("Slovenia", "2026");
    hud.innerHTML = items.map(function (t) { return "<span>" + t + "</span>"; }).join("");
  }

  /* ---- Hero video: near-viewport + idle + never for reduced/saveData ---- */
  var loop = document.getElementById("loop");
  var plate = document.getElementById("plate");
  if (loop && plate && !REDUCED && !SAVE) {
    var startLoad = function () {
      var go = function () {
        loop.src = loop.dataset.src;
        loop.addEventListener("playing", function () { loop.classList.add("ready"); }, { once: true });
        loop.load();
        var p = loop.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
      };
      if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 });
      else setTimeout(go, 200);
    };
    var armed = false;
    var arm = function () {
      if (armed) return; armed = true;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { io.disconnect(); startLoad(); }
        });
      }, { rootMargin: "100% 0px" });
      io.observe(plate);
    };
    if (document.readyState === "complete") arm();
    else addEventListener("load", arm, { once: true });
  }

  /* ---- Sticky nav: appears after the hero ---- */
  var nav = document.getElementById("stickynav");
  var hero = document.querySelector(".hero");
  if (nav && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle("on", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(hero);
  }

  /* ---- Scrollspy: tint active label with its district accent ---- */
  var links = {};
  nav && nav.querySelectorAll("[data-spy]").forEach(function (a) { links[a.dataset.spy] = a; });
  ["projects", "music", "books"].forEach(function (id) {
    var sec = document.getElementById(id);
    if (!sec || !links[id]) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          links[id].classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" }).observe(sec);
  });
})();
