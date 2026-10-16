"""Draws the app icon (a neon magenta pixel knight on a violet board corner) as PNGs.

Original pixel art, no licence needed. Pure Python, no image library required.
Usage (from the repo root): python tools/make_icons.py app/assets/images
"""
import struct
import sys
import zlib

OUT = sys.argv[1]

BACKGROUND = (0x13, 0x0C, 0x20, 255)
PALETTE = {
    "P": (0xFF, 0x40, 0xC8, 255),  # magenta
    "p": (0xA0, 0x20, 0x7E, 255),  # dark magenta
    "E": (0x00, 0xE5, 0xFF, 255),  # cyan eye
    "L": (0x7A, 0x66, 0x9A, 255),  # board, light square (dimmed)
    "D": (0x3E, 0x27, 0x5E, 255),  # board, dark square (dimmed)
}

KNIGHT = [
    "................",
    "......PPP.......",
    ".....PPPPP......",
    "....PPPEPPP.....",
    "...PPPPPPPPP....",
    "..PPPPPPPPPPP...",
    "..PPPPP.PPPPP...",
    "...PPP..PPPPP...",
    ".......PPPPPP...",
    "......PPPPPPP...",
    ".....PPPPPPPP...",
    ".....PPPPPPPP...",
    "....pppppppppp..",
    "...PPPPPPPPPPPP.",
    "................",
    "................",
]


def board_corner():
    """Rows 13-15: a strip of 2x2 board squares under the knight."""
    rows = [list(r) for r in KNIGHT]
    for y in range(13, 16):
        for x in range(16):
            if rows[y][x] == ".":
                rows[y][x] = "L" if ((x // 2) + (y // 2)) % 2 == 0 else "D"
    return ["".join(r) for r in rows]


def png(path, width, height, pixel):
    """Writes an RGBA PNG; pixel(x, y) returns (r, g, b, a)."""
    raw = b"".join(b"\x00" + b"".join(bytes(pixel(x, y)) for x in range(width)) for y in range(height))

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def icon(path, size, art, cell, background, colour=None):
    """Draws `art` (16x16) centred, `cell` px per pixel, on `background` (None = transparent)."""
    offset = (size - 16 * cell) // 2

    def pixel(x, y):
        gx, gy = (x - offset) // cell, (y - offset) // cell
        if 0 <= gx < 16 and 0 <= gy < 16 and x >= offset and y >= offset:
            ch = art[gy][gx]
            if ch in PALETTE:
                return colour or PALETTE[ch]
        return background or (0, 0, 0, 0)

    png(path, size, size, pixel)


full = board_corner()
icon(f"{OUT}/icon.png", 1024, full, 56, BACKGROUND)
# Android adaptive icon: the launcher masks it, so keep the art inside the central safe zone.
icon(f"{OUT}/android-icon-foreground.png", 1024, full, 30, None)
png(f"{OUT}/android-icon-background.png", 1024, 1024, lambda x, y: BACKGROUND)
icon(f"{OUT}/android-icon-monochrome.png", 1024, KNIGHT, 30, None, colour=(255, 255, 255, 255))
icon(f"{OUT}/splash-icon.png", 512, KNIGHT, 32, None)
icon(f"{OUT}/favicon.png", 48, full, 3, BACKGROUND)
print("ok")
