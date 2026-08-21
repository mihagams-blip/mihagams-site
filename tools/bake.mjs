#!/usr/bin/env node
/* Bake js/data.js into index.html between <!--BAKE:name--> markers.
   Run after any data.js edit:  node tools/bake.mjs
   The page then ships fully rendered HTML; the runtime JS only adds
   interactivity (video, player, shelf, nav). */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataSrc = readFileSync(join(root, "js/data.js"), "utf8");
const { SITE, PROJECTS, TRACKS, BOOKS, POSTS } =
  new Function(dataSrc + "; return { SITE, PROJECTS, TRACKS, BOOKS, POSTS };")();

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

/* ---- writing ----
   The row here is previews only; each post also gets its own page written to
   writing/<slug>.html from the same data, so the section stays small and the
   reading happens somewhere with room for it. */
const niceDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  return `${months[m - 1]} ${d}, ${y}`;
};
const POST_HUES = ["var(--beam)", "var(--magenta)", "var(--sodium-hi)", "var(--cyan)", "var(--violet)"];

const writing = POSTS.map((p, i) => {
  const hue = POST_HUES[i % POST_HUES.length];
  return `<li class="post" style="--c:${hue}">` +
    `<a class="post-link" href="writing/${p.slug}.html">` +
    `<span class="post-meta"><span class="post-tag">${esc(p.tag)}</span>` +
    `<time datetime="${p.date}">${niceDate(p.date)}</time></span>` +
    `<h3 class="post-title">${esc(p.title)}</h3>` +
    `<p class="post-ex">${esc(p.excerpt)}</p>` +
    `<span class="post-more">${p.readMins} min read <i aria-hidden="true">&#8594;</i></span>` +
    `</a></li>`;
}).join("\n");

function postPage(p, i, prevP, nextP) {
  const hue = POST_HUES[i % POST_HUES.length];
  const body = p.body.map((par) => `      <p>${esc(par)}</p>`).join("\n");
  const nav = [
    prevP ? `<a class="pn prev" href="${prevP.slug}.html"><span>Newer</span>${esc(prevP.title)}</a>` : "",
    nextP ? `<a class="pn next" href="${nextP.slug}.html"><span>Older</span>${esc(nextP.title)}</a>` : "",
  ].filter(Boolean).join("\n      ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)} — GAM(E)S</title>
<meta name="description" content="${esc(p.excerpt)}">
<link rel="canonical" href="${SITE.url}writing/${p.slug}.html">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.excerpt)}">
<meta property="og:type" content="article">
<meta property="og:image" content="${SITE.url}assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230A0710'/%3E%3Cpath d='M8 5h2v3H8zm2 3h2v3h-2zm2 3h2v3h-2zm2 3h2v4h-2zM24 5h-2v3h2zm-2 3h-2v3h2zm-2 3h-2v3h2zm-2 3h-2v4h2zM12 17h8v4h-8zm1 4h2v4h-2zm4 0h2v4h-2zm-2 4h2v3h-2z' fill='%23F3B269'/%3E%3C/svg%3E">
<link rel="stylesheet" href="../style.css">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BlogPosting","headline":${JSON.stringify(p.title)},
 "datePublished":"${p.date}","author":{"@type":"Person","name":${JSON.stringify(SITE.name)}},
 "mainEntityOfPage":"${SITE.url}writing/${p.slug}.html"}
</script>
</head>
<body class="reading" style="--c:${hue}">
<a class="skip" href="#article">Skip to the article</a>

<nav class="stickynav on" aria-label="Main">
  <a class="mark" href="../index.html" aria-label="Back to GAM(E)S">
    <i style="background:var(--sodium)"></i><i style="background:var(--magenta)"></i><i style="background:var(--beam)"></i>
  </a>
  <a href="../index.html#writing">&#8592; All writing</a>
</nav>

<main class="article-wrap">
  <article id="article" class="article">
    <p class="eyebrow"><span class="post-tag">${esc(p.tag)}</span>
      <time datetime="${p.date}">${niceDate(p.date)}</time> · ${p.readMins} min read</p>
    <h1>${esc(p.title)}</h1>
    <p class="lede">${esc(p.excerpt)}</p>
    <div class="article-body">
${body}
    </div>
  </article>

  <nav class="postnav" aria-label="More writing">
      ${nav}
  </nav>
</main>

<footer class="outro">
  <div class="outro-body">
    <p class="outro-line">Gams is Slovenian for chamois — and one letter short of games.</p>
    <div class="links">
      <a href="../index.html">Back to the city</a>
      <a href="${SITE.github}" rel="me">GitHub</a>
      <a href="mailto:${SITE.email}">Email</a>
    </div>
    <p class="colophon">&copy; 2026 ${esc(SITE.name)}</p>
  </div>
</footer>
</body>
</html>
`;
}

/* ---- shelf ----
   Each book is a neon HUD panel rather than a coloured block: the accent
   cycles through the site's four neon hues so a shelf of any length keeps
   its rhythm, and `spine` overrides the cycle when a book wants its own. */
const SHELF_HUES = ["var(--sodium-hi)", "var(--cyan)", "var(--magenta)", "var(--violet)"];
const shelf = BOOKS.map((b, i) => {
  const hue = b.spine || SHELF_HUES[i % SHELF_HUES.length];
  const art = b.img ? ` sp-has-art" style="--c:${hue};--art:url(${b.img})` : `" style="--c:${hue}`;
  return `<button class="spine${art}" data-book="${b.id}" aria-expanded="false" aria-controls="note">` +
    `<span class="sp-mist" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>` +
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
put("writing", writing);
put("featured", featured);
put("grid", grid);
put("showall", showall);
put("featuredTracks", featuredTracks);
put("tracks", tracks);
put("shelf", shelf);
writeFileSync(join(root, "index.html"), html);

mkdirSync(join(root, "writing"), { recursive: true });
POSTS.forEach((p, i) => {
  writeFileSync(join(root, "writing", `${p.slug}.html`),
    postPage(p, i, POSTS[i - 1], POSTS[i + 1]));
});
const nf = TRACKS.filter((t) => t.featured).length;
console.log(`baked: ${PROJECTS.length} projects (${live} live), ${TRACKS.length} tracks (${nf} featured), ${BOOKS.length} books, ${POSTS.length} posts`);
