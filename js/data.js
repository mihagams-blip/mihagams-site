/* GAM(E)S site data. English-only for launch; if SL is ever added, mirror
   miha-site's {sl,en} object pattern per field.
   HUD counts are computed from these arrays at render — never hardcoded. */

const SITE = {
  name: "Miha Gams",
  brand: "GAM(E)S",
  tagline: "A game, a site, a song — AI didn't give me the ideas, it gave me the hands to build them.",
  url: "https://mihagams.vercel.app/",
  github: "https://github.com/mihagams-blip",
  linkedin: null,        // dormant slot
  email: "mihagams@gmail.com",
  sunoProfile: "https://suno.com/@mihagams",
  youtube: null          // dormant slot
};

/* featured: true → big card row (order below is display order).
   url: null → card renders with no CTA (never a dead link). */
const PROJECTS = [
  {
    id: "steel-signal", featured: true,
    title: "Steel Signal", year: 2026, kind: "Game", group: "games",
    desc: "A turn-based hex wargame for the drone age — electronic warfare, strike drones and fragile supply lines.",
    why: "Panzer Corps taught me to love hexes; the drone war rewrote the rules. Nobody had built the sequel that understands both, so I did.",
    tags: ["Three.js", "strategy", "drones + EW"],
    url: "https://steel-signal-n43n.vercel.app/",
    repo: "https://github.com/mihagams-blip/steel-signal",
    img: "assets/projects/steel-signal.webp",
    imgAlt: "Steel Signal in play: hex map of the Vovcha river with the order of battle, sector minimap and comms log."
  },
  {
    id: "berem", featured: true,
    title: "BEREM", year: 2026, kind: "Game", group: "games",
    desc: "A Slovene reading game for first grade — nine modes from missing letters to dinosaurs and car brands.",
    why: "My first-grader was learning to read. The levels follow his school syllables, and the reward sounds are his own recorded voice.",
    tags: ["kids", "reading", "offline"],
    url: "https://berem.vercel.app/",
    repo: "https://github.com/mihagams-blip/berem",
    img: "assets/projects/berem.webp",
    imgAlt: "Colorful menu of reading-game modes on a pastel sky background."
  },
  {
    id: "front-office", featured: true,
    title: "Front Office", year: 2026, kind: "Game", group: "games",
    desc: "A basketball GM dynasty card game — draft, trade and coach a Slovenian club through the seasons.",
    why: "Basketball plus spreadsheets is my comfort food. I wanted the GM fantasy without the 4 GB install.",
    tags: ["React", "cards", "basketball"],
    url: "https://front-office-tau.vercel.app/",
    repo: "https://github.com/mihagams-blip/front-office",
    img: "assets/projects/front-office.webp",
    imgAlt: "Front Office game screen with a cream-colored management dashboard."
  },
  {
    id: "zadnji-spust", featured: true,
    title: "Zadnji spust", year: 2026, kind: "Game", group: "games",
    desc: "A cinematic pixel-art adventure in two acts — The Dig meets Foundation, with a shooter interlude.",
    why: "I grew up on LucasArts. This is my love letter: slow scenes, a radio voice, and music that knows when to go quiet.",
    tags: ["pixel art", "adventure", "procedural music"],
    url: null,
    repo: null,
    img: "assets/projects/zadnji-spust.webp",
    imgAlt: "Pixel-art title screen 'Final Descent' with a spacecraft over a ridge."
  },

  {
    id: "bad-orbit",
    title: "Bad Orbit", year: 2026, kind: "Game", group: "games",
    desc: "Bad North on a mini-planet: defend a rotating world from landing craft, squad by squad.",
    why: "Could a whole tactics battle fit on a planet the size of a marble? Turns out yes — and spinning it is half the fun.",
    tags: ["Three.js", "tactics"],
    url: "https://bad-orbit.vercel.app/",
    repo: "https://github.com/mihagams-blip/bad-orbit",
    img: "assets/projects/bad-orbit.webp",
    imgAlt: "Low-poly planet with the Bad Orbit title and a Defend button."
  },
  {
    id: "tvoj-premik",
    title: "Tvoj premik", year: 2026, kind: "Website", group: "web",
    desc: "Event site for a women's retreat at Lake Bled — waitlist, program and a calm, warm identity.",
    why: "A real client and a real weekend at Bled. Design to deploy to analytics, shipped by one person and an AI.",
    tags: ["event", "client work"],
    url: "https://tvojpremik.si/",
    repo: null,
    img: "assets/projects/tvoj-premik.webp",
    imgAlt: "Retreat landing page with a hero photo of two women by the lake."
  },
  {
    id: "neon-city",
    title: "Neon City Loop", year: 2026, kind: "Website", group: "web",
    desc: "A one-page gallery for a single animated cyberpunk frame — searchlights, window flicker, billboards.",
    why: "One animated frame deserved a whole page. Its skyline is now the sky above this site.",
    tags: ["animation", "art"],
    url: "https://neon-city-loop.vercel.app/",
    repo: "https://github.com/mihagams-blip/neon-city-loop",
    img: "assets/projects/neon-city.webp",
    imgAlt: "Neon-lit anime cityscape with searchlights and giant billboards."
  },
  {
    id: "minas-tirith",
    title: "Minas Tirith", year: 2026, kind: "Website", group: "web",
    desc: "A scrollytelling diorama of the White City, rebuilt phase by phase in Blender.",
    why: "I wanted to watch a city grow the way a chronicle reads — five phases, one slow scroll.",
    tags: ["Blender", "3D", "scrollytelling"],
    url: null,
    repo: "https://github.com/mihagams-blip/minastirith",
    img: "assets/projects/minas-tirith.webp",
    imgAlt: "White voxel citadel rising in terraced rings against black."
  },
  {
    id: "senbon-torii",
    title: "Senbon Torii", year: 2026, kind: "Website", group: "web",
    desc: "A first-person walk through a thousand vermilion gates, with light that shifts as you go.",
    why: "Fushimi Inari without the plane ticket. Walking meditation, rendered.",
    tags: ["Three.js", "3D walk"],
    url: "https://senbon-torii.vercel.app/",
    repo: null,
    img: "assets/projects/senbon-torii.webp",
    imgAlt: "Dark title screen reading 'Pot skozi tisoč vrat' with kanji."
  },
  {
    id: "oxa-spo2",
    title: "OXA SpO₂", year: 2026, kind: "Website", group: "web",
    desc: "Concept page for a sports SpO₂ wristband — 'every breath counts', from track to sleep.",
    /* SENSITIVE: personal version pending Miha's explicit approval.
       Neutral default ships until then. */
    why: "Exploring what a health wearable's story should feel like when the stakes are personal.",
    tags: ["concept", "health"],
    url: null,
    repo: null,
    img: "assets/projects/oxa-spo2.webp",
    imgAlt: "Product page hero reading 'Every breath counts' with a dark wristband."
  },
  {
    id: "vidim-cilj",
    title: "Vidim cilj", year: 2026, kind: "Website", group: "web",
    desc: "Site for a charity running free sport programmes for blind and visually impaired people since 2011.",
    why: "For athletes who can't see the finish line and aim for it anyway. Contrast, text size and focus order are the whole point here, not a checkbox.",
    tags: ["charity", "accessibility", "WCAG"],
    url: null,
    repo: null,
    img: "assets/projects/vidim-cilj.webp",
    imgAlt: "Vidim cilj homepage with the headline Skupaj vidimo cilj beside an illustration of a tandem bike by the sea."
  },
  {
    id: "igrica-raketa",
    title: "Raketa nad mestom", year: 2026, kind: "Game", group: "games",
    desc: "A pixel arcade rocket for two brothers — dodge, land, refuel, brag.",
    why: "My sons asked for a rocket game over breakfast. Version two shipped by the weekend.",
    tags: ["arcade", "kids"],
    url: "https://igrica-raketa.vercel.app/",
    repo: null,
    img: "assets/projects/igrica-raketa.webp",
    imgAlt: "Retro pixel city at night with a small rocket sprite."
  }
];

