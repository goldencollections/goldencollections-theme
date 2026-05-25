from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path

from faster_whisper import WhisperModel
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
EXPORTS = ROOT / "tmp" / "gc-promotion-img3289" / "exports"
CAPTIONS = ROOT / "tmp" / "gc-promotion-img3289" / "captions"
DESCRIPTIVE_CAPTIONS = CAPTIONS / "english-descriptive"
READY = ROOT / "tmp" / "gc-promotion-img3289" / "ready-to-review"
OVERLAYS = ROOT / "tmp" / "gc-promotion-img3289" / "overlays"


@dataclass(frozen=True)
class Clip:
    source: str
    ready: str
    overlay: str
    bottom: str
    use: str
    status: str = "ready"


CLIPS = [
    Clip(
        "short-03-green-pink-statement-set-2026-05-20.mp4",
        "01-post-first-green-pink-statement-set-captioned-2026-05-20.mp4",
        "Statement necklace set | Real in-store view",
        "Message us with your use case before ordering",
        "First social post candidate",
    ),
    Clip(
        "short-04-heavy-set-reveal-2026-05-20.mp4",
        "02-heavy-bridal-set-reveal-captioned-2026-05-20.mp4",
        "Heavy set close-up | Check details before ordering",
        "See the full set, scale and matching pieces",
        "Second social post candidate",
    ),
    Clip(
        "short-05-long-haar-layered-necklace-2026-05-20.mp4",
        "03-long-haar-layered-necklace-captioned-2026-05-20.mp4",
        "Long haar view | Length and scale matter",
        "Useful for comparing longer necklace styles",
        "Third social post candidate",
    ),
    Clip(
        "short-01-presenter-store-trust-intro-2026-05-20.mp4",
        "04-store-trust-intro-captioned-2026-05-20.mp4",
        "Inside Golden Collections | Real product guidance",
        "Real store context, not a generic catalogue clip",
        "Trust-building post after product clips",
    ),
    Clip(
        "website-cut-golden-collections-store-product-guide-85s-2026-05-20.mp4",
        "website-cut-product-guide-captioned-2026-05-20.mp4",
        "Golden Collections in-store product guide",
        "Check product details, size and current availability",
        "Website review candidate",
    ),
]


