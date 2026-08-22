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
| `python3 tools/import-ronin.py <sheet.png>` | Same for the ronin's three poses, but aligned on their BOTTOM edge — his dangling foot is the anchor the eye tracks, so centring would make him twitch. |
| `python3 tools/import-busker.py <sheet.png>` | The same again for the guitarist on the Music heading. |

## Four characters on four headings

Each section heading has a rule under it, and a cyberpunk samurai lives on that
rule. Same construction every time — one sprite sheet, poses cycled by CSS
`steps()` on a long timer, never a GIF — and each is normalised by its own
`tools/import-*.py` onto a shared baseline so the figure never hops when the
pose changes.

| Section | Who | What he does | Every | Moving |
| --- | --- | --- | --- | --- |
| Writing | meditator | takes one breath; the halo swells and three motes leave on the exhale | 18s | 17% |
| Projects | swordsman | draws, cuts, sheathes — a blade arc trails the cut | 20s | 19% |
| Music | busker | plays four bars; rings widen out of the guitar | 18s | 16% |
| Books | ronin | smokes a pipe | 15s | 28% |

**The last column is the point.** These are characters who are mostly still and
occasionally move, not characters who fidget. The meditator originally ran a
continuously pulsing halo and a mote every 1.6s on an 8s cycle — a 100% duty
cycle, four to six times his siblings — and read as distracting rather than
calm. Everything he does is now timed off one 18s clock so the halo swells and
the motes leave *only* while he is actually breathing. If you add a fifth
character, keep it inside the 15-30% band; you can measure it by sampling
`getComputedStyle` across one cycle with `tools/probe.mjs`.

The characters are absolutely positioned against a shrink-wrapped title that
contains **both** the eyebrow and the heading. Two reasons, both learned the
hard way: in normal flow a tall figure inflates the heading's line box and
pushes the heading away from its eyebrow, and anchored to the heading alone it
sits on top of a longer eyebrow like "03 / THE SOUNDTRACK".

Every one of them is `aria-hidden`, untabbable, and disabled below 760px, and
`prefers-reduced-motion` collapses each to a single still frame with no
timers, no particles and no arcs.

## The busker on the soundtrack

A second ronin stands on the Music heading's rule with a guitar. Every 18
seconds he plays four bars — the pose alternates strum-down / lean-back twice
— and three concentric rings widen out of the guitar and fade, the sound
leaving the instrument.

Same construction as the shelf ronin: three poses in one sheet, cycled by CSS
`steps()`, normalised by `tools/import-busker.py` onto a shared bottom line so
his sandals stay planted between poses. Under `prefers-reduced-motion` he is a
single still frame and the rings never render.

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
above the list. The card whose track is playing lights up — the cover drifts in
and gains saturation, a light crawls across it, four small equaliser bars run
in the corner and the frame takes the magenta accent. It clears itself on
pause and moves to the other card when another track starts, because it keys
off the same `.is-playing` class `audio.js` already maintains on every control
for a track; nothing extra tracks state. Move the flag to change which four. Drop the artwork in as
`assets/covers/<id>.webp` (square, 600×600, ≤70 KB) and set `cover` +
`coverAlt` on that track; until then the card shows a typographic
placeholder. A featured track keeps its list row — both controls share one
play state, so pressing either shows pause on both.
