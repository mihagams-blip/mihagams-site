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
and `?static=1` never constructs it or fetches the sprite.
`.sky` is pure CSS and cannot read a query string, so `main.js` sets
`data-static` on `<html>` and one rule turns its animations off — the switch is
documented as freezing the page and has to stay true for every layer. The sprite itself
is only fetched when the first crossing begins, so it costs nothing at load.

## The city continues

Below the fold the page used to be flat black. `.sky` is a fixed layer behind
everything that continues the hero's world — the same city, seen from much
higher above it — as five planes that drift up at different rates while you
scroll:

| Plane | What it is | Travel | px per screenful @1280x800 |
| --- | --- | --- | --- |
| `.sky-stars` | 26 points on a 760x620 tile | 8vh | 7 |
| `.sky-far` | seven tower bands on prime periods | 18vh | 17 |
| `.sky-beams` | three searchlights | 30vh | 27 |
| `.sky-near` | near rooftops, painted in ink | 44vh | 40 |
| `.sky-grain` | the hero's scanline, static | 0 | 0 |

The ratios are 1 : 2.25 : 3.75 : 5.5. Each plane is anchored
`bottom: -(its own travel)`, so at the top of the page the far skyline is a
hint at the bottom edge and the near rooftops are entirely off-screen; by the
footer the city has risen into frame. Scrolling down reads as descending
toward it.

**No JavaScript, no timer, no rAF, no image file.** It is driven entirely by
`animation-timeline: scroll(root block)`, the same construction as the shelf.
The site already runs one perpetual 60fps callback for SVETILEC and a second
one was not affordable. A welcome consequence: nothing moves while the page is
idle.

### The one number

`--dim` (#8B7C99) on `--ink` (#0A0710) is 5.18:1, and AA needs 4.50 — so this
layer has **0.68 of contrast headroom**. Since `main section` has no
background, *the sky is the background of that body text*. Solving for where
`--dim` hits 4.50 gives a hard ceiling:

> **No pixel of `.sky` may exceed relative luminance L = 0.0105.**

Every alpha in the block is picked against it. Measured on the isolated layer
across **six viewport widths (375-3440px) x five scroll positions**: worst pixel
anywhere L 0.00889, worst text contrast 4.62:1, median = plain ink, and 24% of
the frame carries visible structure.

**Measure the sweep, not one viewport.** An earlier version of this note claimed
the worst case was "two beam cores crossing" at 1280x800. That was wrong twice
over. The real worst case is a coincidence of `.sky-far`'s seven tower bands,
and because the bands repeat in fixed px while the element scales with the
viewport, a wider screen simply puts more coincidences on screen: 3440x1440
measured L 0.01080 and a contrast of 4.475:1 — over this ceiling and *under
AA* — while 1280x800 measured 4.58 and looked fine. A spot-check at one width
structurally cannot see this. `tools/sweep.mjs` drives it — one Chrome per width,
with a timeout on every CDP call, using device-metrics emulation to get past
the ~500px minimum window width headless Chrome enforces on macOS. It ran as a
single shared session once; one hung call killed the process with "unsettled
top-level await" after the 1280 pass, silently dropping the two widest
viewports the sweep exists to cover. A verification tool that can fail
invisibly is worse than none.

The first pass came in at max L 0.00852 / 4.65:1 but only 17% structure, and
Miha could not see it at all on a 15-inch laptop — "barely noticeable" had
overshot into invisible. `--sky-gain` was already 1, so the fix was not a dial.
Three moves bought visibility, and the first two are free:

1. **Taller towers.** Height puts more silhouette on screen and costs no peak
   luminance at all.
2. **Deeper rooftops.** The near plane is painted in ink, so making it *darker*
   carves structure with negative luminance — it improves text contrast rather
   than spending it. This is the lever to reach for first.
3. A modest alpha lift on the tower bands, and **wider** rather than brighter
   searchlights — area is free, peak is not.

The sodium glow is the single brightest thing in the layer and therefore the
one thing that must not grow: it was pushed *down* (`at 50% 126%`) so its hot
core sits below the fold. Raising it from .070 to .076 alone cost 0.11 of
contrast for no structural gain, which is the whole trade in one number. Two structural
properties rather than luck hold that line: the beam mask is transparent
across its bottom 18% (the shaft is hidden by the buildings it rises from), so
the brightest beam pixel can never land on the brightest glow pixel; and the
nearest, largest, fastest plane is painted in `rgba(10,7,16,...)`, so it can
only ever *subtract* light. **If you add or brighten anything here,
re-measure** — isolate the layer with `tools/shot.mjs` and convert to relative
luminance. `--sky-gain` scales the whole layer, animation included, from one
place.

### Measuring this layer: use a real GPU

`tools/probe.mjs` and `tools/shot.mjs` both force
`--use-angle=swiftshader`, and so does every local Lighthouse run. Software
rendering turns a full-viewport composited layer into CPU work, which makes
this block look expensive when it is not. Measured over a scripted scroll:

| | median frame | 
| --- | --- |
| swiftshader, no sky | 16.7 ms |
| swiftshader, five planes | 31.0 ms |
| **hardware GPU, no sky** | **16.6 ms** |
| **hardware GPU, five planes** | **16.7 ms** |

On a real GPU the layer is rastered once and thereafter only translated, so it
costs nothing — both runs sit on the 60fps vsync line. Local Lighthouse
perf scores swing 74-93 on the *unmodified* site for the same reason; don't
read a few points either way as signal. Drop the swiftshader flags when you
need a true frame-cost number.

### Two traps this block has already stepped in

- **`.sky > i` is (0,1,1) and out-specifies a bare `.sky-stars` (0,1,0).**
  Overrides of `display` or `background-repeat` must be written
  `.sky > i.sky-x` or they silently lose. This cost a non-tiling star field
  and a mobile media query that did nothing.
- **Prime periods defeat repetition; they say nothing about phase.** All seven
  `.sky-far` bands originally began their opaque run at x=0, so all seven
  coincided there by construction — a 0.44 composite. Since `.sky-far` is inset
  `left:-6%`, that stack cleared the viewport only when `0.06*W >= 46px`, which
  painted a hard-edged bright stripe welded to the left edge of every screen
  under 767px wide. The leading `transparent 0 Npx` in each band is the fix, and
  the offsets (24/90/210/156/106/8/17) were **solved for**: they minimise the
  worst composite over 3600px of x, bounding the stack at 0.232 by construction
  instead of by spot-check, and leave no band over x=0 at all. Changing any
  period, width or offset invalidates that search — re-run it.
- **Never declare `opacity:0` on `.sky` inside the `@supports` block.**
  `animation-fill-mode: both` already holds the `from` frame, and the
  declaration would be the one way the layer could go permanently invisible if
  the timeline failed to attach.

Everything outside `@supports` **is** the 100% frame, so a reduced-motion
visitor and every Firefox visitor (Gecko still ships
`animation-timeline: scroll()` in preview only) sees the *composed* city
rather than a stripped one — verified with Chrome's
`--force-prefers-reduced-motion`. That is also why this block has no
`prefers-reduced-motion: reduce` rules: one set of numbers serves both the
animated end state and the fallback, so they cannot drift apart. Unlike
`.rig-layer` it does **not** clip 48px off the top; the rig is a bright
discrete object that looked wrong through the sticky nav, whereas a hard
horizontal cut across a diffuse field is more visible than the field itself.

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
