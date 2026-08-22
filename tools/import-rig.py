#!/usr/bin/env python3
"""Normalise a generated SVETILEC sprite sheet into assets/svetilec.webp.

The generator returns four poses in one row at whatever aspect it likes, each
loosely placed. The runtime needs four IDENTICAL square cells at one scale, or
the rig jumps when it swaps pose. So: split into four columns, measure each
pose's opaque bounds, fit them all with ONE scale factor derived from the
largest, and centre each on its own cell using a shared vertical anchor.

    python3 tools/import-rig.py "~/Downloads/<sheet>.png"
"""
import os, sys
from PIL import Image

CELL, MARGIN = 512, 0.08
src_path = os.path.expanduser(sys.argv[1])
sheet = Image.open(src_path).convert("RGBA")
w, h = sheet.size
colw = w // 4

cells, boxes = [], []
for i in range(4):
    c = sheet.crop((i * colw, 0, (i + 1) * colw, h))
    bb = c.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bb is None:
        raise SystemExit(f"cell {i} is empty — is this the right sheet?")
    cells.append(c)
    boxes.append(bb)
    print(f"cell {i}: bbox {bb}  size {bb[2]-bb[0]}x{bb[3]-bb[1]}")

# one scale for all four, from the widest/tallest pose
maxw = max(b[2] - b[0] for b in boxes)
maxh = max(b[3] - b[1] for b in boxes)
avail = CELL * (1 - 2 * MARGIN)
scale = min(avail / maxw, avail / maxh)
print(f"common scale: {scale:.3f}")

out = Image.new("RGBA", (CELL * 4, CELL), (0, 0, 0, 0))
for i, (c, bb) in enumerate(zip(cells, boxes)):
    crop = c.crop(bb)
    nw, nh = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    out.paste(crop, (i * CELL + (CELL - nw) // 2, (CELL - nh) // 2), crop)

out = out.resize((1024, 256), Image.LANCZOS)
out.save("assets/svetilec.webp", "WEBP", quality=90, method=6)
print("assets/svetilec.webp", os.path.getsize("assets/svetilec.webp") // 1024, "KB", out.size)