def srt_time(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    hh, rem = divmod(ms, 3_600_000)
    mm, rem = divmod(rem, 60_000)
    ss, ms = divmod(rem, 1000)
    return f"{hh:02d}:{mm:02d}:{ss:02d},{ms:03d}"


def safe_srt_text(text: str) -> str:
    return " ".join(text.replace("\n", " ").split())


def write_srt(path: Path, segments) -> None:
    lines: list[str] = []
    for i, seg in enumerate(segments, start=1):
        text = safe_srt_text(seg.text)
        if not text:
            continue
        lines.extend(
            [
                str(i),
                f"{srt_time(seg.start)} --> {srt_time(seg.end)}",
                text,
                "",
            ]
        )
    path.write_text("\n".join(lines), encoding="utf-8")


def write_descriptive_srt(path: Path, duration: float, overlay: str, bottom: str) -> None:
    split = min(4.0, max(2.0, duration * 0.25))
    lines = [
        "1",
        f"{srt_time(0)} --> {srt_time(split)}",
        overlay.replace("|", "-"),
        "",
        "2",
        f"{srt_time(split)} --> {srt_time(duration)}",
        bottom,
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def write_json(path: Path, segments, info) -> None:
    payload = {
        "language": info.language,
        "language_probability": info.language_probability,
        "segments": [
            {
                "start": seg.start,
                "end": seg.end,
                "text": safe_srt_text(seg.text),
            }
            for seg in segments
            if safe_srt_text(seg.text)
        ],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def make_overlay_png(path: Path, overlay: str, bottom: str) -> None:
    image = Image.new("RGBA", (720, 1280), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    title_font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 30)
    body_font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 26)

    draw.rounded_rectangle((24, 24, 696, 116), radius=18, fill=(0, 0, 0, 126))
    title_lines = wrap_text(draw, overlay, title_font, 620)[:2]
    title_h = sum(draw.textbbox((0, 0), line, font=title_font)[3] for line in title_lines) + (len(title_lines) - 1) * 6
    y = 70 - title_h // 2
    for line in title_lines:
        bbox = draw.textbbox((0, 0), line, font=title_font)
        draw.text(((720 - (bbox[2] - bbox[0])) // 2, y), line, font=title_font, fill=(255, 255, 255, 255))
        y += (bbox[3] - bbox[1]) + 8

    draw.rounded_rectangle((34, 1080, 686, 1200), radius=18, fill=(0, 0, 0, 158))
    bottom_lines = wrap_text(draw, bottom, body_font, 590)[:2]
    body_h = sum(draw.textbbox((0, 0), line, font=body_font)[3] for line in bottom_lines) + (len(bottom_lines) - 1) * 6
    y = 1142 - body_h // 2
    for line in bottom_lines:
        bbox = draw.textbbox((0, 0), line, font=body_font)
        draw.text(((720 - (bbox[2] - bbox[0])) // 2, y), line, font=body_font, fill=(255, 255, 255, 255))
        y += (bbox[3] - bbox[1]) + 8

    image.save(path)


def ffmpeg_caption_clip(source: Path, overlay_png: Path, output: Path) -> None:
    filter_graph = "[0:v]scale=720:1280[base];[base][1:v]overlay=0:0"
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-y",
        "-i",
        str(source),
        "-i",
        str(overlay_png),
        "-filter_complex",
        filter_graph,
        "-af",
        "dynaudnorm=f=150:g=15,alimiter=limit=0.95",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-map_metadata",
        "-1",
        str(output),
    ]
    subprocess.run(cmd, check=True, cwd=ROOT)


def ffprobe_duration(path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return float(result.stdout.strip())


def main() -> None:
    CAPTIONS.mkdir(parents=True, exist_ok=True)
    DESCRIPTIVE_CAPTIONS.mkdir(parents=True, exist_ok=True)
    READY.mkdir(parents=True, exist_ok=True)
    OVERLAYS.mkdir(parents=True, exist_ok=True)
    model = WhisperModel("base", device="cpu", compute_type="int8")
    manifest = []

    for clip in CLIPS:
        source = EXPORTS / clip.source
        stem = Path(clip.source).stem
        srt_path = CAPTIONS / f"{stem}.srt"
        json_path = CAPTIONS / f"{stem}.json"
        segments_iter, info = model.transcribe(
            str(source),
            beam_size=5,
            vad_filter=True,
            word_timestamps=False,
        )
        segments = list(segments_iter)
        write_srt(srt_path, segments)
        write_json(json_path, segments, info)
        overlay_png = OVERLAYS / f"{stem}-overlay.png"
        make_overlay_png(overlay_png, clip.overlay, clip.bottom)
        output = READY / clip.ready
        ffmpeg_caption_clip(source, overlay_png, output)
        duration = round(ffprobe_duration(output), 1)
        descriptive_srt = DESCRIPTIVE_CAPTIONS / f"{Path(clip.ready).stem}.srt"
        write_descriptive_srt(descriptive_srt, duration, clip.overlay, clip.bottom)
        manifest.append(
            {
                "source": str(source.relative_to(ROOT)),
                "output": str(output.relative_to(ROOT)),
                "srt": str(srt_path.relative_to(ROOT)),
                "json": str(json_path.relative_to(ROOT)),
                "overlay_png": str(overlay_png.relative_to(ROOT)),
                "descriptive_srt": str(descriptive_srt.relative_to(ROOT)),
                "duration": duration,
                "detected_language": info.language,
                "language_probability": round(info.language_probability, 3),
                "raw_transcript_status": "review_only_failed_quality_check",
                "overlay": clip.overlay,
                "bottom_caption": clip.bottom,
                "use": clip.use,
                "status": clip.status,
            }
        )

    (READY / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
