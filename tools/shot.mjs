#!/usr/bin/env node
/* Screenshot a page, optionally after running a snippet (to click past a
   menu into gameplay). Uses headless Chrome over CDP — no puppeteer.
   Usage: node tools/shot.mjs <url> <out.png> [jsToRunBeforeShot] [waitMs] */
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, out, snippet = "", waitMs = "3500"] = process.argv.slice(2);
if (!url || !out) { console.error("usage: shot.mjs <url> <out.png> [js] [waitMs]"); process.exit(1); }

const PORT = 9333 + Math.floor(process.hrtime()[1] % 300);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "shot-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1280,800", "--hide-scrollbars", "--no-first-run",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("chrome did not come up");
}

const ws = new WebSocket(await targetWs());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
const send = (method, params = {}) =>
  new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

await send("Page.enable");
await send("Page.navigate", { url });
await sleep(Number(waitMs));
if (snippet) {
  await send("Runtime.evaluate", { expression: snippet, awaitPromise: true });
  await sleep(Number(waitMs));
}
const { data } = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(data, "base64"));
console.log(`saved ${out}`);
ws.close(); chrome.kill();
process.exit(0);
