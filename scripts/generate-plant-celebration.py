"""Original botanical celebration, dedicated to CC0 1.0 (see public/licenses).

A gentle invented pentatonic phrase: plucked strings, glass harmonics and a
breathy final chord. No samples, recordings or third-party compositions.
Run from the repository root with Python 3; standard library only.
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
DURATION = 5.6
rng = random.Random(421)
samples = [0.0] * round(RATE * DURATION)


def note(start, midi, length, volume, glass=False):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    for i in range(round(length * RATE)):
        t = i / RATE
        index = round(start * RATE) + i
        if index >= len(samples):
            break
        attack = 1 - math.exp(-t * (26 if glass else 95))
        tail = min(1, (length - t) / 0.55)
        envelope = attack * math.exp(-t * (1.45 if glass else 2.3)) * tail
        fundamental = math.sin(2 * math.pi * frequency * t)
        harmonic = math.sin(2 * math.pi * frequency * (2.003 if glass else 2) * t)
        breath = rng.uniform(-1, 1) * 0.012 * math.sin(math.pi * t / length)
        samples[index] += volume * envelope * (fundamental + 0.20 * harmonic + breath)


# D-major pentatonic; spaced ascending gesture, then a quiet resolving chord.
for start, pitch, volume in [(0.08, 74, .19), (.46, 78, .17), (.92, 81, .19),
                              (1.48, 83, .15), (2.08, 81, .16), (2.72, 86, .18)]:
    note(start, pitch, 2.65, volume, glass=pitch >= 83)
for start, pitch in [(0.02, 50), (.05, 57), (2.74, 62), (2.83, 66), (2.93, 69)]:
    note(start, pitch, 2.65, .075, glass=True)

# Quiet diffuse reflections; final fade avoids any click on the sound boundary.
dry = samples[:]
for delay, gain in [(.13, .12), (.29, .07), (.43, .035)]:
    offset = round(delay * RATE)
    for i in range(offset, len(samples)):
        samples[i] += gain * dry[i - offset]
peak = max(abs(s) for s in samples)
pcm = bytearray()
for i, sample in enumerate(samples):
    fade = min(1, i / (RATE * .02), (len(samples) - i) / (RATE * .35))
    pcm.extend(struct.pack('<h', round(sample / peak * .65 * fade * 32767)))
output = Path('assets/plant-celebration.wav')
with wave.open(str(output), 'wb') as wav:
    wav.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
    wav.writeframes(pcm)
print(f'{output}: {DURATION}s, mono PCM {RATE} Hz, original CC0 composition')
