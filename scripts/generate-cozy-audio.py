"""Render original chamber arrangements, CC0 recorded water and a small glass chime.

Requires NumPy, SciPy, ffmpeg, libfluidsynth and the MIT FluidR3 GM SoundFont.
python3 scripts/generate-cozy-audio.py --soundfont /path/to/FluidR3_GM.sf2
Provenance, download URLs and verified SHA256: scripts/audio-sources.json.
The 142 MB SoundFont is a build-time input, never an application dependency.
"""
import argparse
import ctypes as C
import ctypes.util
import hashlib
import json
import subprocess
import wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

RATE = 32000
args = argparse.ArgumentParser()
args.add_argument('--soundfont', type=Path, required=True)
font = args.parse_args().soundfont
sources = json.loads(Path('scripts/audio-sources.json').read_text())
assert hashlib.sha256(font.read_bytes()).hexdigest() == sources['instruments']['soundfont_sha256'], 'Unexpected SoundFont'
lib = C.CDLL(ctypes.util.find_library('fluidsynth'))


def api(name, result, *types):
    f = getattr(lib, name)
    f.restype, f.argtypes = result, list(types)
    return f


ptr, integer = C.c_void_p, C.c_int
settings_new = api('new_fluid_settings', ptr)
settings_num = api('fluid_settings_setnum', integer, ptr, C.c_char_p, C.c_double)
settings_int = api('fluid_settings_setint', integer, ptr, C.c_char_p, integer)
synth_new = api('new_fluid_synth', ptr, ptr)
load = api('fluid_synth_sfload', integer, ptr, C.c_char_p, integer)
program = api('fluid_synth_program_change', integer, ptr, integer, integer)
control = api('fluid_synth_cc', integer, ptr, integer, integer, integer)
on = api('fluid_synth_noteon', integer, ptr, integer, integer, integer)
off = api('fluid_synth_noteoff', integer, ptr, integer, integer)
write = api('fluid_synth_write_float', integer, ptr, integer, ptr, integer, integer, ptr, integer, integer)
synth_delete = api('delete_fluid_synth', None, ptr)
settings_delete = api('delete_fluid_settings', None, ptr)

# Harp, cello, orchestral strings, flute/clarinet, acoustic piano; no synth patches.
PROGRAMS = [46, 42, 48, 73, 0]
PANS = [43, 78, 57, 85, 51]
VOLUMES = [88, 52, 46, 61, 59]


def note(events, start, duration, channel, pitch, velocity):
    events.append((max(0, round(start * RATE)), 1, channel, pitch, velocity))
    events.append((max(0, round((start + duration) * RATE)), 0, channel, pitch, 0))


def render(events, seconds, wood=73):
    settings = settings_new()
    settings_num(settings, b'synth.sample-rate', RATE)
    settings_num(settings, b'synth.gain', .45)
    settings_num(settings, b'synth.reverb.room-size', .58)
    settings_num(settings, b'synth.reverb.damp', .72)
    settings_num(settings, b'synth.reverb.width', 45)
    settings_num(settings, b'synth.reverb.level', .19)
    settings_int(settings, b'synth.chorus.active', 0)
    settings_int(settings, b'synth.cpu-cores', 1)
    synth = synth_new(settings)
    if load(synth, str(font).encode(), 1) < 0:
        raise RuntimeError('Could not load acoustic instrument bank')
    for channel, patch in enumerate(PROGRAMS):
        program(synth, channel, wood if channel == 3 else patch)
        control(synth, channel, 7, VOLUMES[channel])
        control(synth, channel, 10, PANS[channel])
        control(synth, channel, 91, 25)
    output = np.zeros((round(seconds * RATE), 2), dtype=np.float32)
    cursor = 0
    try:
        for frame, kind, channel, pitch, velocity in sorted(events):
            frame = min(len(output), frame)
            if frame > cursor:
                block = output[cursor:frame]
                assert write(synth, frame-cursor, block.ctypes.data, 0, 2, block.ctypes.data, 1, 2) == 0
                cursor = frame
            (on(synth, channel, pitch, velocity) if kind else off(synth, channel, pitch))
        if cursor < len(output):
            block = output[cursor:]
            write(synth, len(block), block.ctypes.data, 0, 2, block.ctypes.data, 1, 2)
    finally:
        synth_delete(synth)
        settings_delete(settings)
    return output.astype(np.float64)


