#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps, ImageDraw, ImageFont


def fit_square(image, size):
    image = ImageOps.exif_transpose(image).convert("RGB")
    image = ImageEnhance.Color(image).enhance(1.08)
    image = ImageEnhance.Contrast(image).enhance(1.08)
    image = ImageEnhance.Sharpness(image).enhance(1.12)

    canvas = Image.new("RGB", (size, size), "white")
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    x = (size - image.width) // 2
    y = (size - image.height) // 2
    canvas.paste(image, (x, y))
    return canvas


def add_watermark(image, watermark_path, sku):
    out = image.convert("RGBA")
    watermark = Image.open(watermark_path).convert("RGBA")

    wm_width = int(out.width * 0.34)
    wm_height = int(watermark.height * (wm_width / watermark.width))
    watermark = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)

    alpha = watermark.getchannel("A").point(lambda p: int(p * 0.46))
    watermark.putalpha(alpha)
    out.alpha_composite(watermark, ((out.width - wm_width) // 2, (out.height - wm_height) // 2))

    draw = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype("arialbd.ttf", 34)
    except OSError:
        font = ImageFont.load_default()

    padding = 26
    text_padding_x = 18
    text_padding_y = 10
    bbox = draw.textbbox((0, 0), sku, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    box = (
        out.width - padding - tw - text_padding_x * 2,
        out.height - padding - th - text_padding_y * 2,
        out.width - padding,
        out.height - padding,
    )
    draw.rectangle(box, fill=(255, 255, 255, 232), outline=(196, 196, 196, 255), width=2)
    draw.text((box[0] + text_padding_x, box[1] + text_padding_y - 2), sku, fill=(22, 22, 22, 255), font=font)
    return out.convert("RGB")


def main():
    parser = argparse.ArgumentParser(description="Process Golden Collections product images.")
    parser.add_argument("--source-dir", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--sku", required=True)
    parser.add_argument("--slug", required=True)
    parser.add_argument("--watermark", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--size", type=int, default=2048)
    args = parser.parse_args()

    source_dir = Path(args.source_dir)
    out_dir = Path(args.out_dir)
    storefront_dir = out_dir / f"{args.sku}-storefront-watermarked"
    clean_dir = out_dir / f"{args.sku}-clean-feed"
    storefront_dir.mkdir(parents=True, exist_ok=True)
    clean_dir.mkdir(parents=True, exist_ok=True)

    candidates = list(source_dir.glob(f"{args.prefix}_*.JPG")) + list(source_dir.glob(f"{args.prefix}_*.jpg"))
    files = sorted({file_path.resolve(): file_path for file_path in candidates}.values())
    if not files:
        raise SystemExit(f"No images found for prefix {args.prefix} in {source_dir}")

    for index, file_path in enumerate(files, start=1):
        base = fit_square(Image.open(file_path), args.size)
        clean_name = f"{args.slug}-{args.sku.lower()}-{index}-clean.jpg"
        storefront_name = f"{args.slug}-{args.sku.lower()}-{index}.jpg"
        base.save(clean_dir / clean_name, "JPEG", quality=88, optimize=True, progressive=True)
        add_watermark(base, args.watermark, args.sku).save(
            storefront_dir / storefront_name,
            "JPEG",
            quality=88,
            optimize=True,
            progressive=True,
        )
        print(storefront_dir / storefront_name)


if __name__ == "__main__":
    main()
