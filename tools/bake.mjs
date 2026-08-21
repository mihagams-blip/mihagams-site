#!/usr/bin/env node
/* Bake js/data.js into index.html between <!--BAKE:name--> markers.
   Run after any data.js edit:  node tools/bake.mjs
   The page then ships fully rendered HTML; the runtime JS only adds
   interactivity (video, player, shelf, nav). */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataSrc = readFileSync(join(root, "js/data.js"), "utf8");
const { SITE, PROJECTS, TRACKS, BOOKS } =
  new Function(dataSrc + "; return { SITE, PROJECTS, TRACKS, BOOKS };")();

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ---- HUD ---- */
const live = PROJECTS.filter((p) => p.url).length;
const hud = [
  PROJECTS.length && `<b>${PROJECTS.length}</b> builds`,
  live && `<b>${live}</b> live`,
  TRACKS.length && `<b>${TRACKS.length}</b> tracks`,
  "Slovenia", "2026",
].filter(Boolean).map((t) => `<span>${t}</span>`).join("");

/* ---- project cards ---- */
function card(p, big) {
  const tag = big ? "article" : "li";
  const inner =
    `<div class="shot"><img src="${p.img}" width="1200" height="750" alt="${esc(p.imgAlt)}" loading="lazy" decoding="async"></div>` +
    `<div class="cbody">${p.url ? '<span class="live">● Live</span>' : ""}<h3>${esc(p.title)}</h3>` +
    `<p class="meta">${esc(p.kind)} · ${p.year}${p.tags.length ? " · " + p.tags.map(esc).join(" · ") : ""}</p>` +
    `<p class="cdesc">${esc(p.desc)}</p>` +
    `<div class="why"><span class="wlab">Why I made it</span><p>${esc(p.why)}</p></div></div>`;
  return p.url
    ? `<${tag} class="card${big ? " card--big" : ""}"><a class="cardlink" href="${p.url}" aria-label="${esc(p.title)} — open live">${inner}</a></${tag}>`
    : `<${tag} class="card${big ? " card--big" : ""}">${inner}</${tag}>`;
}
const featured = PROJECTS.filter((p) => p.featured).map((p) => card(p, true)).join("\n");
const rest = PROJECTS.filter((p) => !p.featured);
const grid = rest.map((p) => card(p, false)).join("\n");
const showall = rest.length > 4
  ? `<button id="showall" class="showall" aria-expanded="false">Show all <span id="showall-n">${rest.length}</span></button>`
  : "";

/* ---- tracks ---- */
const titleOf = Object.fromEntries(PROJECTS.map((p) => [p.id, p.title]));
const ICON_PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
const ICON_PLAY_LG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2l16 10L5 22z" fill="currentColor"/></svg>';

/* Featured tracks get a cover card; each also keeps its list row below, and
   both buttons carry data-track so they share one play state. */
const featuredTracks = TRACKS.filter((t) => t.featured).map((tr) => {
  const label = `Play ${tr.title}${tr.genre ? ' — ' + tr.genre : ''}`;
  const art = tr.cover
    ? `<img src="${tr.cover}" width="600" height="600" alt="${esc(tr.coverAlt || tr.title + ' cover art')}" loading="lazy" decoding="async">`
    : `<span class="cover-ph" aria-hidden="true"><i>${esc(tr.title.slice(0, 1))}</i></span>`;
  const chip = tr.projectId && titleOf[tr.projectId]
    ? `<span class="fc-for">for ${esc(titleOf[tr.projectId])}</span>` : '';
  return `<li class="fcard">` +
    `<button class="fcard-btn track" data-track="${tr.id}" aria-pressed="false" aria-label="${esc(label)}">` +
    `<span class="fc-art">${art}<span class="fc-play t-btn" aria-hidden="true">${ICON_PLAY_LG}</span></span>` +
    `<span class="fc-meta"><span class="fc-title">${esc(tr.title)}</span>` +
    `<span class="fc-sub">${esc(tr.genre || '')}${tr.genre ? ' · ' : ''}${tr.duration}</span></span>` +
    `</button>${chip}</li>`;
}).join('\n');
const tracks = TRACKS.map((tr) => {
  const label = `Play ${tr.title}${tr.genre ? " — " + tr.genre : ""}`;
  const chip = tr.projectId && titleOf[tr.projectId] ? `<span class="t-for">for ${esc(titleOf[tr.projectId])}</span>` : "";
  const ext = tr.sunoUrl ? `<a class="t-ext" href="${tr.sunoUrl}">Suno ↗</a>`
    : tr.youtubeUrl ? `<a class="t-ext" href="${tr.youtubeUrl}">YouTube ↗</a>` : "";
  return `<li class="trackrow" data-row="${tr.id}">` +
    `<button class="track" data-track="${tr.id}" aria-pressed="false" aria-label="${esc(label)}">` +
    `<span class="t-btn" aria-hidden="true">${ICON_PLAY}</span>` +
    `<span class="t-title">${esc(tr.title)}</span>` +
    (tr.genre ? `<span class="t-genre">${esc(tr.genre)}</span>` : "") +
    `<span class="t-dur">${tr.duration}</span></button>${chip}${ext}</li>`;
}).join("\n");

/* ---- shelf ----
   Each book is a neon HUD panel rather than a coloured block: the accent
   cycles through the site's four neon hues so a shelf of any length keeps
   its rhythm, and `spine` overrides the cycle when a book wants its own. */
const SHELF_HUES = ["var(--sodium-hi)", "var(--cyan)", "var(--magenta)", "var(--violet)"];
const shelf = BOOKS.map((b, i) => {
  const hue = b.spine || SHELF_HUES[i % SHELF_HUES.length];
  const art = b.img ? ` sp-has-art" style="--c:${hue};--art:url(${b.img})` : `" style="--c:${hue}`;
  return `<button class="spine${art}" data-book="${b.id}" aria-expanded="false" aria-controls="note">` +
    `<span class="sp-frame" aria-hidden="true"></span>` +
    `<span class="sp-ticks" aria-hidden="true"></span>` +
    `<span class="sp-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>` +
    `<span class="sp-body"><span class="sp-t">${esc(b.title)}</span>` +
    `<span class="sp-a">${esc(b.author)}</span></span>` +
    `</button>`;
}).join("\n");

/* ---- splice ---- */
let html = readFileSync(join(root, "index.html"), "utf8");
const put = (name, content) => {
  const re = new RegExp(`(<!--BAKE:${name}-->)[\\s\\S]*?(<!--/BAKE:${name}-->)`);
  if (!re.test(html)) throw new Error("marker missing: " + name);
  html = html.replace(re, `$1\n${content}\n$2`);
};
put("hud", hud);
put("featured", featured);
put("grid", grid);
put("showall", showall);
put("featuredTracks", featuredTracks);
put("tracks", tracks);
put("shelf", shelf);
writeFileSync(join(root, "index.html"), html);
const nf = TRACKS.filter((t) => t.featured).length;
console.log(`baked: ${PROJECTS.length} projects (${live} live), ${TRACKS.length} tracks (${nf} featured), ${BOOKS.length} books`);
