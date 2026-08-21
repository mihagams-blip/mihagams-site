/* =========================================================
   The chamois in the footer — 23,826 voxels you can spin.
   Three.js is imported only when the footer is actually near
   the viewport, so the page's critical path stays framework-free.
   The still image (assets/gams.webp) is what everyone else sees:
   no WebGL, reduced motion, or a failed CDN all keep it.
   ========================================================= */
(function () {
  "use strict";
  var host = document.getElementById("gams3d");
  if (!host) return;

  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches ||
    new URLSearchParams(location.search).has("static");
  if (REDUCED || !("IntersectionObserver" in window)) return;

  var started = false;
  new IntersectionObserver(function (entries, io) {
    if (!entries[0].isIntersecting || started) return;
    started = true; io.disconnect(); boot();
  }, { rootMargin: "200px 0px" }).observe(host);

  async function boot() {
    var THREE;
    try {
      THREE = await import("https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js");
    } catch (e) { return; }                       // still image stays

    var meta, raw;
    try {
      meta = await (await fetch("assets/model/gams.json")).json();
      raw = new Uint8Array(await (await fetch("assets/model/" + meta.bin)).arrayBuffer());
    } catch (e) { return; }

    var W = host.clientWidth, H = host.clientHeight;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    host.appendChild(renderer.domElement);
    host.classList.add("live");                   // fades the still out

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(34, W / H, 1, 2000);

    var g = meta.grid, GW = g[0], GH = g[1], GD = g[2];
    var cx = (GW - 1) / 2, cy = GH * 0.5, cz = (GD - 1) / 2;
    var stride = innerWidth < 760 ? 2 : 1;
    var up = stride === 2 ? 1.5 : 1;
    var GAP = 1;

    var n = 0;
    for (var i = 0; i < meta.count; i += stride) n++;

    var geo = new THREE.BoxGeometry(GAP * up, GAP * up, GAP * up);
    /* BoxGeometry ships no `color` attribute; with vertexColors on, every
       instance would be multiplied by black without this white one. */
    geo.setAttribute("color", new THREE.BufferAttribute(
      new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
    var mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), n);

    var m = new THREE.Matrix4(), col = new THREE.Color();
    var k = 0;
    for (var v = 0; v < meta.count; v += stride) {
      var o = v * 4;
      m.makeTranslation(raw[o] - cx, raw[o + 1] - cy, raw[o + 2] - cz);
      mesh.setMatrixAt(k, m);
      var rgb = meta.palette[raw[o + 3]];
      col.setRGB(((rgb >> 16) & 255) / 255, ((rgb >> 8) & 255) / 255, (rgb & 255) / 255);
      /* the source renders were sampled through fog — put the chroma back */
      var hsl = {}; col.getHSL(hsl);
      col.setHSL(hsl.h, Math.min(hsl.s * 1.35, 1), hsl.l);
      mesh.setColorAt(k, col);
      k++;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);

    /* Second pass: the lit blocks only, slightly fatter and additive, sharing
       the SAME matrix buffer. Black under additive blending is invisible, so
       one buffer covers both meshes. The 0.74 threshold matters — lower and
       the whole animal glows and the detail washes out. */
    var glowGeo = new THREE.BoxGeometry(GAP * up * 1.18, GAP * up * 1.18, GAP * up * 1.18);
    glowGeo.setAttribute("color", new THREE.BufferAttribute(
      new Float32Array(glowGeo.attributes.position.count * 3).fill(1), 3));
    var glow = new THREE.InstancedMesh(glowGeo, new THREE.MeshBasicMaterial({
      vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }), n);
    glow.instanceMatrix = mesh.instanceMatrix;
    var k2 = 0;
    for (var v2 = 0; v2 < meta.count; v2 += stride) {
      var rgb2 = meta.palette[raw[v2 * 4 + 3]];
      var r2 = ((rgb2 >> 16) & 255) / 255, g2 = ((rgb2 >> 8) & 255) / 255, b2 = (rgb2 & 255) / 255;
      var peak = Math.max(r2, g2, b2);
      var force = peak > 0.74 ? (peak - 0.74) / 0.26 * 0.55 : 0;
      col.setRGB(r2 * force, g2 * force, b2 * force);
      glow.setColorAt(k2, col);
      k2++;
    }
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
    scene.add(glow);

    /* City light: sodium key, magenta and beam rims — the page's palette. */
    scene.add(new THREE.AmbientLight(0x7a6a88, 1.25));
    var key = new THREE.DirectionalLight(0xf3b269, 1.8); key.position.set(60, 90, 70); scene.add(key);
    var rimA = new THREE.DirectionalLight(0xd96ba8, 0.8); rimA.position.set(-80, 30, -40); scene.add(rimA);
    var rimB = new THREE.DirectionalLight(0x9dbef2, 0.7); rimB.position.set(70, 10, -80); scene.add(rimB);
    var fill = new THREE.DirectionalLight(0xdcd2e6, 0.55); fill.position.set(-10, 20, 120); scene.add(fill);

    camera.position.set(0, 2, GH * 2.35);
    camera.lookAt(0, -2, 0);

    /* ---- spin: drag to turn, drifts on its own when left alone ---- */
    var rotY = -0.55, rotX = 0.04, velY = 0.0016, dragging = false, lastX = 0, lastY = 0, moved = false;
    host.style.touchAction = "pan-y";

    host.addEventListener("pointerdown", function (e) {
      dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY;
      host.setPointerCapture(e.pointerId); host.classList.add("grabbing");
    });
    host.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      rotY += dx * 0.008;
      rotX = Math.max(-0.5, Math.min(0.5, rotX + dy * 0.004));
      velY = dx * 0.0009;
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false; host.classList.remove("grabbing");
      if (e && e.pointerId != null && host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
    }
    host.addEventListener("pointerup", endDrag);
    host.addEventListener("pointercancel", endDrag);

    /* keyboard: the canvas is focusable, arrows turn it */
    host.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { rotY -= 0.12; velY = -0.0016; e.preventDefault(); }
      if (e.key === "ArrowRight") { rotY += 0.12; velY = 0.0016; e.preventDefault(); }
    });

    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(host);
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; });

    addEventListener("resize", function () {
      W = host.clientWidth; H = host.clientHeight;
      if (!W || !H) return;
      camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.setSize(W, H);
    });

    (function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      if (!dragging) {
        velY += (0.0016 - velY) * 0.02;           // ease back to the idle drift
        rotY += velY;
        rotX += (0.04 - rotX) * 0.02;
      }
      mesh.rotation.y = glow.rotation.y = rotY;
      mesh.rotation.x = glow.rotation.x = rotX;
      renderer.render(scene, camera);
    })();
  }
})();
