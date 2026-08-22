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

  /* ---- The sound of a book coming off the shelf ----
     Synthesised, not shipped. Four layers, because a single noise burst is
     what a cheap UI sound is made of:
       1. friction — noise through a bandpass sweeping down, with an LFO on
          the filter so the slide is uneven the way card stock actually is;
       2. body    — a short sine drop, the weight of the spine clearing;
       3. neon    — two detuned oscillators into a short feedback delay, so
          the tone shimmers like the frame it came from;
       4. dust    — a quiet high tail that settles under the puffs.
     Every layer is randomised per click, so pulling the same book twice
     never sounds identical. Decorative: skipped under reduced motion, and
     any failure is swallowed — the shelf works with the speakers off. */
  var sfxCtx = null, noiseBuf = null;

  function sfxNoise() {
    if (noiseBuf) return noiseBuf;
    var len = Math.floor(sfxCtx.sampleRate * 1.0);
    noiseBuf = sfxCtx.createBuffer(1, len, sfxCtx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function shelfSound(kind, seed) {
    if (REDUCED) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!sfxCtx) sfxCtx = new AC();
      if (sfxCtx.state === "suspended") sfxCtx.resume();

      var ctx = sfxCtx, t = ctx.currentTime, pull = kind === "pull";
      var rnd = function (a, b) { return a + Math.random() * (b - a); };

      /* master bus: a little compression glues the layers and stops peaks */
      var master = ctx.createGain();
      master.gain.value = pull ? 0.85 : 0.5;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 5;
      comp.attack.value = 0.003; comp.release.value = 0.15;
      var bus = master;
      if (ctx.createStereoPanner) {
        var pan = ctx.createStereoPanner();
        pan.pan.value = rnd(-0.3, 0.3);
        master.connect(pan); pan.connect(comp);
      } else {
        master.connect(comp);
      }
      comp.connect(ctx.destination);

      /* 1 — friction */
      var dur = pull ? rnd(0.30, 0.40) : 0.22;
      var fr = ctx.createBufferSource();
      fr.buffer = sfxNoise();
      fr.playbackRate.value = rnd(0.88, 1.12);
      var bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.Q.value = rnd(1.0, 1.7);
      bp.frequency.setValueAtTime(pull ? rnd(1500, 2100) : 800, t);
      bp.frequency.exponentialRampToValueAtTime(pull ? rnd(380, 560) : rnd(1500, 1900), t + dur);
      var lfo = ctx.createOscillator();
      lfo.type = "sawtooth"; lfo.frequency.value = rnd(16, 34);
      var lfoG = ctx.createGain(); lfoG.gain.value = rnd(180, 420);
      lfo.connect(lfoG); lfoG.connect(bp.frequency);
      var frG = ctx.createGain();
      frG.gain.setValueAtTime(0.0001, t);
      frG.gain.linearRampToValueAtTime(pull ? rnd(0.16, 0.22) : 0.1, t + 0.035);
      frG.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      var frLp = ctx.createBiquadFilter();
      frLp.type = "lowpass"; frLp.frequency.value = rnd(4200, 5600);
      fr.connect(bp); bp.connect(frLp); frLp.connect(frG); frG.connect(bus);
      lfo.start(t); lfo.stop(t + dur);
      fr.start(t); fr.stop(t + dur + 0.02);

      /* 2 — body */
      var body = ctx.createOscillator();
      body.type = "sine";
      body.frequency.setValueAtTime(rnd(150, 195), t);
      body.frequency.exponentialRampToValueAtTime(rnd(66, 88), t + 0.14);
      var bodyG = ctx.createGain();
      bodyG.gain.setValueAtTime(0.0001, t + 0.01);
      bodyG.gain.linearRampToValueAtTime(pull ? 0.15 : 0.07, t + 0.03);
      bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      body.connect(bodyG); bodyG.connect(bus);
      body.start(t); body.stop(t + 0.22);

      if (pull) {
        /* 3 — neon tone, C D E G A so any two books stay consonant */
        var scale = [523.25, 587.33, 659.25, 783.99, 880.0];
        var f = scale[(seed || 0) % scale.length];
        var lp = ctx.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = 3800;
        var tone = ctx.createGain();
        tone.gain.setValueAtTime(0.0001, t + 0.05);
        tone.gain.exponentialRampToValueAtTime(0.09, t + 0.09);
        tone.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        var o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.value = f;
        var o2 = ctx.createOscillator(); o2.type = "sine";
        o2.frequency.value = f * 2; o2.detune.value = rnd(-9, 9);
        var o2g = ctx.createGain(); o2g.gain.value = 0.4;
        o1.connect(lp); o2.connect(o2g); o2g.connect(lp);
        lp.connect(tone); tone.connect(bus);
        /* short feedback delay = the shimmer of the frame it came out of */
        var dl = ctx.createDelay(0.5); dl.delayTime.value = rnd(0.09, 0.13);
        var fb = ctx.createGain(); fb.gain.value = 0.3;
        var wet = ctx.createGain(); wet.gain.value = 0.35;
        tone.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(bus);
        o1.start(t + 0.05); o1.stop(t + 0.75);
        o2.start(t + 0.05); o2.stop(t + 0.75);

        /* 4 — dust settling, under the visual puffs */
        var air = ctx.createBufferSource();
        air.buffer = sfxNoise();
        air.playbackRate.value = rnd(0.7, 1.0);
        var hp = ctx.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = rnd(2800, 4000);
        var airG = ctx.createGain();
        airG.gain.setValueAtTime(0.0001, t + 0.04);
        airG.gain.linearRampToValueAtTime(0.016, t + 0.12);
        airG.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        air.connect(hp); hp.connect(airG); airG.connect(bus);
        air.start(t + 0.04); air.stop(t + 0.9);
      }
    } catch (e) { /* no sound is fine; a broken shelf is not */ }
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
      /* ---- the rail: arrows, a count, and looping once there are enough
         books that a seam would never be seen ---- */
      var rail = shelf;
      var prev = document.getElementById("shelf-prev");
      var next = document.getElementById("shelf-next");
      var countEl = document.getElementById("shelf-count");
      var LOOP_FROM = 8;                     /* below this, looping shows the seam */
      var looping = BOOKS.length >= LOOP_FROM;

      if (countEl) {
        countEl.textContent = BOOKS.length + (BOOKS.length === 1 ? " book" : " books") +
          (looping ? " · scroll either way, it comes round" : " · scroll the shelf");
      }

      function step(dir) {
        var one = rail.querySelector(".spine");
        var by = one ? one.getBoundingClientRect().width + 18 : 140;
        rail.scrollBy({ left: dir * by * 2, behavior: "smooth" });
      }
      if (prev && next) {
        prev.addEventListener("click", function () { step(-1); });
        next.addEventListener("click", function () { step(1); });
        var syncArrows = function () {
          var over = rail.scrollWidth - rail.clientWidth > 8;
          next.hidden = !over;
          prev.hidden = !over || (!looping && rail.scrollLeft < 8);
          if (!looping && over) {
            next.hidden = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
          }
        };
        rail.addEventListener("scroll", syncArrows, { passive: true });
        addEventListener("resize", syncArrows);
        syncArrows();
      }

      /* Endless: three copies of the run, parked in the middle. When the
         reader drifts into the first or last copy we jump them back a whole
         run — same pixels under the cursor, so the seam is invisible. The
         clones are aria-hidden and untabbable; only the real row is in the
         accessibility tree. */
      if (looping) {
        var run = [].slice.call(rail.children);
        var makeGhosts = function () {
          var frag = document.createDocumentFragment();
          run.forEach(function (el) {
            var c = el.cloneNode(true);
            c.setAttribute("aria-hidden", "true");
            c.setAttribute("tabindex", "-1");
            c.classList.add("is-ghost");
            c.removeAttribute("id");
            frag.appendChild(c);
          });
          return frag;
        };
        rail.insertBefore(makeGhosts(), run[0]);
        rail.appendChild(makeGhosts());
        var runWidth = 0;
        requestAnimationFrame(function () {
          runWidth = rail.scrollWidth / 3;
          rail.scrollLeft = runWidth;
        });
        var wrapping = false;
        rail.addEventListener("scroll", function () {
          if (wrapping || !runWidth) return;
          if (rail.scrollLeft < runWidth * 0.5) {
            wrapping = true; rail.scrollLeft += runWidth; wrapping = false;
          } else if (rail.scrollLeft > runWidth * 1.5) {
            wrapping = true; rail.scrollLeft -= runWidth; wrapping = false;
          }
        }, { passive: true });
      }

      var openId = null;
      function openBook(id) {
        if (openId === id) {  /* toggle closed */
          spines[id].setAttribute("aria-expanded", "false");
          Object.keys(spines).forEach(function (k) {
            spines[k].classList.remove("is-lean-l", "is-lean-r");
          });
          note.hidden = true; openId = null;
          shelfSound("push");
          return;
        }
        shelfSound("pull", BOOKS.findIndex(function (x) { return x.id === id; }));
        Object.keys(spines).forEach(function (k) {
          spines[k].setAttribute("aria-expanded", k === id ? "true" : "false");
        });
        /* the books either side tip into the gap that just opened */
        var order = Object.keys(spines);
        var at = order.indexOf(id);
        order.forEach(function (k, i) {
          spines[k].classList.toggle("is-lean-l", i === at - 1);
          spines[k].classList.toggle("is-lean-r", i === at + 1);
        });

        var b = BOOKS.find(function (x) { return x.id === id; });
        note.hidden = false;
        /* carry the spine's neon into the panel so the two read as one */
        var hue = getComputedStyle(spines[id]).getPropertyValue("--c").trim();
        note.style.borderLeftColor = hue;
        note.style.setProperty("--c", hue);
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
