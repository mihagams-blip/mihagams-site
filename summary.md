# Summary — GAM(E)S personal site

## What this is
Miha Gams' personal site: 12 AI-built projects (each with a personal
"why I made it"), 17 Suno tracks with a live skyline equaliser, a growing
bookshelf, and a one-sentence outro. Identity: the GAM(E)S neon sign —
the flickering (E) swings the name between GAMS and GAMES over the
Neon City animated hero.

## Decisions of record
- Featured four (Miha's pick): Steel Signal, BEREM, Front Office, Zadnji spust.
  Darilnik and Dino Akademija cut. No filter chips. Mobile grid: 4 + "Show all".
- Front Office links to front-office-tau.vercel.app (the better of his two builds).
- Steel Signal's card is gameplay, not the briefing screen — captured with
  `tools/shot.mjs`, which drives headless Chrome over CDP to click past menus.
- Vidim cilj's card comes from the current local build, not the old live one.
- 17 Suno tracks; the list scrolls so Books stays within reach.
- The footer chamois is the real voxel model, spinnable.
- Books: 3 AI-sample entries for now; Miha adds his own over time
  (the shelf wraps and scales; `note:null` → "Notes in progress").
- LinkedIn / YouTube / Suno links: dormant slots, render only when filled.
- OXA's "why" ships in the neutral form until Miha explicitly approves
  a personal one.
- Display face: Big Shoulders 800 (7.7 KB subset, inlined as data URI).

## Architecture
Static, no framework. Content lives in `js/data.js`; `node tools/bake.mjs`
splices it into `index.html` (BAKE markers). JS is interactivity only:
video deferral, player, shelf, nav, reveal. This was the fix for a racy
0.65 CLS — content now paints as HTML on the first frame.

## Verified (local, python http.server — no compression)
- Lighthouse ×4 consecutive: **Perf 96 / A11y 100 / BP 100 / SEO 100**,
  CLS 0, TBT 0 ms. (Production on Vercel should only improve LCP.)
- Reduced-motion / `?static=1`: zero video bytes, zero animation, no idle
  timers (network-log proof).
- Keyboard: skip link first, decorative video excluded, only live cards
  focusable, player and shelf keep focus through state changes
  (activeElement checks), aria-pressed / aria-expanded / aria-live wired.
- Hero video: 10.6 MB webp → **1.76 MB H.264**, all 96 frames verified.

## Open (post-deploy, none blocking)
- Miha: real books + notes, Suno/YouTube links, LinkedIn, why-line review
  (OXA especially), backdrop/shelf AI images (shot list in plan), custom domain.
- Production Lighthouse + OG validation after first deploy.
