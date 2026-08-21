/* GAM(E)S site data. English-only for launch; fields kept flat — if SL is
   ever added, mirror miha-site's {sl,en} object pattern per field. */

const SITE = {
  name: "Miha Gams",
  brand: "GAM(E)S",
  tagline: "Games, sites and music — built with AI.",
  url: "https://mihagams.vercel.app/",
  github: "https://github.com/mihagams-blip",
  linkedin: null,        // dormant slot
  email: "mihagams@gmail.com",
  sunoProfile: null,     // dormant slot
  youtube: null          // dormant slot
};

/* Full PROJECTS/TRACKS/BOOKS arrive in Phase 2; counts for the HUD are
   always computed from these arrays, never hardcoded. */
const PROJECTS = [];
const TRACKS = [];
const BOOKS = [];
