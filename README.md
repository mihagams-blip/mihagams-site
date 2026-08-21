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
long titles wrap into a second column rather than towering.

**Featured tracks.** Four tracks carry `featured: true` and get a cover card
above the list. Move the flag to change which four. Drop the artwork in as
`assets/covers/<id>.webp` (square, 600×600, ≤70 KB) and set `cover` +
`coverAlt` on that track; until then the card shows a typographic
placeholder. A featured track keeps its list row — both controls share one
play state, so pressing either shows pause on both.
