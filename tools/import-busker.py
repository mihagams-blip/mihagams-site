#!/usr/bin/env python3
"""Normalise a generated busker sprite sheet into assets/busker.webp.

Three poses (idle / draw / exhale) must sit at ONE scale on a shared baseline,
or he twitches every time the pose swaps. So: split into three columns, measure
each pose's opaque bounds, scale them all by the same factor taken from the
largest, and align them on their BOTTOM edge (his dangling foot) rather than
centring — the foot is the anchor the eye tracks.

    python3 tools/import-ronin.py "~/Downloads/<sheet>.png"
"""
import os, sys
from PIL import Image

CELL, MARGIN = 512, 0.06
src = os.path.expanduser(sys.argv[1])
sheet = Image.open(src).convert("RGBA")
w, h = sheet.size
colw = w // 3
print("source:", sheet.size)

cells, boxes = [], []
for i in range(3):
    c = sheet.crop((i * colw, 0, (i + 1) * colw, h))
    bb = c.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bb is None:
        raise SystemExit(f"cell {i} is empty — wrong sheet?")
    cells.append(c); boxes.append(bb)
    print(f"cell {i}: {bb[2]-bb[0]}x{bb[3]-bb[1]} at {bb}")

maxw = max(b[2] - b[0] for b in boxes)
maxh = max(b[3] - b[1] for b in boxes)
avail = CELL * (1 - 2 * MARGIN)
scale = min(avail / maxw, avail / maxh)
print(f"shared scale: {scale:.3f}")

# common bottom line, so the dangling foot stays put between poses
bottom = CELL - round(CELL * MARGIN)

out = Image.new("RGBA", (CELL * 3, CELL), (0, 0, 0, 0))
for i, (c, bb) in enumerate(zip(cells, boxes)):
    crop = c.crop(bb)
    nw, nh = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    out.paste(crop, (i * CELL + (CELL - nw) // 2, bottom - nh), crop)

out = out.resize((1020, 340), Image.LANCZOS)
out.save("assets/busker.webp", "WEBP", quality=90, method=6)
print("assets/busker.webp", os.path.getsize("assets/ronin.webp") // 1024, "KB", out.size)
