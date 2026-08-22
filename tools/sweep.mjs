#!/usr/bin/env node
/* Sweep the isolated .sky layer across viewport widths and scroll positions,
   writing one PNG per sample. CDP device-metrics emulation is what gets past
   the ~500px minimum window width headless Chrome enforces on macOS, and it is
   the only way to measure the widths where .sky-far's band coincidences
   actually surface — a spot-check at 1280 structurally cannot see them.

   One Chrome per width, deliberately: a shared session made a single hung CDP
   call kill the whole run with "unsettled top-level await", and it died after
   1280 — silently dropping exactly the two widest viewports the sweep exists
   to cover. Every call now has a timeout, and one bad width costs one width.

   Usage: node tools/sweep.mjs <url> <outDir> [w1xh1,w2xh2,...] */
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, outDir, sizesArg] = process.argv.slice(2);
if (!url || !outDir) { console.error("usage: sweep.mjs <url> <outDir> [WxH,...]"); process.exit(1); }
const SIZES = (sizesArg || "375x812,500x850,700x900,1280x800,1920x1200,3440x1440")
  .split(",").map((s) => s.split("x").map(Number));
const FRACS = [0, 0.25, 0.5, 0.75, 1];
const HIDE = `document.querySelectorAll("header.hero,main,.hud,footer.outro,.stickynav,.rig-layer,.skip").forEach(e=>e.style.visibility="hidden");`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sweepOne(w, h) {
  const port = 9800 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "sweep-"))}`,
    "--hide-scrollbars", "--no-first-run",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "about:blank",
  ], { stdio: "ignore" });

  let ws, wsUrl;
  try {
    for (let i = 0; i < 80 && !wsUrl; i++) {
      try {
        const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        const p = l.find((t) => t.type === "page");
        if (p) wsUrl = p.webSocketDebuggerUrl;
      } catch {}
      await sleep(250);
    }
    if (!wsUrl) throw new Error("chrome did not come up");

    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error("ws open timeout")), 15000); });

    let id = 0;
    const pending = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    };
    /* every call is bounded — an unanswered one must reject, never hang the run */
    const send = (method, params = {}, ms = 30000) => new Promise((res, rej) => {
      const n = ++id;
      const t = setTimeout(() => { pending.delete(n); rej(new Error(`${method} timed out after ${ms}ms`)); }, ms);
      pending.set(n, (r) => { clearTimeout(t); res(r); });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
    const evalx = (expr) => send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });

    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url });
    await sleep(3200);
    await evalx(HIDE);
    const S = (await evalx("document.documentElement.scrollHeight - innerHeight")).result.value;
    for (const f of FRACS) {
      await evalx(`scrollTo(0, ${Math.round(S * f)})`);
      await sleep(420);
      const { data } = await send("Page.captureScreenshot", { format: "png" }, 60000);
      writeFileSync(join(outDir, `sw-${w}-${Math.round(f * 100)}.png`), Buffer.from(data, "base64"));
    }
    console.log(`swept ${w}x${h}`);
    return true;
  } catch (err) {
    console.log(`FAILED ${w}x${h}: ${err.message}`);
    return false;
  } finally {
    try { ws && ws.close(); } catch {}
    chrome.kill();
  }
}

let ok = 0;
for (const [w, h] of SIZES) if (await sweepOne(w, h)) ok++;
console.log(`\n${ok}/${SIZES.length} widths swept`);
process.exit(ok === SIZES.length ? 0 : 1);
