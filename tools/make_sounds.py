"""Synthesises the app's sound effects (original, no licence needed) as small mono WAVs.

Soft on purpose: rounded tones, low notes, gentle attacks and modest volume, for a calm study
mood. Usage (from the repo root): python tools/make_sounds.py app/assets/sounds
"""
import math
import random
import struct
import sys
import wave

RATE = 22050
OUT = sys.argv[1]
random.seed(7)


def write(name, samples, level):
    """Writes samples normalised so the loudest point is `level` of full scale."""
    peak = max(abs(s) for s in samples) or 1
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s / peak * level * 32767)) for s in samples))


def env(t, attack, decay):
    return min(1.0, t / attack) * math.exp(-t / decay)


def tone(freq, length, attack, decay, partials=((1, 1.0),)):
    out = []
    for i in range(int(RATE * length)):
        t = i / RATE
        out.append(sum(a * math.sin(2 * math.pi * freq * k * t) for k, a in partials) * env(t, attack, decay))
    return out


def mix(*parts):
    """parts: (start in seconds, samples)."""
    n = max(int(RATE * s) + len(p) for s, p in parts)
    out = [0.0] * n
    for s, p in parts:
        o = int(RATE * s)
        for i, v in enumerate(p):
            out[o + i] += v
    return out


def move():
    """A short wooden 'tock': a damped low sine plus a soft click of filtered noise."""
    out, lp = [], 0.0
    for i in range(int(RATE * 0.09)):
        t = i / RATE
        lp += 0.2 * (random.uniform(-1, 1) - lp)
        out.append(math.sin(2 * math.pi * 430 * t * (1 - 0.6 * t)) * env(t, 0.001, 0.02) + 0.35 * lp * env(t, 0.0005, 0.005))
    return out


def mistake():
    """One low, muted thud that sags in pitch."""
    out, phase = [], 0.0
    for i in range(int(RATE * 0.35)):
        t = i / RATE
        freq = 200 - 45 * min(1.0, t / 0.2)
        phase += 2 * math.pi * freq / RATE
        out.append((math.sin(phase) + 0.15 * math.sin(2 * phase)) * env(t, 0.008, 0.09))
    return out


def complete():
    """A soft two-note chime, up a fourth (G4 to C5)."""
    chime = ((1, 1.0), (2, 0.12))
    return mix((0, tone(392.0, 0.7, 0.015, 0.25, chime)), (0.16, tone(523.25, 1.0, 0.015, 0.4, chime)))


write("move", move(), 0.55)
write("mistake", mistake(), 0.42)
write("complete", complete(), 0.45)
print("ok")
