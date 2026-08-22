# GAM(E)S — mihagams.vercel.app

Personal site of **Miha Gams**: the games, sites and music he builds with AI —
presented as districts of one neon city. The surname is one letter short of
*games*; the hero sign flickers between the two readings.

## Stack

Static, no build step: `index.html` + `style.css` + three small vanilla JS
files. Node is not required to run or deploy.

| Piece | Notes |
| --- | --- |
| `js/data.js` | All content: posts, projects (each with a personal "why"), Suno tracks, the bookshelf. HUD counts are computed from these arrays. |
| `js/main.js` | Hero video deferral, sticky nav + scrollspy, project cards, shelf, reveal-on-scroll. |
| `js/audio.js` | Web Audio player + skyline equaliser. Renders the list once; play state mutates in place so keyboard focus survives. |
| `assets/neon-city.mp4` | The hero loop — 1.76 MB H.264 (96 frames @ 12 fps), transcoded from a 10.6 MB animated WebP. |
| `fonts/bigshoulders-display.woff2` | 7.7 KB subset of Big Shoulders 800, the display face. |

## Performance & accessibility behavior

- The hero **poster (94 KB webp) is the LCP**; the video src is assigned only
  near-viewport, after `load`, in idle time — and **never** under
  `prefers-reduced-motion`, `Save-Data`, or `?static=1`.
- Audio is `preload="none"`; nothing downloads until first play.
- The idle equaliser wave runs only while the canvas is on screen.
- Spines and play controls are real buttons with `aria-expanded` /
  `aria-pressed`; the note panel is `aria-live`.
- Reduced motion = zero animation, zero video bytes, zero idle timers.

## Tools

| Script | What it does |
| --- | --- |
| `node tools/bake.mjs` | Splices `data.js` into `index.html` and writes `writing/*.html`. Run after any content edit. |
| `node tools/shot.mjs <url> <out.png> [js] [waitMs]` | Screenshots a page in a throwaway Chrome profile, optionally after running a snippet — this is how the in-game project cards were captured. |
| `node tools/probe.mjs <url> <js> [waitMs]` | Evaluates an expression in a fresh profile and prints the result. Use it instead of the browser console: a stale cached `main.js` has more than once made working code look broken. |
| `python3 tools/make-dust.py` | Regenerates `assets/dust.webp`, the shelf's dust-puff mask. |
| `python3 tools/import-rig.py <sheet.png>` | Normalises a generated SVETILEC sprite sheet into `assets/svetilec.webp` — four identical square cells at one shared scale, so the rig never jumps when it swaps pose. |
| `python3 tools/import-ronin.py <sheet.png>` | Same for the ronin's three poses, but aligned on their BOTTOM edge — his dangling foot is the anchor the eye tracks, so centring would make him twitch. |

## The ronin on the shelf

A cyberpunk samurai sits on the Books heading as if the rule under it were a
cliff edge: near leg tucked, far leg hanging 46px below the line. Every 15
seconds he raises the pipe, tips his head back and lets go of a puff of smoke.

Not a GIF — three poses in one sheet, cycled by CSS `steps()`, so the rhythm is
a number you can change and the whole thing drops to a single still frame under
`prefers-reduced-motion`. The smoke reuses `assets/dust.webp`, the shelf's own
mask.

One thing worth knowing if you touch it: the puff is a **flat fill shaped by
the mask**, not a radial gradient under a mask. Layering a fading gradient
beneath a wispy mask attenuates the alpha twice and the smoke simply vanishes
on a dark page.

## SVETILEC 00

A municipal sign-maintenance rig works the empty bands between sections. It
crosses at ~34 px/s, stops once or twice to check that a heading still lights
(work light on, a soft cone under it), and after its third job — or six
minutes — it makes one fast, dark, strut-down run and does not come back that
session. It went home.

Three things keep it from ever being a nuisance:

- the layer is `z-index: 0` while every section is `z-index: 1`, so it is
  structurally incapable of covering content — it slides *behind* cards the
  way a vehicle passes behind a building;
