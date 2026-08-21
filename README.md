# GAM(E)S — mihagams.vercel.app

Personal site of **Miha Gams**: the games, sites and music he builds with AI —
presented as districts of one neon city. The surname is one letter short of
*games*; the hero sign flickers between the two readings.

## Stack

Static, no build step: `index.html` + `style.css` + three small vanilla JS
files. Node is not required to run or deploy.

| Piece | Notes |
| --- | --- |
| `js/data.js` | All content: projects (each with a personal "why"), Suno tracks, the bookshelf. HUD counts are computed from these arrays. |
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

**The shelf.** Each book is a neon HUD panel drawn in CSS — an accent
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
