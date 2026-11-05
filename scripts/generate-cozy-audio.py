"""Original CC0 compositions and synthesized water foley for the game.

No recordings, samples, copied melodies or third-party soundfonts. NumPy/SciPy
render soft felt-piano, plucked strings, airy pads and sparse bell harmonics.
FFmpeg encodes the five circular arrangements as compact MP3 files.
Run from the repository root: python3 scripts/generate-cozy-audio.py
"""
import math
import subprocess
import wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

RATE = 22050


def add(track, data, start):
    index = round(start * RATE) % len(track)
    end = index + len(data)
    if end <= len(track):
        track[index:end] += data
    else:
        split = len(track) - index
        track[index:] += data[:split]
        track[:len(data) - split] += data[split:]


def tone(midi, length, kind='piano'):
    t = np.arange(round(length * RATE)) / RATE
    f = 440 * 2 ** ((midi - 69) / 12)
    result = np.zeros(len(t))
    if kind == 'bell':
        partials = [(1, 1), (2.76, .13), (5.4, .025)]
    else:
        partials = [(k * math.sqrt(1 + .00012 * k * k), 1 / k ** 2.1) for k in range(1, 7)]
    for harmonic, amplitude in partials:
        result += amplitude * np.sin(2 * np.pi * f * harmonic * t) * np.exp(-t * (.8 + harmonic * .19))
    attack = .04 if kind == 'piano' else .025
    envelope = (1 - np.exp(-t / attack)) * np.minimum(1, np.maximum(0, length - t) / .6)
    return result * envelope


def pcm(samples, peak=.62):
    samples = np.tanh(samples * 1.2)
    samples *= peak / max(1e-9, np.max(np.abs(samples)))
    return np.round(samples * 32767).astype('<i2').tobytes()


def wav(name, samples, peak=.42):
    with wave.open(str(Path('assets') / name), 'wb') as out:
        out.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        out.writeframes(pcm(samples, peak))


tracks = [
    ('prairies', 'Clairière d’ivoire', 60, [48, 45, 53, 55, 52, 53, 50, 55], [4, 3, 4, 4, 3, 4, 3, 4], 'piano'),
    ('sous-bois', 'Murmures du sous-bois', 56, [45, 50, 48, 43, 45, 53, 50, 52], [3, 3, 4, 4, 3, 4, 3, 3], 'piano'),
    ('zones-humides', 'Reflets des roseaux', 64, [53, 50, 46, 48, 45, 46, 55, 48], [4, 3, 4, 4, 3, 4, 3, 4], 'bell'),
    ('montagnes', 'Lumière des cimes', 58, [50, 47, 55, 57, 54, 55, 52, 57], [4, 3, 4, 4, 3, 4, 3, 4], 'bell'),
    ('mediterranee', 'Brise de garrigue', 62, [55, 52, 48, 50, 47, 48, 45, 50], [4, 3, 4, 4, 3, 4, 3, 4], 'strings'),
]
Path('assets/music').mkdir(exist_ok=True)
for index, (name, title, bpm, roots, thirds, instrument) in enumerate(tracks):
    beat = 60 / bpm
    duration = 64 * beat
    song = np.zeros(round(duration * RATE))
    for chord, (root, third) in enumerate(zip(roots, thirds)):
        start = chord * 8 * beat
        # Soft sustained voicing, crossfaded across bar boundaries.
        length = 8 * beat + 1.6
        t = np.arange(round(length * RATE)) / RATE
        envelope = np.minimum(1, t / 1.1) * np.minimum(1, np.maximum(0, length - t) / 1.6)
        pad = np.zeros(len(t))
        for pitch in [root, root + 7, root + third + 12]:
            frequency = 440 * 2 ** ((pitch - 69) / 12)
            pad += .014 * (np.sin(2 * np.pi * frequency * t) + .08 * np.sin(2 * np.pi * frequency * 2 * t))
        add(song, pad * envelope, start)
        add(song, tone(root, 4 * beat, 'piano') * .06, start + .1 * beat)
        # Two different original phrases per chord; sparse, unrushed notes.
        offsets = [(.65, root + 24), (2.45, root + third + 24), (4.6, root + 19), (6.8, root + 26)]
        if index == 1: offsets = [(.9, root + 19), (3.4, root + 24), (5.3, root + third + 24)]
        if index == 2: offsets = [(.4, root + 24), (2.7, root + 31), (5.0, root + third + 24), (7.1, root + 26)]
        if index == 3: offsets = [(1.3, root + 31), (3.7, root + 28), (6.0, root + 24)]
        if index == 4: offsets = [(.4, root + 19), (1.9, root + third + 12), (4.5, root + 24), (6.4, root + 19)]
        for position, pitch in offsets:
            kind = 'bell' if instrument == 'bell' and position > 4 else 'piano'
            add(song, tone(pitch, 4.5, kind) * (.06 if kind == 'bell' else .11), start + position * beat)
        if instrument == 'strings':
            add(song, tone(root + 7, 2.5, 'strings') * .07, start + 3.2 * beat)
    dry = song.copy()
    for seconds, gain in [(.19, .13), (.37, .085), (.61, .045), (.83, .022)]:
        song += gain * np.roll(dry, round(seconds * RATE))
    # Circular lowpass keeps the start/end filter history continuous.
    sos = butter(2, 3100, fs=RATE, output='sos')
    song = sosfilt(sos, np.concatenate([song[-RATE:], song]))[RATE:]
    # Very short eased edges suppress encoder-boundary clicks on every loop.
    edge = round(.035 * RATE)
    ramp = np.sin(np.linspace(0, np.pi / 2, edge)) ** 2
    song[:edge] *= ramp
    song[-edge:] *= ramp[::-1]
    output = Path('assets/music') / (name + '.mp3')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1',
                    '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '96k', '-write_xing', '1',
                    '-metadata', 'title=' + title, '-metadata', 'artist=Herbier des couleurs',
                    '-metadata', 'copyright=CC0 1.0 Universal', str(output)], input=pcm(song), check=True)
    print(f'{output}: original circular arrangement, {duration:.2f}s, {bpm} BPM, CC0')

