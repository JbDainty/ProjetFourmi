"""Original quiet leaf-and-wind effect; deterministic synthesis, no recordings."""
import math
import random
import struct
import wave
from pathlib import Path

rate, duration = 22050, 2.8
rng = random.Random(41027)
low = middle = fast = 0.0
samples = []
for i in range(round(rate * duration)):
    t = i / rate
    noise = rng.uniform(-1, 1)
    low += 0.009 * (noise - low)
    middle += 0.08 * (noise - middle)
    fast += 0.58 * (noise - fast)
    breeze = math.sin(math.pi * t / duration) ** 1.6
    gust = 0.72 + 0.18 * math.sin(2 * math.pi * 0.63 * t - 0.7)
    leaves = sum(amp * math.exp(-((t - center) / spread) ** 2)
                 for center, spread, amp in [(0.65, 0.19, 0.45), (1.10, 0.13, 0.32),
                                             (1.65, 0.24, 0.40), (2.15, 0.17, 0.26)])
    flutter = 0.55 + 0.22 * math.sin(2 * math.pi * 13.1 * t) + 0.12 * math.sin(2 * math.pi * 27.3 * t)
    samples.append(breeze * (0.55 * low * gust + 0.24 * middle * gust
                             + 0.16 * (fast - middle) * leaves * flutter))
peak = max(abs(sample) for sample in samples)
samples = [sample * 0.38 / peak for sample in samples]
target = Path(__file__).resolve().parent.parent / 'assets' / 'leaf-wind.wav'
with wave.open(str(target), 'wb') as out:
    out.setnchannels(1)
    out.setsampwidth(2)
    out.setframerate(rate)
    out.writeframes(b''.join(struct.pack('<h', round(sample * 32767)) for sample in samples))
rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples))
print(f'{target.name}: {duration:.1f}s mono, {rate}Hz, peak 0.38, RMS {rms:.3f}')
