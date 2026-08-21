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

  /* ---- Projects: featured row + grid (mobile: 4 + Show all) ---- */
  function projectCard(p, big) {
    var tagEl = big ? "article" : "li";
    var media = '<img src="' + p.img + '" width="1200" height="750" alt="' + p.imgAlt + '" loading="lazy" decoding="async">';
    var live = p.url ? '<span class="live">● Live</span>' : "";
    var meta = '<p class="meta">' + p.kind + " · " + p.year + (p.tags.length ? " · " + p.tags.join(" · ") : "") + "</p>";
    var why = '<div class="why"><span class="wlab">Why I made it</span><p>' + p.why + "</p></div>";
    var inner =
      '<div class="shot">' + media + "</div>" +
      '<div class="cbody">' + live + "<h3>" + p.title + "</h3>" + meta +
      '<p class="cdesc">' + p.desc + "</p>" + why + "</div>";
    if (p.url) {
      return "<" + tagEl + ' class="card' + (big ? " card--big" : "") + '">' +
        '<a class="cardlink" href="' + p.url + '" aria-label="' + p.title + ' — open live">' + inner + "</a></" + tagEl + ">";
    }
    return "<" + tagEl + ' class="card' + (big ? " card--big" : "") + '">' + inner + "</" + tagEl + ">";
  }
  var featEl = document.getElementById("featured");
  var gridEl = document.getElementById("grid");
  if (featEl && gridEl && typeof PROJECTS !== "undefined") {
    var feat = PROJECTS.filter(function (p) { return p.featured; });
    var rest = PROJECTS.filter(function (p) { return !p.featured; });
    featEl.innerHTML = feat.map(function (p) { return projectCard(p, true); }).join("");
    gridEl.innerHTML = rest.map(function (p) { return projectCard(p, false); }).join("");
    /* mobile: collapse grid past 4 behind an expander */
    var btn = document.getElementById("showall");
    var extra = [].slice.call(gridEl.children, 4);
    if (btn && extra.length) {
      document.getElementById("showall-n").textContent = rest.length;
      var mq = matchMedia("(max-width: 760px)");
      var apply = function () {
        var collapse = mq.matches && btn.getAttribute("aria-expanded") !== "true";
        extra.forEach(function (li) { li.hidden = collapse; });
        btn.hidden = !mq.matches || btn.getAttribute("aria-expanded") === "true";
      };
      btn.addEventListener("click", function () {
        btn.setAttribute("aria-expanded", "true");
        apply();
        extra[0].querySelector("img, h3").closest(".card").scrollIntoView({ block: "nearest" });
      });
      mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);
      apply();
    }
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
      shelf.innerHTML = BOOKS.map(function (b) {
        var style = b.img
          ? 'style="background-image:url(' + b.img + ')"'
          : 'style="background:' + b.spine + '"';
        return '<button class="spine" ' + style +
          ' data-book="' + b.id + '" aria-expanded="false" aria-controls="note">' +
          '<span class="spine-t">' + b.title + "</span>" +
          '<span class="spine-a">' + b.author + "</span></button>";
      }).join("");
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