reveal = np.zeros(round(3.2 * RATE))
for start, pitch, level in [(0.03, 72, .18), (.34, 76, .16), (.73, 79, .17), (1.13, 81, .13), (1.5, 79, .13)]:
    data = tone(pitch, min(2.1, 3.2 - start), 'piano') * level
    add(reveal, data, start)
for pitch in [60, 64, 67]: add(reveal, tone(pitch, 1.8) * .045, 1.35)
reveal[-round(.25 * RATE):] *= np.linspace(1, 0, round(.25 * RATE))
wav('reveal-celebration.wav', reveal, .58)

rng = np.random.default_rng(12506)
for units in range(1, 5):
    duration = .70 + units * .15 + .12
    n = round(duration * RATE)
    t = np.arange(n) / RATE
    noise = rng.normal(0, 1, n)
    water = sosfilt(butter(2, [130, 2100], fs=RATE, btype='bandpass', output='sos'), noise) * .065
    envelope = np.minimum(1, t / .09) * np.minimum(1, (duration - t) / .16)
    water *= (.75 + .12 * np.sin(t * 31) + .08 * np.sin(t * 53)) * envelope
    for start in np.linspace(.07, duration - .10, 17 + units * 4):
        length = min(.09, duration - start)
        local = np.arange(round(length * RATE)) / RATE
        frequency = rng.uniform(380, 1450)
        bubble = .026 * np.sin(2 * np.pi * (frequency * local + frequency * 2 * local ** 2))
        bubble *= (1 - np.exp(-local * 1200)) * np.exp(-local * rng.uniform(45, 90))
        pos = round(start * RATE); size = min(len(bubble), n - pos)
        water[pos:pos + size] += bubble[:size]
    water *= np.minimum(1, (duration - t) / .05)
    wav('pour.wav' if units == 1 else f'pour-{units}.wav', water, .32)
    print(f'pour {units}: {duration:.2f}s, original soft water foley')

legal = Path('public/licenses/plant-celebration-CC0.txt').read_text().split('Creative Commons Legal Code', 1)[1]
Path('public/licenses/cozy-audio-CC0.txt').write_text('''Herbier des couleurs — Original cosy soundscape

CC0 1.0 applies exclusively to the five original compositions and recordings in
assets/music/*.mp3, assets/reveal-celebration.wav, assets/pour.wav,
assets/pour-2.wav, assets/pour-3.wav, assets/pour-4.wav, and their synthesis script
scripts/generate-cozy-audio.py. No third-party recordings or compositions used.
These tracks are original works for this project, not recordings or arrangements
of Snowflakes, MAIKY, Artlist or any other existing composition.
https://creativecommons.org/publicdomain/zero/1.0/

Creative Commons Legal Code'''+legal)
