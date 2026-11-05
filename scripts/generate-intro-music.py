"""Original 14.8 s acoustic waltz, CC0; FluidR3 GM samples under MIT.
python3 scripts/generate-intro-music.py --soundfont /path/to/FluidR3_GM.sf2
The sample-bank licence is embedded in the MP3 comment as well as public/licenses.
"""
import argparse
import ctypes as C
import ctypes.util
import hashlib
import json
import subprocess
import tempfile
import wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

parser = argparse.ArgumentParser()
parser.add_argument('--soundfont', type=Path, required=True)
font = parser.parse_args().soundfont
assert hashlib.sha256(font.read_bytes()).hexdigest() == json.loads(Path('scripts/audio-sources.json').read_text())['instruments']['soundfont_sha256']
rate, seconds = 32000, 14.8
lib = C.CDLL(ctypes.util.find_library('fluidsynth'))
def api(name, result, *types):
    call = getattr(lib, name); call.restype = result; call.argtypes = list(types); return call
ptr, integer = C.c_void_p, C.c_int
settings_new = api('new_fluid_settings', ptr)
number = api('fluid_settings_setnum', integer, ptr, C.c_char_p, C.c_double)
setting_int = api('fluid_settings_setint', integer, ptr, C.c_char_p, integer)
synth_new = api('new_fluid_synth', ptr, ptr)
load = api('fluid_synth_sfload', integer, ptr, C.c_char_p, integer)
program = api('fluid_synth_program_change', integer, ptr, integer, integer)
control = api('fluid_synth_cc', integer, ptr, integer, integer, integer)
note_on = api('fluid_synth_noteon', integer, ptr, integer, integer, integer)
note_off = api('fluid_synth_noteoff', integer, ptr, integer, integer)
write = api('fluid_synth_write_float', integer, ptr, integer, ptr, integer, integer, ptr, integer, integer)
delete = api('delete_fluid_synth', None, ptr)
delete_settings = api('delete_fluid_settings', None, ptr)
events = []
def note(start, duration, channel, pitch, velocity):
    events.extend([(round(start * rate), 1, channel, pitch, velocity), (round((start + duration) * rate), 0, channel, pitch, 0)])

# Seven rising/falling 3/4 bars: Dm, Bb, F, C, Gm, A, Dm. All acoustic patches.
beat = 60 / 104
chords = [(50, 3), (46, 4), (53, 4), (48, 4), (43, 3), (45, 4), (50, 3)]
melody = [[74, 77, 81], [77, 74, 70], [72, 77, 81], [79, 76, 72], [74, 77, 79], [76, 73, 81], [77, 76, 74]]
rng = np.random.default_rng(231101)
for bar, ((root, third), phrase) in enumerate(zip(chords, melody)):
    start = 0.12 + bar * 3 * beat
    swell = min(8, bar * 2)
    hold = 3 * beat if bar < 6 else seconds - start - 0.8
    note(start, hold, 4, root - 12, 36 + swell // 2)
    for pitch in [root + 7, root + third + 12]: note(start + 0.04, hold, 2, pitch, 29 + swell)
    for step, interval in enumerate([12, 12 + third, 19, 24, 19, 12 + third]):
        note(start + step * beat / 2 + float(rng.uniform(-0.008, 0.008)), 0.9, 0, root + interval, 48 + swell + int(rng.integers(-3, 4)))
    for step, pitch in enumerate(phrase):
        duration = beat * 0.92 if bar < 6 or step < 2 else 2.8
        note(start + step * beat + 0.06, duration, 3, pitch, 48 + swell)
        if bar in [1, 3, 4, 6]: note(start + step * beat + 0.2, min(1.5, duration), 1, pitch + 12, 28 + swell // 2)
# Sparkling replies when the pages take flight, then a warm, unhurried cadence.
for at, contour in [(4.7, [74, 77, 79, 81, 84, 86, 89]), (9.0, [89, 86, 84, 81, 79, 77, 74])]:
    for i, pitch in enumerate(contour): note(at + i * 0.09, 0.85, 1, pitch, 27 + i % 3 * 2)
for i, pitch in enumerate([62, 65, 69, 74, 77, 81, 86]): note(11.4 + i * 0.11, 2.0, 0, pitch, 43 - i)

settings = settings_new()
number(settings, b'synth.sample-rate', rate)
number(settings, b'synth.gain', 0.48)
number(settings, b'synth.reverb.room-size', 0.63)
number(settings, b'synth.reverb.damp', 0.67)
number(settings, b'synth.reverb.width', 60)
number(settings, b'synth.reverb.level', 0.20)
setting_int(settings, b'synth.chorus.active', 0)
setting_int(settings, b'synth.cpu-cores', 1)
synth = synth_new(settings)
assert load(synth, str(font).encode(), 1) >= 0
for channel, patch in enumerate([46, 8, 48, 73, 42]):
    program(synth, channel, patch)
    control(synth, channel, 7, [82, 52, 45, 68, 46][channel])
    control(synth, channel, 10, [42, 83, 58, 73, 50][channel])
output = np.zeros((round(seconds * rate), 2), dtype=np.float32)
cursor = 0
try:
    for frame, kind, channel, pitch, velocity in sorted(events):
        frame = max(0, min(len(output), frame))
        if frame > cursor:
            block = output[cursor:frame]
            write(synth, frame - cursor, block.ctypes.data, 0, 2, block.ctypes.data, 1, 2)
            cursor = frame
        (note_on(synth, channel, pitch, velocity) if kind else note_off(synth, channel, pitch))
    if cursor < len(output):
        block = output[cursor:]
        write(synth, len(block), block.ctypes.data, 0, 2, block.ctypes.data, 1, 2)
finally:
    delete(synth); delete_settings(settings)
output = sosfilt(butter(2, 6000, fs=rate, output='sos'), output, axis=0)
output = sosfilt(butter(2, 50, fs=rate, btype='highpass', output='sos'), output, axis=0)
for count, reverse in [(round(0.22 * rate), False), (round(1.05 * rate), True)]:
    ramp = np.sin(np.linspace(0, np.pi / 2, count)) ** 2
    if reverse: output[-count:] *= ramp[::-1, None]
    else: output[:count] *= ramp[:, None]
output *= 0.58 / max(1e-9, np.max(np.abs(output)))
pcm = np.round(output * 32767).astype('<i2')
notice = ('L’éveil du grimoire — original composition for Herbier des couleurs, CC0 1.0.\n'
          'Instrument samples: FluidR3 GM, MIT.\n' + Path('public/licenses/FluidR3-MIT.txt').read_text())
with tempfile.TemporaryDirectory(prefix='herbier-intro-') as folder:
    path = Path(folder) / 'intro.wav'
    with wave.open(str(path), 'wb') as file:
        file.setparams((2, 2, rate, 0, 'NONE', 'not compressed')); file.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(path), '-codec:a', 'libmp3lame', '-q:a', '3', '-ar', str(rate), '-metadata', 'title=L’éveil du grimoire', '-metadata', 'comment=' + notice, 'assets/music/prologue.mp3'], check=True)
print('Intro: 14.8 s, acoustic harp/celesta/flute/strings/cello; CC0 score and embedded MIT notice.')