/* Audio is preload:none — nothing downloads until first play.
   All of these live on Suno too: SITE.sunoProfile. */
const TRACKS = [
  { id: "night-grid-advance", title: "Night Grid Advance", genre: "synthwave",
    duration: "1:28", src: "assets/audio/night-grid-advance.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: "neon-city" },
  { id: "kintsugi-pulse", title: "Kintsugi Pulse", genre: "ambient",
    duration: "2:48", src: "assets/audio/kintsugi-pulse.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: "senbon-torii" },
  { id: "celestial-folk-suite", title: "Celestial Folk Suite", genre: "folk orchestral",
    duration: "2:49", src: "assets/audio/celestial-folk-suite.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: "minas-tirith" },
  { id: "cardboard-dynasty", title: "Cardboard Dynasty", genre: "indie rock",
    duration: "0:51", src: "assets/audio/cardboard-dynasty.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: "front-office" },
  { id: "the-gilded-march", title: "The Gilded March", genre: "epic march",
    duration: "3:10", src: "assets/audio/the-gilded-march.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "hikari-no-hoteishiki", title: "\u5149\u306e\u65b9\u7a0b\u5f0f", genre: "J-pop",
    duration: "4:34", src: "assets/audio/hikari-no-hoteishiki.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "the-fire-is-coming", title: "The Fire Is Coming", genre: "epic",
    duration: "4:12", src: "assets/audio/the-fire-is-coming.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "hold-the-line", title: "Hold the Line", genre: "anthem",
    duration: "3:32", src: "assets/audio/hold-the-line.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "blade-smile", title: "Blade Smile", genre: "dark pop",
    duration: "3:29", src: "assets/audio/blade-smile.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "the-witch-hunter", title: "The Witch Hunter", genre: "folk metal",
    duration: "3:22", src: "assets/audio/the-witch-hunter.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "we-hold-the-spark", title: "We Hold the Spark", genre: "anthem",
    duration: "3:12", src: "assets/audio/we-hold-the-spark.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "im-the-only-one", title: "I'm the Only One", genre: "rock",
    duration: "3:08", src: "assets/audio/im-the-only-one.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "fuego-y-piel", title: "Fuego y Piel", genre: "latin",
    duration: "3:03", src: "assets/audio/fuego-y-piel.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "umdetsi-stu-det", title: "Umdetsi-stu-det", genre: "experimental",
    duration: "3:01", src: "assets/audio/umdetsi-stu-det.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "the-last-echo", title: "The Last Echo", genre: "cinematic",
    duration: "2:47", src: "assets/audio/the-last-echo.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "eclipse-of-the-spiral-sun", title: "Eclipse of the Spiral Sun", genre: "prog",
    duration: "2:39", src: "assets/audio/eclipse-of-the-spiral-sun.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null },
  { id: "stiff-upper-lip", title: "Stiff Upper Lip", genre: "rock",
    duration: "2:28", src: "assets/audio/stiff-upper-lip.mp3",
    sunoUrl: null, youtubeUrl: null, projectId: null }
];

/* Sample entries (Miha will replace/extend — the shelf is built to grow).
   spine: color hex from the site palette; img: optional spine texture. */
const BOOKS = [
  { id: "meditations", title: "Meditations", author: "Marcus Aurelius",
    spine: "#9DBEF2", img: null,
    note: "A Roman emperor's private notebook, and still the best manual for a loud century. Read slowly, twice." },
  { id: "sapiens", title: "Sapiens", author: "Yuval Noah Harari",
    spine: "#E8873A", img: null,
    note: "The trick that built the world: strangers cooperating around shared stories. Explains money, gods and brands in one move." },
  { id: "thinking-fast-slow", title: "Thinking, Fast and Slow", author: "Daniel Kahneman",
    spine: "#D96BA8", img: null,
    note: "Two systems, one owner, constant arguments. The book that made me distrust my first answer — usefully." }
];
