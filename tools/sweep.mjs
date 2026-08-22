/* Sweep the isolated .sky layer across viewport widths and scroll positions in
   ONE Chrome session, using CDP device-metrics emulation so we are not limited
   by the macOS minimum window width. Writes one PNG per sample. */
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, outDir] = process.argv.slice(2);
const PORT = 9800 + Math.floor(process.hrtime()[1] % 200);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "sweep-"))}`,
  "--hide-scrollbars", "--no-first-run",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
        const p = l.find(t => t.type === "page"); if (p) wsUrl = p.webSocketDebuggerUrl; } catch {}
  await sleep(250);
}
const ws = new WebSocket(wsUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const evalx = expr => send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });

await send("Page.enable");
const HIDE = `document.querySelectorAll("header.hero,main,.hud,footer.outro,.stickynav,.rig-layer,.skip").forEach(e=>e.style.visibility="hidden");`;

for (const [w, h] of [[375, 812], [500, 850], [700, 900], [1280, 800], [1920, 1200], [3440, 1440]]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  await sleep(3200);
  await evalx(HIDE);
  const { result } = await evalx(`document.documentElement.scrollHeight - innerHeight`);
  const S = result.value;
  for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
    await evalx(`scrollTo(0, ${Math.round(S * frac)})`);
    await sleep(420);
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(outDir, `sw-${w}-${Math.round(frac * 100)}.png`), Buffer.from(data, "base64"));
  }
  console.log(`swept ${w}x${h}`);
}
ws.close(); chrome.kill(); process.exit(0);