- it only flies in gaps tall enough to leave clear air above and below, and is
  disabled below 640px, so on a cramped screen it simply has nowhere to be;
- it never reacts to the pointer. `pointer-events: none`, no hover, not
  focusable, `aria-hidden`. It is on the clock, not performing.

Under `prefers-reduced-motion` it is one parked still with no timers at all,
and `?static=1` never constructs it or fetches the sprite. The sprite itself
is only fetched when the first crossing begins, so it costs nothing at load.

## Running locally

```bash
python3 -m http.server 8108
```

## Content updates

Everything editable lives in `js/data.js`. After editing it, run:

```bash
node tools/bake.mjs
```

This bakes the content into `index.html` (cards, tracks, shelf, HUD counts).
The page ships fully rendered HTML — JS is interactivity only, which is what
keeps CLS at a deterministic 0 and the content visible to crawlers. Adding a book = one object in
`BOOKS` (the shelf wraps and scales; `note: null` renders "Notes in
progress"). Adding a track = one object in `TRACKS` plus an mp3 in
`assets/audio/`. Project cards follow the same pattern.

**Writing.** `POSTS` in `js/data.js` drives both the preview row on the home
page and a generated page per post at `writing/<slug>.html` — `tools/bake.mjs`
writes them. Bodies are one string per paragraph; replace the Lorem Ipsum and
re-bake. Each post carries an accent from the same five-hue cycle as the shelf.

**The shelf.** It is one horizontal rail however many books there are: scroll
snapping, edge fades, arrow buttons, and a coverflow tilt driven by CSS
`animation-timeline: view(inline)` (absent browsers simply get a plain
scroller). At eight books or more it also loops — three copies of the run,
parked in the middle, jumping back a whole run when the reader drifts into a
clone, so the seam is never visible. Clones are `aria-hidden` and untabbable.

Each book is a neon HUD panel drawn in CSS — an accent
octagon with a second copy punched out in ink, plus a ticks layer. The
accent cycles amber → cyan → magenta → violet by position, so a shelf of
any length keeps its rhythm; set `spine` to a CSS colour to override one,
or `img` to put cover art behind the frame. Spines are a fixed height and
long titles wrap into a second column rather than towering. Opening a book
pulls it toward the reader in 3D (the shelf carries a `perspective`) and
blooms five puffs of dust around it, runs a light down the frame, tips the
books either side into the gap it left, and plays a short sound. All of it is
skipped under `prefers-reduced-motion`.

The dust is a generated texture, not blurred circles: `tools/make-dust.py`
writes `assets/dust.webp`, a 21 KB 2×2 atlas of four fractal-noise wisps. The
CSS uses it as a *mask*, so each puff keeps real internal structure while
still taking its book's accent colour — one file serves every hue. Re-run the
script to reshape them.

The sound is synthesised in `js/main.js`, not shipped as a file: a noise burst
through a bandpass sweeping 2.6 kHz → 700 Hz is the card sliding against its
neighbours, plus a quiet triangle blip pitched per book from a C-D-E-G-A
scale, so any two books sound consonant together. Closing plays the sweep in
reverse, quieter. The AudioContext is built inside the click, which satisfies
autoplay policy, and every failure is swallowed — the shelf has to work with
the speakers off.

**One CSS trap worth remembering:** the reveal-on-scroll utility must animate
the independent `translate` property, never `transform`. It sits late in the
stylesheet at the same specificity as component states like `.card:hover` and
`.spine[aria-expanded="true"]`, so writing `transform` there silently cancels
every one of them.

**Featured tracks.** Four tracks carry `featured: true` and get a cover card
above the list. Move the flag to change which four. Drop the artwork in as
`assets/covers/<id>.webp` (square, 600×600, ≤70 KB) and set `cover` +
`coverAlt` on that track; until then the card shows a typographic
placeholder. A featured track keeps its list row — both controls share one
play state, so pressing either shows pause on both.