def finish(samples, peak=.48, edge=.04):
    # Warm acoustic detail, softened bow/hammer transients; no bright synthetic pad.
    samples = sosfilt(butter(2, 3600, fs=RATE, output='sos'), samples, axis=0)
    samples = sosfilt(butter(2, 55, fs=RATE, btype='highpass', output='sos'), samples, axis=0)
    count = round(edge * RATE)
    ramp = np.sin(np.linspace(0, np.pi/2, count)) ** 2
    samples[:count] *= ramp[:, None] if samples.ndim == 2 else ramp
    samples[-count:] *= ramp[::-1, None] if samples.ndim == 2 else ramp[::-1]
    samples *= peak / max(1e-9, np.max(np.abs(samples)))
    return np.round(samples * 32767).astype('<i2')


def wav(name, samples, rate=RATE):
    with wave.open(str(Path('assets') / name), 'wb') as out:
        out.setparams((2 if samples.ndim == 2 else 1, 2, rate, 0, 'NONE', 'not compressed'))
        out.writeframes(samples.tobytes())


tracks = [
    ('prairies', 'Clairière d’ivoire', 60, [48, 45, 53, 55, 52, 53, 50, 55], [4,3,4,4,3,4,3,4], 73),
    ('sous-bois', 'Murmures du sous-bois', 56, [45, 50, 48, 43, 45, 53, 50, 52], [3,3,4,4,3,4,3,4], 71),
    ('zones-humides', 'Reflets des roseaux', 64, [53, 50, 46, 48, 45, 46, 55, 48], [4,3,4,4,3,4,3,4], 73),
    ('montagnes', 'Lumière des cimes', 58, [50, 47, 55, 57, 54, 55, 52, 57], [4,3,4,4,3,4,3,4], 73),
    ('mediterranee', 'Brise de garrigue', 62, [55, 52, 48, 50, 47, 48, 45, 50], [4,3,4,4,3,4,3,4], 71),
]
# Phrase contours: chord steps, including sixths and ninths resolved to chord tones.
phrases = [
    [(0.5, 12, 1.4), (2.4, 16, 1.6), (4.5, 19, 1.8), (6.7, 14, 1.1)],
    [(0.8, 19, 1.8), (3.1, 16, 1.4), (5.3, 14, 1.2), (6.9, 12, 1.0)],
    [(0.4, 16, 2.1), (3.3, 19, 1.6), (5.4, 21, 1.1), (7.0, 19, .8)],
    [(1.2, 14, 1.3), (3.0, 12, 2.0), (5.7, 7, 1.7)],
]
for index, (name, title, bpm, roots, thirds, wood) in enumerate(tracks):
    beat = 60 / bpm
    duration = 64 * beat
    events = []
    rng = np.random.default_rng(7100 + index)
    # Two full passes render the preceding release/reverb naturally into the loop.
    for cycle in range(2):
        for chord, (root, third) in enumerate(zip(roots, thirds)):
            start = cycle * duration + chord * 8 * beat
            dynamic = [0, -4, -1, 2, -3, 1, -2, -5][chord]
            note(events, start+.06, 7.6*beat, 1, root-12, 36+dynamic)
            # Restrained upper strings with an independent inner voice.
            for pitch in [root+7, root+third+12]:
                note(events, start+.19, 7.3*beat, 2, pitch, 30+dynamic)
            note(events, start+4.15*beat, 3.2*beat, 2, root+14, 22+dynamic)
            # Harp broken chords change inversion/rhythm instead of repeating a beep motif.
            arpeggio = [0, 7, 12+third, 19, 12, 7, 14, 12+third]
            if index % 2: arpeggio = [0, 12+third, 7, 19, 14, 7, 12, 7]
            for j, interval in enumerate(arpeggio):
                if index == 3 and j in [2, 5]: continue
                human = rng.uniform(-.025,.025)
                note(events, start+(j+.14)*beat+human, 1.9*beat, 0, root+interval, int(43+dynamic+rng.integers(-4,5)))
            # Main woodwind melody, breathing space and varied four-phrase development.
            for at, interval, length in phrases[(chord+index) % len(phrases)]:
                if interval == 16: interval = 12+third
                if index == 3 and interval > 19: interval -= 12
                note(events, start+at*beat, length*beat, 3, root+interval, 38+dynamic)
            # A soft answering piano line only in the second half of alternating phrases.
            if chord % 2 == index % 2:
                for at, pitch in [(4.9, root+19), (6.0, root+12+third), (7.1, root+14)]:
                    note(events, start+at*beat, 1.6*beat, 4, pitch, 34+dynamic)
    song = render(events, 2*duration+3, wood)
    song = song[round(duration*RATE):round(2*duration*RATE)]
    data = finish(song, .46)
    output = Path('assets/music') / (name+'.mp3')
    subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(RATE),'-ac','2','-i','pipe:0',
                    '-codec:a','libmp3lame','-b:a','128k','-write_xing','1','-metadata','title='+title,
                    '-metadata','artist=Herbier des couleurs','-metadata','copyright=Original score CC0; FluidR3 instruments MIT',str(output)], input=data.tobytes(),check=True)
    print(f'{name}: {duration:.2f}s, harp/cello/strings/woodwind/piano chamber arrangement', flush=True)

