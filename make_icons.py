"""Generates the PWA icons (PNG) so no binaries need committing by hand.
Run by .github/workflows/icons.yml on every push that touches this file."""
from PIL import Image, ImageDraw, ImageFont
import os
def icon(size, maskable=False, out="x.png"):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for y in range(size):
        t = y / size; d.line([(0, y), (size, y)], fill=(int(228 + 27 * t), int(24 + 114 * t), int(124 + 70 * t), 255))
    if not maskable:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=255)
        im.putalpha(mask)
    f = None
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.exists(p): f = ImageFont.truetype(p, int(size * 0.6)); break
    bb = d.textbbox((0, 0), "Z", font=f); w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((size - w) / 2 - bb[0], (size - h) / 2 - bb[1] - size * 0.02), "Z", font=f, fill=(255, 255, 255, 255))
    im.save(out)
icon(180, out="icon-180.png"); icon(192, out="icon-192.png"); icon(512, out="icon-512.png"); icon(512, True, "icon-512-maskable.png")
print("icons generated")
