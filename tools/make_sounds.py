"""Synthesises the app's sound effects (original, no licence needed) as small mono WAVs.

Usage (from the repo root): python tools/make_sounds.py app/assets/sounds
"""
import math
import random
import struct
import sys
import wave

RATE = 22050
OUT = sys.argv[1]
random.seed(7)


def write(name, samples):
    peak = max(abs(s) for s in samples) or 1
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s / peak * 0.85 * 32767)) for s in samples))


def env(t, attack, decay):
    return min(1.0, t / attack) * math.exp(-t / decay) if attack > 0 else math.exp(-t / decay)


def square(phase):
    # A soft square: a few odd harmonics, less harsh than a true square wave.
    return sum(math.sin(phase * k) / k for k in (1, 3, 5))


def move():
    """A short wooden 'tock': a damped low sine plus a click of filtered noise."""
    out, lp = [], 0.0
    for i in range(int(RATE * 0.09)):
        t = i / RATE
        lp += 0.25 * (random.uniform(-1, 1) - lp)
        out.append(math.sin(2 * math.pi * 520 * t * (1 - 0.6 * t)) * env(t, 0.001, 0.018) + 0.5 * lp * env(t, 0, 0.006))
    return out


def mistake():
    """Two low descending blips, retro but soft."""
    out = []
    for freq, start in ((220, 0.0), (165, 0.11)):
        for i in range(int(RATE * 0.1)):
            t = i / RATE
            out.append(0.6 * square(2 * math.pi * freq * t) * env(t, 0.004, 0.05))
        if start == 0.0:
            out += [0.0] * int(RATE * 0.01)
    return out


def complete():
    """A rising arpeggio (C, E, G, C) with a little shimmer on the last note."""
    out = []
    notes = (523.25, 659.25, 783.99, 1046.5)
    for n, freq in enumerate(notes):
        length = 0.32 if n == len(notes) - 1 else 0.085
        for i in range(int(RATE * length)):
            t = i / RATE
            tone = square(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * freq * 2.01 * t)
            out.append(0.5 * tone * env(t, 0.003, 0.12 if n == len(notes) - 1 else 0.06))
    return out


write("move", move())
write("mistake", mistake())
write("complete", complete())
print("ok")
