/* GAM(E)S — hero video deferral, sticky nav, scrollspy, HUD. */
(function () {
  "use strict";
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches ||
    new URLSearchParams(location.search).has("static");
  var SAVE = navigator.connection && navigator.connection.saveData;

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

  /* ---- Projects are baked into the HTML (tools/bake.mjs); JS only
     wires the mobile expander ---- */
  var gridEl = document.getElementById("grid");
  var btn = document.getElementById("showall");
  if (gridEl && btn) {
    btn.addEventListener("click", function () {
      gridEl.classList.add("expanded");
      btn.setAttribute("aria-expanded", "true");
      btn.hidden = true;
      var fifth = gridEl.children[4];
      if (fifth) fifth.scrollIntoView({ block: "nearest" });
    });
  }

  /* ---- Books: shelf of disclosure buttons + one shared note panel.
     Built to grow — spines wrap, and the whole district (plus its nav
     links) disappears cleanly when BOOKS is empty. ---- */
  var shelf = document.getElementById("shelf");
  var note = document.getElementById("note");
  if (shelf && note && typeof BOOKS !== "undefined") {
    if (!BOOKS.length) {
      var sec = document.getElementById("books");
      if (sec) sec.hidden = true;
      document.querySelectorAll('a[href="#books"]').forEach(function (a) { a.hidden = true; });
    } else {
      var spines = {};
      shelf.querySelectorAll(".spine").forEach(function (btn) {
        spines[btn.dataset.book] = btn;
        btn.addEventListener("click", function () { openBook(btn.dataset.book); });
      });
      var openId = null;
      function openBook(id) {
        if (openId === id) {  /* toggle closed */
          spines[id].setAttribute("aria-expanded", "false");
          note.hidden = true; openId = null; return;
        }
        Object.keys(spines).forEach(function (k) {
          spines[k].setAttribute("aria-expanded", k === id ? "true" : "false");
        });
        var b = BOOKS.find(function (x) { return x.id === id; });
        note.hidden = false;
        note.innerHTML = "<h3>" + b.title + '</h3><p class="note-a">' + b.author + "</p>" +
          (b.note ? "<p>" + b.note + "</p>" : '<p class="note-pending">Notes in progress.</p>');
        openId = id;
      }
    }
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

  /* ---- Reveal-on-scroll (skipped entirely under reduced motion) ---- */
  if (!REDUCED && "IntersectionObserver" in window) {
    var toReveal = document.querySelectorAll("main h2, .card, .trackrow, .spine, .outro-body");
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); rio.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    toReveal.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      rio.observe(el);
    });
  }
})();
