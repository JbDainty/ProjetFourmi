"""Original paper foley synthesized for Herbier des couleurs; no samples.

Soft band-limited fibre friction, tiny creases, a low membrane flex and several
overlapping shorter flicks for the riffle. Python 3 standard library only.
Run from the repository root.
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
rng = random.Random(6127)


def friction(duration):
    result = []
    smooth, slow = 0.0, 0.0
    for i in range(round(duration * RATE)):
        noise = rng.uniform(-1, 1)
        smooth += .45 * (noise - smooth)
        slow += .07 * (smooth - slow)
        result.append(smooth - slow + .11 * (noise - smooth))
    return result


def turn(track, start, length, strength):
    texture = friction(length)
    for i, grain in enumerate(texture):
        t = i / RATE
        u = t / length
        envelope = (1 - math.exp(-u * 35)) * math.exp(-((u - .32) / .24) ** 2)
        creases = sum(math.exp(-((u - p) / .018) ** 2) * .22 for p in [.17, .46, .68])
        flutter = .78 + .13 * math.sin(2 * math.pi * 27 * t) + .09 * math.sin(2 * math.pi * 61 * t)
        bend = .025 * math.sin(2 * math.pi * (103 * t - 25 * t * t)) * math.exp(-u * 5)
        index = round(start * RATE) + i
        if index < len(track):
            track[index] += strength * ((envelope * flutter + creases) * grain + bend)


def save(name, track):
    peak = max(abs(x) for x in track)
    pcm = bytearray()
    for i, sample in enumerate(track):
        fade = min(1, i / (RATE * .012), (len(track) - i) / (RATE * .07))
        pcm.extend(struct.pack('<h', round(sample / peak * .42 * fade * 32767)))
    path = Path('assets') / name
    with wave.open(str(path), 'wb') as wav:
        wav.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        wav.writeframes(pcm)
    print(f'{path}: {len(track) / RATE:.2f}s original paper foley, PCM mono {RATE} Hz')


single = [0.0] * round(1.15 * RATE)
turn(single, .015, 1.08, 1)
save('page-turn.wav', single)
riffle = [0.0] * round(1.85 * RATE)
for i in range(5):
    turn(riffle, .015 + i * .17, .43, .65 + i * .065)
turn(riffle, .98, .80, .75)
save('pages-riffle.wav', riffle)
