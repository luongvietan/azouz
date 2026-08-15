"""
Extract vector logo artwork from the client's Illustrator files.

Both .ai files are PDF-compatible containers of pure vector paths (no embedded
images, no embedded fonts), so PyMuPDF can emit clean SVG directly.

Page map, established by rendering each page during planning:
  azouz-logo.ai      p1 white-on-green   p2 white-on-white
                     p3 green-on-white   p4 green-on-black
  AzouzLogoBlack.ai  p1 black lockup, tightly cropped

Run once:  python scripts/extract-logo.py
Requires:  python -m pip install pymupdf
"""
import os
import re

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = ROOT
OUT = os.path.join(ROOT, "azouz-theme", "assets")

# The guidelines PDF is authoritative; the .ai file is one step off.
AI_GREEN = "#67995f"
BRAND_GREEN = "#67985e"


def tidy(svg: str) -> str:
    """Normalise brand green and drop the root's fixed pixel dimensions."""
    svg = re.sub(AI_GREEN, BRAND_GREEN, svg, flags=re.IGNORECASE)
    svg = re.sub(r'(<svg[^>]*?)\s+width="[^"]*"', r"\1", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\s+height="[^"]*"', r"\1", svg, count=1)
    return svg


def write(name: str, svg: str) -> None:
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(tidy(svg))
    print(f"wrote assets/{name} ({len(svg)} bytes)")


def ink_bbox(page) -> fitz.Rect:
    """Union of every drawn path's bounding box."""
    box = fitz.Rect()
    for drawing in page.get_drawings():
        box |= drawing["rect"]
    return box


def main() -> None:
    # --- Full lockup, three colourways -------------------------------------
    colour = fitz.open(os.path.join(SRC, "azouz-logo.ai"))
    write("logo-primary.svg", colour[2].get_svg_image(text_as_path=True))  # green on white
    write("logo-white.svg", colour[1].get_svg_image(text_as_path=True))    # white on white
    colour.close()

    black = fitz.open(os.path.join(SRC, "AzouzLogoBlack.ai"))
    page = black[0]
    media = page.mediabox
    pad = 1.0

    # Crop the lockup to ink so the SVG viewBox is the artwork, not the
    # artboard. The source page has extra horizontal margin; leaving it in
    # makes the lockup look wider than the wordmark and fails the aspect test.
    ink = ink_bbox(page)
    lockup = fitz.Rect(
        ink.x0 - pad, ink.y0 - pad, ink.x1 + pad, ink.y1 + pad
    ) & media
    page.set_cropbox(lockup)
    write("logo-black.svg", page.get_svg_image(text_as_path=True))
    page.set_cropbox(media)

    # --- Logomark: the wordmark alone, without "azouz coffee" --------------
    # Cluster path bounding boxes by vertical position. The wordmark is the
    # tall upper cluster; the strapline is the short lower one. The gap
    # between them is the largest vertical gap in the drawing list.
    rects = sorted((d["rect"] for d in page.get_drawings()), key=lambda r: r.y0)
    gaps = [
        (rects[i + 1].y0 - rects[i].y1, i)
        for i in range(len(rects) - 1)
        if rects[i + 1].y0 > rects[i].y1
    ]
    if not gaps:
        raise SystemExit("Could not find a gap between wordmark and strapline")
    _, split_index = max(gaps)

    wordmark = fitz.Rect()
    for rect in rects[: split_index + 1]:
        wordmark |= rect

    crop = fitz.Rect(
        wordmark.x0 - pad, wordmark.y0 - pad, wordmark.x1 + pad, wordmark.y1 + pad
    ) & media
    page.set_cropbox(crop)
    write("logomark.svg", page.get_svg_image(text_as_path=True))
    black.close()


if __name__ == "__main__":
    main()
