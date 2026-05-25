from __future__ import annotations

import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\hp\Downloads\WhatsApp Video 2026-05-20 at 1.06.12 PM.mp4")
OUT_DIR = ROOT / "tmp" / "anil-full-crown-fit-video"
OVERLAY_DIR = OUT_DIR / "overlays"
CAPTION_DIR = OUT_DIR / "captions"
OUTPUT = OUT_DIR / "golden-collections-anil-tunk-full-crown-fit-guide-captioned.mp4"
POSTER = OUT_DIR / "golden-collections-anil-tunk-full-crown-fit-guide-poster.jpg"

TITLE = "Full Crown Fit Check"
SUBTITLE = "Measure the idol head, crown opening and height before choosing."

STEPS = [
    (0.0, 8.0, "Full crown fit is not only idol height"),
    (8.0, 22.0, "Step 1: Measure the idol head width"),
    (22.0, 36.0, "Step 2: Check the hair/bun and crown area"),
    (36.0, 50.0, "Step 3: Measure the crown opening and depth"),
    (50.0, 65.0, "Step 4: Check crown height and visual scale"),
    (65.0, 81.0, "Step 5: Place the crown and check face visibility"),
]

ALT_TEXT = (
    "Anil Tunk of Golden Collections demonstrating full crown fit for a deity idol by measuring "
    "idol head width, crown opening, crown height and placement before choosing a deity crown."
)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        width = draw.textbbox((0, 0), candidate, font=font)[2]
        if width <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_centered_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font: ImageFont.FreeTypeFont,
    y_center: int,
    fill: tuple[int, int, int, int],
    line_gap: int = 8,
) -> None:
    heights = [draw.textbbox((0, 0), line, font=font)[3] - draw.textbbox((0, 0), line, font=font)[1] for line in lines]
    total_height = sum(heights) + line_gap * max(0, len(lines) - 1)
    y = y_center - total_height // 2
    for line, height in zip(lines, heights):
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (720 - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, font=font, fill=fill)
        y += height + line_gap


def make_overlay(path: Path, top: str, bottom: str, title_card: bool = False) -> None:
    image = Image.new("RGBA", (720, 1280), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    title_font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 34 if not title_card else 44)
    body_font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 26)

    if title_card:
        draw.rounded_rectangle((28, 34, 692, 170), radius=22, fill=(0, 0, 0, 150))
        draw_centered_lines(draw, wrap_text(draw, TITLE, title_font, 620), title_font, 78, (255, 255, 255, 255))
        draw_centered_lines(draw, wrap_text(draw, SUBTITLE, body_font, 600), body_font, 130, (255, 245, 218, 255))
    else:
        draw.rounded_rectangle((28, 34, 692, 128), radius=22, fill=(0, 0, 0, 132))
        draw_centered_lines(draw, wrap_text(draw, top, title_font, 610)[:2], title_font, 82, (255, 255, 255, 255))

    draw.rounded_rectangle((34, 1074, 686, 1206), radius=22, fill=(0, 0, 0, 164))
    draw_centered_lines(draw, wrap_text(draw, bottom, body_font, 588)[:2], body_font, 1140, (255, 255, 255, 255))
    image.save(path)


def srt_time(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    hh, rem = divmod(ms, 3_600_000)
    mm, rem = divmod(rem, 60_000)
    ss, ms = divmod(rem, 1000)
    return f"{hh:02d}:{mm:02d}:{ss:02d},{ms:03d}"


def write_srt(path: Path) -> None:
    lines: list[str] = []
    for i, (start, end, text) in enumerate(STEPS, start=1):
        lines.extend([str(i), f"{srt_time(start)} --> {srt_time(end)}", text, ""])
    path.write_text("\n".join(lines), encoding="utf-8")


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OVERLAY_DIR.mkdir(parents=True, exist_ok=True)
    CAPTION_DIR.mkdir(parents=True, exist_ok=True)

    overlays = []
    for index, (start, end, text) in enumerate(STEPS, start=1):
        overlay = OVERLAY_DIR / f"overlay-{index:02d}.png"
        make_overlay(
            overlay,
            text,
            "Send idol height, head width and a side photo when unsure.",
            title_card=index == 1,
        )
        overlays.append((start, end, overlay))

    filter_parts = ["[0:v]scale=720:1280[base0]"]
    current = "base0"
    for index, (start, end, _) in enumerate(overlays, start=1):
        next_label = f"base{index}"
        filter_parts.append(f"[{current}][{index}:v]overlay=0:0:enable='between(t,{start},{end})'[{next_label}]")
        current = next_label
    filter_complex = ";".join(filter_parts)

    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-y",
        "-i",
        str(SOURCE),
    ]
    for _, _, overlay in overlays:
        cmd.extend(["-i", str(overlay)])
    cmd.extend(
        [
            "-filter_complex",
            filter_complex,
            "-map",
            f"[{current}]",
            "-map",
            "0:a:0",
            "-af",
            "dynaudnorm=f=150:g=15,alimiter=limit=0.95",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "22",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            "-map_metadata",
            "-1",
            str(OUTPUT),
        ]
    )
    run(cmd)

    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-y",
            "-ss",
            "00:01:05",
            "-i",
            str(OUTPUT),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            "-update",
            "1",
            str(POSTER),
        ]
    )

    srt_path = CAPTION_DIR / "golden-collections-anil-tunk-full-crown-fit-guide-descriptive.srt"
    write_srt(srt_path)

    manifest = {
        "source": str(SOURCE),
        "output": str(OUTPUT.relative_to(ROOT)),
        "poster": str(POSTER.relative_to(ROOT)),
        "srt": str(srt_path.relative_to(ROOT)),
        "alt": ALT_TEXT,
        "title": "How to Check Full Crown Fit for a Deity Idol | Anil Tunk, Golden Collections",
        "duration": "PT1M21S",
        "caption_strategy": "English visual step captions; not machine transcription.",
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
