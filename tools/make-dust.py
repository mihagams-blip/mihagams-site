#!/usr/bin/env python3
"""Generate the dust-puff mask used by the shelf animation.

A 2x2 atlas of four different wisps: fractal value noise shaped by a radial
falloff, so each puff has real internal structure instead of being a blurred
circle. Emitted as an alpha mask — the CSS tints it with each book's accent,
so one small file serves every colour on the shelf.

    python3 tools/make-dust.py   ->  assets/dust.webp
"""
import math, os, random
from PIL import Image, ImageFilter

CELL, OCT = 256, 5


def value_noise(size, freq, rng):
    """Smoothed lattice noise as a flat list of floats."""
    g = [[rng.random() for _ in range(freq + 1)] for _ in range(freq + 1)]
    out = [0.0] * (size * size)
    step = size / freq
    for y in range(size):
        fy = y / step
        y0 = int(fy)
        ty = fy - y0
        sy = ty * ty * (3 - 2 * ty)
        row = y * size
        for x in range(size):
            fx = x / step
            x0 = int(fx)
            tx = fx - x0
            sx = tx * tx * (3 - 2 * tx)
            a = g[y0][x0] + (g[y0][x0 + 1] - g[y0][x0]) * sx
            b = g[y0 + 1][x0] + (g[y0 + 1][x0 + 1] - g[y0 + 1][x0]) * sx
            out[row + x] = a + (b - a) * sy
    return out


def puff(seed):
    rng = random.Random(seed)
    acc = [0.0] * (CELL * CELL)
    amp, freq = 1.0, 3
    for _ in range(OCT):
        n = value_noise(CELL, freq, rng)
        for i in range(len(acc)):
            acc[i] += n[i] * amp
        amp *= 0.52
        freq *= 2

    c = CELL / 2
    lo, hi = min(acc), max(acc)
    span = (hi - lo) or 1.0
    data = bytearray(CELL * CELL)
    for y in range(CELL):
        row = y * CELL
        dy = y - c
        for x in range(CELL):
            fall = 1.0 - math.hypot(x - c, dy) / c
            if fall <= 0:
                continue
            v = ((acc[row + x] - lo) / span) ** 1.5 * (fall ** 1.9)
            data[row + x] = int(255 * min(1.0, v))
    img = Image.frombytes("L", (CELL, CELL), bytes(data))
    return img.filter(ImageFilter.GaussianBlur(3))


atlas = Image.new("L", (CELL * 2, CELL * 2), 0)
for i, s in enumerate((11, 23, 37, 51)):
    atlas.paste(puff(s), ((i % 2) * CELL, (i // 2) * CELL))

rgba = Image.new("RGBA", atlas.size, (255, 255, 255, 0))
rgba.putalpha(atlas)
rgba.save("assets/dust.webp", "WEBP", quality=88, method=6)
print("assets/dust.webp", os.path.getsize("assets/dust.webp") // 1024, "KB", rgba.size)
