# Cover art for the featured tracks

Drop four square images here, then point `cover` at them in `js/data.js`
and run `node tools/bake.mjs`.

| Track | File to add | `cover` value |
| --- | --- | --- |
| Night Grid Advance | `night-grid-advance.webp` | `assets/covers/night-grid-advance.webp` |
| Kintsugi Pulse | `kintsugi-pulse.webp` | `assets/covers/kintsugi-pulse.webp` |
| Celestial Folk Suite | `celestial-folk-suite.webp` | `assets/covers/celestial-folk-suite.webp` |
| The Fire Is Coming | `the-fire-is-coming.webp` | `assets/covers/the-fire-is-coming.webp` |

**Spec:** square 1:1, 600×600, WebP, ≤70 KB. The card crops to fill, so keep
the subject centred and leave the bottom-right corner quiet — the play button
sits there.

To convert whatever you generate:

```bash
python3 -c "from PIL import Image; im=Image.open('IN.png').convert('RGB'); im.thumbnail((600,600)); im.save('OUT.webp','WEBP',quality=80,method=6)"
```

Also set `coverAlt` — one plain sentence describing the image, for screen readers.
