# Cover art for the featured tracks

Drop four square images here, then point `cover` at them in `js/data.js`
and run `node tools/bake.mjs`.

| Track | File to add | `cover` value |
| --- | --- | --- |
| Blade Smile | `blade-smile.webp` | `assets/covers/blade-smile.webp` |
| Fuego y Piel | `fuego-y-piel.webp` | `assets/covers/fuego-y-piel.webp` |
| A Blue Ember in the Dark | `a-blue-ember-in-the-dark.webp` | `assets/covers/a-blue-ember-in-the-dark.webp` |
| It's Made of Scars | `its-made-of-scars.webp` | `assets/covers/its-made-of-scars.webp` |

**Spec:** square 1:1, 600×600, WebP, ≤70 KB. The card crops to fill, so keep
the subject centred and leave the bottom-right corner quiet — the play button
sits there.

To convert whatever you generate:

```bash
python3 -c "from PIL import Image; im=Image.open('IN.png').convert('RGB'); im.thumbnail((600,600)); im.save('OUT.webp','WEBP',quality=80,method=6)"
```

Also set `coverAlt` — one plain sentence describing the image, for screen readers.
