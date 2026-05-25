#!/usr/bin/env python
"""Build a visual review contact sheet for deity long haram image positions 2-4."""

from __future__ import annotations

import json
import textwrap
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
OUT_DIR = ROOT / "tmp" / "deity-long-haram-ucp-sprint"
SOURCE = OUT_DIR / "long-haram-visual-review.json"
IMAGE_DIR = OUT_DIR / "visual-review-images"
OUT_PATH = OUT_DIR / "long-haram-visual-review-contact-sheet.jpg"
MAX_IMAGES = 45
THUMB_W = 300
THUMB_H = 300
LABEL_H = 116
PAD = 16
COLS = 3


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    rows = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = prioritize(rows)[:MAX_IMAGES]
    thumbs = []
    for row in rows:
        try:
            thumbs.append(render_tile(row))
        except Exception as exc:
            print(f"Skipping {row.get('sku')} pos {row.get('position')}: {exc}")
    if not thumbs:
        raise SystemExit("No rows found for contact sheet.")

    sheet_w = COLS * (THUMB_W + PAD) + PAD
    sheet_h = ((len(thumbs) + COLS - 1) // COLS) * (THUMB_H + LABEL_H + PAD) + PAD
    sheet = Image.new("RGB", (sheet_w, sheet_h), "white")
    for idx, tile in enumerate(thumbs):
        x = PAD + (idx % COLS) * (THUMB_W + PAD)
        y = PAD + (idx // COLS) * (THUMB_H + LABEL_H + PAD)
        sheet.paste(tile, (x, y))
    sheet.save(OUT_PATH, quality=88)
    print(f"Wrote {OUT_PATH}")


def prioritize(rows: list[dict]) -> list[dict]:
    def key(row: dict) -> tuple[int, int, str, int]:
        return (
            0 if row.get("ucpTopResult") else 1,
            0 if row.get("proofTier") == "Tier 2" else 1,
            str(row.get("sku") or row.get("title") or ""),
            int(row.get("position") or 99),
        )

    return sorted(rows, key=key)


def render_tile(row: dict) -> Image.Image:
    image = load_image(row)
    image.thumbnail((THUMB_W, THUMB_H), Image.LANCZOS)
    tile = Image.new("RGB", (THUMB_W, THUMB_H + LABEL_H), "white")
    x = (THUMB_W - image.width) // 2
    y = (THUMB_H - image.height) // 2
    tile.paste(image, (x, y))

    draw = ImageDraw.Draw(tile)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
        small = ImageFont.truetype("arial.ttf", 12)
    except OSError:
        font = ImageFont.load_default()
        small = font

    label = [
        f"{row.get('sku') or ''} pos {row.get('position')} | {row.get('proofTier')}",
        str(row.get("title") or "")[:56],
        f"alt: {str(row.get('altText') or '(blank)')[:64]}",
        f"file: {str(row.get('filename') or '')[:64]}",
    ]
    yy = THUMB_H + 6
    for line in label:
        for wrapped in textwrap.wrap(line, width=44)[:2]:
            draw.text((6, yy), wrapped, fill="black", font=font if yy == THUMB_H + 6 else small)
            yy += 18
    draw.rectangle((0, 0, THUMB_W - 1, THUMB_H + LABEL_H - 1), outline=(210, 210, 210))
    return tile


def load_image(row: dict) -> Image.Image:
    image_id = str(row.get("imageLegacyId") or row.get("imageId") or "image")
    path = IMAGE_DIR / f"{row.get('sku') or row.get('handle')}-{row.get('position')}-{image_id}.jpg"
    if not path.exists():
        req = urllib.request.Request(str(row["url"]), headers={"User-Agent": "GoldenCollectionsProofAudit/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
        path.write_bytes(data)
    with Image.open(path) as im:
        return im.convert("RGB")


if __name__ == "__main__":
    main()
