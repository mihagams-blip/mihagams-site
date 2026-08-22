#!/usr/bin/env python3
"""Normalise the five-pose swordsman sheet into assets/kensei.webp.

The generator ignores the requested canvas and returns everything in its own
3:1 frame, so the source cells are tall rather than square. That does not
matter: we split into five equal columns, measure each figure, scale them ALL
by one factor taken from the largest, and stand them on a shared bottom line —
his boots are the anchor, and a per-pose recentre would make him hop.

    python3 tools/import-kensei.py "~/Downloads/kensei-sheet.png"
"""
import os, sys
from PIL import Image

CELL, MARGIN, N = 512, 0.06, 5
src = os.path.expanduser(sys.argv[1])
sheet = Image.open(src).convert("RGBA")
w, h = sheet.size
colw = w // N
print("source:", sheet.size, "-> cells of", colw, "x", h)

cells, boxes = [], []
for i in range(N):
    c = sheet.crop((i * colw, 0, (i + 1) * colw, h))
    bb = c.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bb is None:
        raise SystemExit(f"cell {i} is empty — wrong sheet?")
    cells.append(c); boxes.append(bb)
    print(f"cell {i}: {bb[2]-bb[0]}x{bb[3]-bb[1]}")

maxw = max(b[2] - b[0] for b in boxes)
maxh = max(b[3] - b[1] for b in boxes)
avail = CELL * (1 - 2 * MARGIN)
scale = min(avail / maxw, avail / maxh)
print(f"shared scale: {scale:.3f}")

bottom = CELL - round(CELL * MARGIN)
out = Image.new("RGBA", (CELL * N, CELL), (0, 0, 0, 0))
for i, (c, bb) in enumerate(zip(cells, boxes)):
    crop = c.crop(bb)
    nw, nh = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    out.paste(crop, (i * CELL + (CELL - nw) // 2, bottom - nh), crop)

out = out.resize((1700, 340), Image.LANCZOS)
out.save("assets/kensei.webp", "WEBP", quality=90, method=6)
print("assets/kensei.webp", os.path.getsize("assets/kensei.webp") // 1024, "KB", out.size)
