/* =========================================================
   SVETILEC 00 — the lamplighter rig.

   A municipal sign-maintenance vehicle that works the empty air between
   the page's sections. It crosses, occasionally stops to check that a
   heading still lights, and after its third job it goes home for the rest
   of the session.

   Three rules keep it from ever being a nuisance:
     - it lives on a fixed layer at z-index 0 while every section sits at
       z-index 1, so it is structurally incapable of covering content — it
       slides behind cards the way a vehicle passes behind a building;
     - it only flies in gaps tall enough to leave clear air above and below,
       so on a cramped screen it simply has nowhere to be and stays away;
     - it never reacts to the pointer. It is on the clock, not performing.

   assets/svetilec.webp is a four-pose sheet: cruise, dive, hover, working.
   ========================================================= */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  if (params.has("static")) return;                       /* perf-proof mode: no bytes */
  if (navigator.connection && navigator.connection.saveData) return;

  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SPRITE = "assets/svetilec.webp";
  var POSE = { CRUISE: 0, DIVE: 1, HOVER: 2, WORKING: 3 };

  var layer = document.createElement("div");
  layer.className = "rig-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("role", "presentation");

  var rig = document.createElement("div");
  rig.className = "rig";
  var body = document.createElement("div");
  body.className = "rig-body";
  var beacon = document.createElement("i");
  beacon.className = "rig-beacon";
  var under = document.createElement("i");
  under.className = "rig-under";
  var cone = document.createElement("i");
  cone.className = "rig-cone";
  body.appendChild(beacon); body.appendChild(under); body.appendChild(cone);
  rig.appendChild(body);
  layer.appendChild(rig);
  document.body.appendChild(layer);

  /* ---- reduced motion: one parked still, no timers at all ---- */
  if (REDUCED) {
    var lane0 = lanes()[0];
    rig.style.transform = "translate3d(40px," + (lane0 ? lane0.y : 400) + "px,0)";
    rig.style.opacity = ".4";
    body.style.backgroundImage = "url(" + SPRITE + ")";
    setPose(POSE.HOVER);
    return;
  }

  /* ---- lanes: the empty bands between sections ---- */
  function lanes() {
    var stops = [].slice.call(document.querySelectorAll("main > section, .hud, footer.outro"));
    var out = [];
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i].getBoundingClientRect();
      var b = stops[i + 1].getBoundingClientRect();
      var top = a.bottom + scrollY, bottom = b.top + scrollY;
      /* the gap the section padding leaves plus a slice of each side's air */
      var gapTop = bottom - 150, gapBottom = bottom - 24;
      var h = gapBottom - gapTop;
      if (h < 74) continue;
      out.push({ y: gapTop + h / 2, h: h, heading: stops[i + 1].querySelector("h2") });
    }
    return out;
  }

  var lane = null, laneList = [];
  function remeasure() { laneList = lanes(); }
  remeasure();
  var reTimer;
  addEventListener("resize", function () {
    clearTimeout(reTimer); reTimer = setTimeout(remeasure, 200);
  });

  function setPose(p) { body.style.backgroundPosition = (p * 100 / 3) + "% 0"; }

  /* ---- state ---- */
  var x = 0, dir = 1, speed = 34, size = 92;
  var jobsDone = 0, jobsThisRun = 0, jobXs = [], holdUntil = 0, working = false;
  var offUntil = 0, onStage = false, goingHome = false, wentHome = false;
  var started = performance.now();
  var lastT = started;

  function beginCrossing() {
    if (wentHome) return;
    laneList.length || remeasure();
    if (!laneList.length) { offUntil = performance.now() + 8000; return; }
    lane = laneList[Math.floor(Math.random() * laneList.length)];
    /* the sheet's cells are square, so the element must be too or the rig
       gets squashed; the art carries its own margin inside the cell */
    size = Math.max(74, Math.min(132, lane.h * 0.9));
    goingHome = jobsDone >= 3 || performance.now() - started > 6 * 60 * 1000;
    speed = goingHome ? 78 : 30 + Math.random() * 10;
    dir = Math.random() < 0.5 ? 1 : -1;
    x = dir === 1 ? -size * 1.4 : innerWidth + size * 0.4;
    jobsThisRun = goingHome ? 0 : (Math.random() < 0.4 ? 0 : (Math.random() < 0.75 ? 1 : 2));
    /* Stops are placed along the route now, not rolled per frame — a
       per-frame probability fires ~60x a second and the rig spends its whole
       shift parked. The first stop aims at the section heading, which is the
       sign it is here to check. */
    jobXs = [];
    for (var j = 0; j < jobsThisRun; j++) {
      var frac = 0.28 + Math.random() * 0.44;
      var px = dir === 1 ? innerWidth * frac : innerWidth * (1 - frac);
      if (j === 0 && lane.heading) {
        var hx = lane.heading.getBoundingClientRect().left + 40;
        if (hx > 60 && hx < innerWidth - 60) px = hx;
      }
      jobXs.push(px);
    }
    jobXs.sort(function (a, b) { return dir === 1 ? a - b : b - a; });
    /* the sheet is only worth fetching once it is actually about to fly */
    if (!body.style.backgroundImage) body.style.backgroundImage = "url(" + SPRITE + ")";
    onStage = true;
    rig.style.width = size + "px";
    rig.style.height = size + "px";
    setPose(goingHome ? POSE.DIVE : POSE.CRUISE);
    layer.classList.toggle("is-home-run", goingHome);
  }

  function endCrossing() {
    onStage = false;
    if (goingHome) { wentHome = true; layer.style.display = "none"; return; }
    offUntil = performance.now() + 14000 + Math.random() * 31000;
  }

  var visible = true;
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; });

  offUntil = performance.now() + 4000;                    /* let the page settle first */

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || wentHome) { lastT = now; return; }
    var dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    if (!onStage) { if (now > offUntil) beginCrossing(); return; }

    /* the page scrolls under a fixed layer, so the lane's screen position
       has to be recomputed rather than stored */
    var screenY = lane.y - scrollY;
    if (screenY < -200 || screenY > innerHeight + 200) {
      rig.style.opacity = "0";
    } else {
      rig.style.opacity = working ? ".72" : ".5";
    }

    if (now < holdUntil) {
      /* parked on a job */
    } else {
      if (working) { working = false; setPose(POSE.DIVE); cone.style.opacity = "0"; }
      x += dir * speed * dt;

      if (!goingHome && jobXs.length) {
        var target = jobXs[0];
        if ((dir === 1 && x >= target) || (dir === -1 && x <= target)) {
          jobXs.shift(); jobsDone++;
          working = true;
          holdUntil = now + 3500 + Math.random() * 2500;
          var atSign = lane.heading &&
            Math.abs(target - (lane.heading.getBoundingClientRect().left + 40)) < 70;
          setPose(atSign ? POSE.WORKING : POSE.HOVER);
          if (atSign) cone.style.opacity = "1";
        }
      }
      if (!working && now > holdUntil + 400) setPose(goingHome ? POSE.DIVE : POSE.CRUISE);
    }

    var t = now / 1000;
    var bob = Math.sin(t * 0.7) * 3;
    var roll = Math.sin(t * 0.31) * 1.2;
    rig.style.transform = "translate3d(" + x.toFixed(1) + "px," + (screenY + bob).toFixed(1) + "px,0)";
    body.style.transform = "scaleX(" + (dir === 1 ? 1 : -1) + ") rotate(" + roll.toFixed(2) + "deg)";

    /* a rotating beacon is dark most of the time — that asymmetry is the tell */
    var phase = (now % 2600) / 2600;
    beacon.style.opacity = goingHome ? "0" : (phase < 0.046 ? "0.9" : "0.25");

    if ((dir === 1 && x > innerWidth + size) || (dir === -1 && x < -size * 1.6)) endCrossing();
  }
  requestAnimationFrame(frame);
})();