# Both reveal cues use the same quiet acoustic palette, never the former sine tones.
for name, duration, long in [('reveal-celebration.wav',3.2,False),('plant-celebration.wav',5.6,True)]:
    events=[]
    for at,pitch in [(0.02,60),(.13,64),(.27,67),(.44,72),(.78,76),(1.22,74),(1.65,72)]:
        note(events,at,1.2,0,pitch,45)
    note(events,.55,1.3,3,72,33)
    for p in [48,55,64]: note(events,.1,1.9,2,p,25)
    if long:
        for at,pitch in [(2.0,67),(2.4,71),(2.8,74),(3.25,76),(3.7,72)]: note(events,at,1.15,0,pitch,42)
        note(events,2.3,1.6,3,76,31)
        for p in [48,55,60,64]: note(events,2.5,1.8,2,p,24)
    samples=render(events,duration)
    # Longer release to silence, without truncating a flute/strings sustain abruptly.
    tail=round(.55*RATE)
    samples[-tail:]*=np.linspace(1,0,tail)[:,None]**1.5
    wav(name,finish(samples,.42))

# Real CC0 stream recording: excerpt, rumble removal, light treble roll-off and short fades.
water_path=Path('assets/audio-source/soft-stream.flac')
assert hashlib.sha256(water_path.read_bytes()).hexdigest()==sources['water']['excerpt_sha256']
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(water_path),'-ar',str(RATE),'-ac','1','-f','f32le','pipe:1'])
water=np.frombuffer(raw,dtype='<f4').astype(np.float64)
water=sosfilt(butter(2,100,fs=RATE,btype='highpass',output='sos'),water)
water=sosfilt(butter(2,3900,fs=RATE,output='sos'),water)
for units in range(1,5):
    duration=.70+units*.15+.12
    start=round((.28+units*.61)*RATE)
    excerpt=water[start:start+round(duration*RATE)].copy()
    excerpt[:round(.055*RATE)]*=np.linspace(0,1,round(.055*RATE))**1.4
    excerpt[-round(.12*RATE):]*=np.linspace(1,0,round(.12*RATE))**1.4
    wav('pour.wav' if units==1 else f'pour-{units}.wav',finish(excerpt,.32,.012))

# One small damped glass resonance, not a bright bell or repeated reward sequence.
t=np.arange(round(.72*RATE))/RATE
chime=np.zeros_like(t)
for frequency, level, decay in [(1320,1,11),(2119,.17,16),(3670,.025,25)]:
    chime+=level*np.sin(2*np.pi*frequency*t)*np.exp(-decay*t)
chime*=(1-np.exp(-t*1100))*np.minimum(1,(.72-t)/.12)
wav('vial-complete.wav',finish(chime,.30,.002))

# Original scores and glass are CC0. The river excerpt already is CC0.
# Instrument sample attribution stays explicit rather than relicensing a sound bank.
legal=Path('public/licenses/cozy-audio-CC0.txt').read_text().split('Creative Commons Legal Code',1)[1]
Path('public/licenses/cozy-audio-CC0.txt').write_text('''Herbier des couleurs — Acoustic chamber soundscape

The original compositions/arrangements, scripts/generate-cozy-audio.py and the
original glass sound assets/vial-complete.wav are dedicated under CC0 1.0.
The five music MP3s and both reveal cues use FluidR3 GM acoustic instrument
samples (Frank Wen and Toby Smithe, MIT); see FluidR3-MIT.txt for their notice.
No SoundFont is distributed in the game.

The four pour WAVs derive from a CC0 recording by jackthemurray:
https://freesound.org/people/jackthemurray/sounds/433589/
https://commons.wikimedia.org/wiki/File:433589_jackthemurray_stream-river-water-up-close.wav
assets/audio-source/soft-stream.flac is its 12–18 second mono excerpt.
Edits: resampling, rumble removal, treble softening, short fades and level matching.
These assets are reusable without royalties. No MAIKY/Artlist music is included.
Verified sources, licenses and SHA256 hashes: scripts/audio-sources.json.
https://creativecommons.org/publicdomain/zero/1.0/

Creative Commons Legal Code'''+legal)
