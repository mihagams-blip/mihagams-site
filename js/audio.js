/* =========================================================
   AUDIO — Suno tracks + skyline equaliser.
   Ported from miha-site/js/audio.js with fixes:
   - the track list renders ONCE; play/pause mutates in place
     (classList + aria-pressed + icon swap), so keyboard focus
     never gets destroyed by an innerHTML rebuild;
   - idle animation is IntersectionObserver-gated and never
     runs under prefers-reduced-motion (no timers at all);
   - error message binds to the CURRENT track via dataset.id
     (the original closed over a stale `track`).
   Audio is preload:none — nothing downloads until first play.
   ========================================================= */

(function () {
  "use strict";

  var listEl = document.getElementById("tracks");
  var viz = document.getElementById("viz");
  if (!listEl || !viz || typeof TRACKS === "undefined") return;

  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches ||
    new URLSearchParams(location.search).has("static");
  var ctx2d = viz.getContext("2d");

  var ICON_PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zm5 0h3v10H7z" fill="currentColor"/></svg>';

  var audio = null, actx = null, analyser = null, freq = null;
  var playing = null, raf = null;

  /* ------------------------------------------- rows are baked into the
     HTML (tools/bake.mjs); attach behavior to the existing buttons */
  var buttons = {};
  listEl.querySelectorAll(".track").forEach(function (btn) {
    buttons[btn.dataset.track] = btn;
    btn.addEventListener("click", function () { toggle(btn.dataset.track); });
  });

  /* in-place state flip — never rebuilds the list */
  function setPlaying(id) {
    Object.keys(buttons).forEach(function (k) {
      var on = k === id;
      var btn = buttons[k];
      btn.classList.toggle("is-playing", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.querySelector(".t-btn").innerHTML = on ? ICON_PAUSE : ICON_PLAY;
    });
    playing = id;
  }

  /* ------------------------------------------- playback */
  function ensureGraph() {
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    analyser = actx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;
    freq = new Uint8Array(analyser.frequencyBinCount);
    actx.createMediaElementSource(audio).connect(analyser);
    analyser.connect(actx.destination);
  }

  function toggle(id) {
    var track = TRACKS.find(function (t) { return t.id === id; });
    if (!track) return;

    if (playing === id && audio && !audio.paused) {
      audio.pause();
      setPlaying(null);
      startRest();
      return;
    }

    if (!audio) {
      audio = new Audio();
      audio.preload = "none";
      audio.addEventListener("ended", function () { setPlaying(null); startRest(); });
      audio.addEventListener("error", function () {
        var failed = audio.dataset.id;   // current track, not a stale closure
        setPlaying(null); startRest();
        var row = failed && listEl.querySelector('[data-row="' + failed + '"]');
        if (row && !row.querySelector(".t-err")) {
          row.insertAdjacentHTML("beforeend", '<span class="t-err">unavailable</span>');
        }
      });
    }
    if (audio.dataset.id !== id) { audio.src = track.src; audio.dataset.id = id; }

    ensureGraph();
    if (actx && actx.state === "suspended") actx.resume();

    audio.play().then(function () {
      setPlaying(id);
      stopRest();
      loop();
    }).catch(function () { setPlaying(null); });
  }

  /* ------------------------------------------- skyline equaliser */
  var COLS = 26, ROWS = 14;

  function sizeViz() {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    viz.width = Math.max(viz.clientWidth, 1) * dpr;
    viz.height = Math.max(viz.clientHeight, 1) * dpr;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* district gradient across the columns: sodium → magenta → beam */
  function colColor(c) {
    var k = c / (COLS - 1);
    var A = [232, 135, 58], B = [217, 107, 168], C = [157, 190, 242];
    var from = k < 0.5 ? A : B, to = k < 0.5 ? B : C;
    var t = k < 0.5 ? k * 2 : (k - 0.5) * 2;
    return "rgb(" +
      Math.round(from[0] + (to[0] - from[0]) * t) + "," +
      Math.round(from[1] + (to[1] - from[1]) * t) + "," +
      Math.round(from[2] + (to[2] - from[2]) * t) + ")";
  }

  function draw(levels) {
    var w = viz.clientWidth, h = viz.clientHeight;
    ctx2d.clearRect(0, 0, w, h);
    var padX = 18, padY = 14;
    var gw = (w - padX * 2) / COLS, gh = (h - padY * 2) / ROWS;
    var cell = Math.min(gw, gh) * 0.72;
    var ox = padX + (w - padX * 2 - gw * COLS) / 2, oy = padY;
    for (var c = 0; c < COLS; c++) {
      var lit = levels[c] * ROWS;
      var color = colColor(c);
      for (var r = 0; r < ROWS; r++) {
        var fromTop = ROWS - 1 - r;
        var x = ox + c * gw + (gw - cell) / 2;
        var y = oy + r * gh + (gh - cell) / 2;
        if (fromTop < lit) {
          ctx2d.fillStyle = color;
          ctx2d.globalAlpha = 0.4 + (1 - fromTop / ROWS) * 0.6;
        } else {
          ctx2d.fillStyle = "#DCD2E6";
          ctx2d.globalAlpha = 0.05;
        }
        ctx2d.fillRect(x, y, cell, cell);
      }
    }
    ctx2d.globalAlpha = 1;
  }

  var idle = new Array(COLS).fill(0);
  function rest() {
    if (playing) return;
    var t = performance.now() * 0.0011;
    for (var c = 0; c < COLS; c++) {
      idle[c] = 0.09 + (Math.sin(t + c * 0.42) * 0.5 + 0.5) * 0.16;
    }
    draw(idle);
  }

  /* Idle wave runs ONLY while the canvas is on screen, never for REDUCED. */
  var restTimer = null;
  function stopRest() { clearInterval(restTimer); restTimer = null; }
  function startRest() {
    if (REDUCED || restTimer || playing) return;
    if (!onScreen) return;
    restTimer = setInterval(rest, 90);
  }
  var onScreen = false;
  if (!REDUCED && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) startRest(); else stopRest();
    }).observe(viz);
  }

  function loop() {
    cancelAnimationFrame(raf);
    if (!analyser || !playing) return;
    analyser.getByteFrequencyData(freq);
    var levels = new Array(COLS), bins = freq.length;
    for (var c = 0; c < COLS; c++) {
      var a = Math.floor(Math.pow(c / COLS, 1.7) * bins);
      var b = Math.max(Math.floor(Math.pow((c + 1) / COLS, 1.7) * bins), a + 1);
      var sum = 0;
      for (var i = a; i < b && i < bins; i++) sum += freq[i];
      levels[c] = Math.min((sum / (b - a)) / 210, 1);
    }
    draw(levels);
    raf = requestAnimationFrame(loop);
  }

  addEventListener("resize", function () { sizeViz(); if (!playing) rest(); });

  sizeViz();
  rest();   /* static first frame — timers only start when visible */
})();
