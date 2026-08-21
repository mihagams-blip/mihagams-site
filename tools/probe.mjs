#!/usr/bin/env node
/* Evaluate an expression in a page, in a throwaway Chrome profile.
   The browser cache has repeatedly served stale JS during development and
   made working code look broken; this always sees what is on disk.
   Usage: node tools/probe.mjs <url> '<js expression or promise>' [waitMs] */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, expr, waitMs = "2500"] = process.argv.slice(2);
if (!url || !expr) { console.error("usage: probe.mjs <url> <js> [waitMs]"); process.exit(1); }

const PORT = 9600 + Math.floor(process.hrtime()[1] % 300);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "probe-"))}`,
  "--window-size=1280,900", "--hide-scrollbars", "--no-first-run",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60 && !ws; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch {}
  if (!ws) await sleep(250);
}
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
const send = (method, params = {}) =>
  new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

await send("Page.enable");
await send("Page.navigate", { url });
await sleep(Number(waitMs));
const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
console.log(r.exceptionDetails
  ? "EXCEPTION: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails)
  : JSON.stringify(r.result?.value, null, 1));
ws.close(); chrome.kill(); process.exit(0);
