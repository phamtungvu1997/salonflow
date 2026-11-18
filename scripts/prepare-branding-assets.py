"""Prepare SalonFlow branding PNGs with transparent backgrounds from approved masters."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "branding"
SRC_SYMBOL = Path(
    r"C:\Users\vupham\.cursor\projects\c-Users-vupham-Desktop-salonflow\assets\image-cda595ff-e2eb-427e-b094-1875c894107b.jpg"
)
SRC_WORD = Path(
    r"C:\Users\vupham\.cursor\projects\c-Users-vupham-Desktop-salonflow\assets\image-b988957d-1c51-4751-b7a6-a7ac75617c7f.jpg"
)


def remove_near_white_bg(img: Image.Image, threshold: int = 245, soft: int = 18) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    assert pixels is not None
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, _a = pixels[x, y]
            brightness = (r + g + b) / 3
            chroma = max(r, g, b) - min(r, g, b)
            if brightness >= threshold and chroma < 25:
                pixels[x, y] = (r, g, b, 0)
            elif brightness >= threshold - soft and chroma < 40:
                alpha = int(255 * (1 - ((brightness - (threshold - soft)) / soft)))
                alpha = max(0, min(255, alpha))
                if chroma > 20:
                    alpha = max(alpha, min(255, int(chroma * 8)))
                pixels[x, y] = (r, g, b, alpha)
    return img


def trim_alpha(img: Image.Image, padding: int = 8) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(img.width, right + padding)
    bottom = min(img.height, bottom + padding)
    return img.crop((left, top, right, bottom))


def square_pad(img: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    margin = int(size * 0.08)
    fit = size - 2 * margin
    ratio = min(fit / img.width, fit / img.height)
    new_w = max(1, int(img.width * ratio))
    new_h = max(1, int(img.height * ratio))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((size - new_w) // 2, (size - new_h) // 2), resized)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    symbol = remove_near_white_bg(Image.open(SRC_SYMBOL), threshold=240, soft=22)
    symbol = trim_alpha(symbol, padding=12)
    master = 1024
    scale = master / max(symbol.width, symbol.height)
    symbol_master = symbol.resize(
        (max(1, int(symbol.width * scale)), max(1, int(symbol.height * scale))),
        Image.Resampling.LANCZOS,
    )
    symbol_master.save(OUT / "salonflow-symbol.png", "PNG", optimize=True)

    word = remove_near_white_bg(Image.open(SRC_WORD), threshold=248, soft=16)
    word = trim_alpha(word, padding=10)
    target_h = 256
    scale_w = target_h / word.height
    word_master = word.resize(
        (max(1, int(word.width * scale_w)), target_h),
        Image.Resampling.LANCZOS,
    )
    word_master.save(OUT / "salonflow-wordmark.png", "PNG", optimize=True)

    # Contrast adaptation for dark sidebar only — same letterforms, light ink.
    inverse = word_master.copy()
    pixels = inverse.load()
    assert pixels is not None
    for y in range(inverse.height):
        for x in range(inverse.width):
            r, g, b, a = pixels[x, y]
            if a < 8:
                continue
            pixels[x, y] = (244, 236, 250, a)
    inverse.save(OUT / "salonflow-wordmark-on-dark.png", "PNG", optimize=True)

    gap = 36
    symbol_h = 220
    symbol_scaled = symbol_master.resize(
        (
            max(1, int(symbol_master.width * (symbol_h / symbol_master.height))),
            symbol_h,
        ),
        Image.Resampling.LANCZOS,
    )
    word_h = int(symbol_h * 0.55)
    word_scaled = word_master.resize(
        (
            max(1, int(word_master.width * (word_h / word_master.height))),
            word_h,
        ),
        Image.Resampling.LANCZOS,
    )
    lock_w = symbol_scaled.width + gap + word_scaled.width
    lock_h = max(symbol_scaled.height, word_scaled.height)
    lockup = Image.new("RGBA", (lock_w, lock_h), (0, 0, 0, 0))
    lockup.paste(symbol_scaled, (0, (lock_h - symbol_scaled.height) // 2), symbol_scaled)
    lockup.paste(
        word_scaled,
        (symbol_scaled.width + gap, (lock_h - word_scaled.height) // 2),
        word_scaled,
    )
    lockup.save(OUT / "salonflow-lockup.png", "PNG", optimize=True)

    fav32 = square_pad(symbol_master, 32)
    fav48 = square_pad(symbol_master, 48)
    fav180 = square_pad(symbol_master, 180)
    fav32.save(OUT / "salonflow-favicon.png", "PNG", optimize=True)
    fav48.save(OUT / "salonflow-favicon-48.png", "PNG", optimize=True)
    fav180.save(OUT / "salonflow-apple-touch-icon.png", "PNG", optimize=True)
    fav32.save(ROOT / "public" / "favicon.png", "PNG", optimize=True)

    # Keep approved masters (unmodified copies) for provenance.
    masters = OUT / "source-masters"
    masters.mkdir(exist_ok=True)
    Image.open(SRC_SYMBOL).save(masters / "symbol-source.jpg", quality=95)
    Image.open(SRC_WORD).save(masters / "wordmark-source.jpg", quality=95)

    for name in [
        "salonflow-symbol.png",
        "salonflow-wordmark.png",
        "salonflow-wordmark-on-dark.png",
        "salonflow-lockup.png",
        "salonflow-favicon.png",
    ]:
        image = Image.open(OUT / name).convert("RGBA")
        corner_alpha = [
            image.getpixel((0, 0))[3],
            image.getpixel((image.width - 1, 0))[3],
            image.getpixel((0, image.height - 1))[3],
        ]
        opaque = sum(1 for pixel in image.getdata() if pixel[3] > 200)
        print(f"{name}: size={image.size} corner_alpha={corner_alpha} opaque={opaque}")


if __name__ == "__main__":
    main()
