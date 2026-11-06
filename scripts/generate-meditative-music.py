"""Original, soft orchestral ecosystem scores. CC0 compositions, MIT FluidR3 samples.

python3 scripts/generate-meditative-music.py --soundfont /path/FluidR3_GM.sf2
No reed, brass, percussion or synthesizer patches are used. All mixing is offline.
"""
import argparse
import ctypes as C
import ctypes.util
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 32000
TRACKS = {
    'sous-bois': {
        'title': 'Murmures du sous-bois', 'bpm': 56,
        'bass': [38, 46, 36, 43, 43, 46, 45, 45],
        'chords': [[53,57,64,69], [53,57,62,69], [53,55,60,67], [52,55,62,67],
                   [53,58,62,69], [53,57,60,65], [53,57,62,69], [55,57,62,67]],
        'melody': [(1.2,57,3), (5.1,60,2.3), (10,62,4), (15,65,3.8), (20,64,3.1),
                   (24.5,62,5.2), (31.1,60,3.4), (36,58,4), (41,57,4.8),
                   (47,60,3), (52,62,4), (58,57,4.8)],
        'lead': 7, 'harp_at': [0.8,3.6,6.4], 'piano_at': [3.2,6.8],
        'brightness': 3200, 'room': .72,
        'identity': 'Forest meditation: warm low cello, slow divided strings, widely spaced harp and soft piano.',
    },
    'zones-humides': {
        'title': 'Reflets des roseaux', 'bpm': 64,
        'bass': [41,38,46,36,45,46,43,36],
        'chords': [[53,57,64,67], [53,57,60,64], [53,55,60,62], [52,55,60,62],
                   [52,55,60,64], [53,57,62,65], [53,58,62,69], [53,55,60,67]],
        'melody': [(1.5,72,2), (4.7,69,2.4), (9.3,67,2.7), (13,64,2), (17.1,74,2.4),
                   (21.2,72,3), (26,67,3), (30.2,62,2.1), (34,64,3.3),
                   (39.5,67,2.5), (43.2,69,3), (49.2,74,3.3), (55,72,3), (60,67,2.8)],
        'lead': 6, 'harp_at': [0.45,2.5,5.2,7.3], 'piano_at': [],
        'brightness': 3600, 'room': .69,
        'identity': 'Water reflections: gentle piano droplets over suspended strings and floating harp inversions.',
    },
    'montagnes': {
        'title': 'Lumière des cimes', 'bpm': 58,
        'bass': [38,43,47,45,43,38,40,45],
        'chords': [[54,57,64,69], [55,59,62,69], [54,57,62,66], [52,57,62,69],
                   [55,59,64,69], [54,57,61,66], [55,59,62,66], [55,57,62,64]],
        'melody': [(2,66,5), (10,67,4.5), (18,69,4), (25.5,64,5), (34,67,4),
                   (42,66,4.6), (50,64,5), (58,62,4.4)],
        'lead': 6, 'harp_at': [1.5,5.8], 'piano_at': [6.9],
        'brightness': 3300, 'room': .79,
        'identity': 'Mountain breath: spacious string chorale, open fifths, soft piano answers and sparse harp.',
    },
    'mediterranee': {
        'title': 'Brise de garrigue', 'bpm': 62,
        'bass': [43,38,40,36,43,45,36,38],
        'chords': [[55,59,62,69], [54,57,62,66], [55,59,62,67], [55,59,64,67],
                   [54,59,62,69], [55,60,64,67], [55,59,62,67], [55,57,62,69]],
        'melody': [(1.2,67,2.3), (4.4,69,2.1), (9,66,3.2), (13.4,62,2),
                   (17.4,64,3.1), (21.5,67,2), (26,64,3.4), (31,62,2.8),
                   (36,69,3), (41,67,3.6), (46,64,3), (51,67,3.3), (57.4,62,4.3)],
        'lead': 8, 'harp_at': [0.5,2.8,5.5], 'piano_at': [3.9,7.0],
        'brightness': 3500, 'room': .65,
        'identity': 'Mediterranean light: rounded harp melody, warm strings and cello, relaxed luminous suspended chords.',
    },
}
# Four divided string voices, bass cello, harp, piano, lyrical cello. GM programs are zero-based.
PROGRAMS = [49,48,49,48,42,46,0,42,46]
VOLUMES = [49,43,40,34,43,64,49,42,64]
PANS = [30,79,51,94,57,39,83,66,67]

parser = argparse.ArgumentParser()
parser.add_argument('--soundfont', type=Path, required=True)
parser.add_argument('--tracks', nargs='+', choices=list(TRACKS), default=list(TRACKS))
args = parser.parse_args()
sources = json.loads(Path('scripts/audio-sources.json').read_text())
assert hashlib.sha256(args.soundfont.read_bytes()).hexdigest() == sources['instruments']['soundfont_sha256']
lib = C.CDLL(ctypes.util.find_library('fluidsynth'))
def api(name, result, *types):
    f = getattr(lib, name); f.restype = result; f.argtypes = list(types); return f
ptr, integer = C.c_void_p, C.c_int
settings_new = api('new_fluid_settings', ptr)
settings_num = api('fluid_settings_setnum', integer, ptr, C.c_char_p, C.c_double)
settings_int = api('fluid_settings_setint', integer, ptr, C.c_char_p, integer)
synth_new = api('new_fluid_synth', ptr, ptr)
load = api('fluid_synth_sfload', integer, ptr, C.c_char_p, integer)
program = api('fluid_synth_program_change', integer, ptr, integer, integer)
cc = api('fluid_synth_cc', integer, ptr, integer, integer, integer)
note_on = api('fluid_synth_noteon', integer, ptr, integer, integer, integer)
note_off = api('fluid_synth_noteoff', integer, ptr, integer, integer)
write = api('fluid_synth_write_float', integer, ptr, integer, ptr, integer, integer, ptr, integer, integer)
delete = api('delete_fluid_synth', None, ptr)
delete_settings = api('delete_fluid_settings', None, ptr)

def add_note(events, at, duration, channel, pitch, velocity, bowed=False):
    start, end = round(at*RATE), round((at+duration)*RATE)
    events.extend([(start, 1, channel, pitch, velocity), (end, 0, channel, pitch, 0)])
    if bowed:
        # Each string/cello voice has its own channel, so expression envelopes never fight other notes.
        attack = min(.72, duration*.18)
        release = min(.85, duration*.22)
        for step in range(13):
            phase = step/12
            level = round(91*np.sin(phase*np.pi/2)**2)
            events.append((start + round(phase*attack*RATE), 2, channel, 11, level))
            events.append((end - round((1-phase)*release*RATE), 2, channel, 11, round(91*np.cos(phase*np.pi/2)**2)))

def make_score(track):
    beat = 60/track['bpm']; period = 64*beat
    events = []
    # Repeating the same three cycles warms reverb and releases before extracting the middle loop.
    for cycle in range(3):
        origin = cycle*period
        for channel in range(4):
            chord = 0
            while chord < 8:
                pitch = track['chords'][chord][channel]
                end = chord+1
                while end < 8 and track['chords'][end][channel] == pitch:
                    end += 1
                add_note(events, origin+(chord*8+.13)*beat, ((end-chord)*8-.35)*beat,
                         channel, pitch, [41,39,36,32][channel], True)
                chord = end
        for chord, (bass, voicing) in enumerate(zip(track['bass'], track['chords'])):
            start = origin+chord*8*beat
            add_note(events, start+.16*beat, 7.55*beat, 4, bass, 35, True)
            for j, at in enumerate(track['harp_at']):
                pitch = [voicing[0],voicing[2],voicing[1],voicing[3]][(j+chord%2)%4]
                # The Mediterranean lead is itself harp: leave its sustained melody room to breathe.
                if track['lead'] == 8 and j == 1: pitch -= 12
                add_note(events, start+at*beat, 1.7*beat, 5, pitch, 34+(chord+j)%4)
            for j, at in enumerate(track['piano_at']):
                add_note(events, start+at*beat, 1.4*beat, 6, voicing[(j+2)%4], 23+(chord%3))
        for i, (at, pitch, duration) in enumerate(track['melody']):
            channel = track['lead']
            velocity = 34 if channel == 7 else 27 if channel == 6 else 38
            add_note(events, origin+at*beat, duration*beat, channel, pitch,
                     velocity+(i%3-1), channel == 7)
    return events, period

def render(events, seconds, room):
    settings = settings_new()
    for key, value in [(b'synth.sample-rate',RATE), (b'synth.gain',.42),
                       (b'synth.reverb.room-size',room), (b'synth.reverb.damp',.82),
                       (b'synth.reverb.width',55), (b'synth.reverb.level',.23)]:
        settings_num(settings, key, value)
    settings_int(settings,b'synth.chorus.active',0)
    settings_int(settings,b'synth.cpu-cores',1)
    synth = synth_new(settings)
    output = np.zeros((round(seconds*RATE),2),dtype=np.float32)
    try:
        if load(synth,str(args.soundfont).encode(),1) < 0: raise RuntimeError('SoundFont load failed')
        for channel, patch in enumerate(PROGRAMS):
            program(synth,channel,patch)
            for controller,value in [(7,VOLUMES[channel]),(10,PANS[channel]),(11,127),(91,30),(1,0)]:
                cc(synth,channel,controller,value)
        cursor = 0
        for frame, kind, channel, pitch, velocity in sorted(events):
            frame = min(len(output),max(0,frame))
            if frame > cursor:
                block=output[cursor:frame]
                if write(synth,frame-cursor,block.ctypes.data,0,2,block.ctypes.data,1,2) != 0:
                    raise RuntimeError('Audio render failed')
                cursor=frame
            if kind == 0: note_off(synth,channel,pitch)
            elif kind == 1: note_on(synth,channel,pitch,velocity)
            else: cc(synth,channel,pitch,velocity)
        if cursor < len(output):
            block=output[cursor:]
            write(synth,len(block),block.ctypes.data,0,2,block.ctypes.data,1,2)
    finally:
        delete(synth); delete_settings(settings)
    return output.astype(np.float64)

notice = ('Original composition/arrangement for Herbier des couleurs, CC0 1.0.\n'
          'FluidR3 GM acoustic instrument samples, MIT.\n'+Path('public/licenses/FluidR3-MIT.txt').read_text())
report = {}
for name in args.tracks:
    track=TRACKS[name]
    events, period=make_score(track)
    samples=render(events,3*period+3,track['room'])
    samples=sosfilt(butter(2,track['brightness'],fs=RATE,output='sos'),samples,axis=0)
    samples=sosfilt(butter(2,48,fs=RATE,btype='highpass',output='sos'),samples,axis=0)
    data=samples[round(period*RATE):round(2*period*RATE)].copy()
    # Tiny endpoint correction avoids a click without inserting silence between cycles.
    edge=round(.025*RATE)
    delta=data[0]-data[-1]
    ramp=np.sin(np.linspace(0,np.pi/2,edge))**2
    data[:edge]-=delta[None,:]/2*(1-ramp[:,None])
    data[-edge:]+=delta[None,:]/2*ramp[:,None]
    peak=np.max(np.abs(data))
    data*=.46/max(peak,1e-9)
    pcm=np.round(data*32767).astype('<i2')
    analysis=subprocess.run(['ffmpeg','-hide_banner','-f','s16le','-ar',str(RATE),'-ac','2','-i','pipe:0',
      '-af','loudnorm=I=-23:TP=-7:LRA=9:print_format=json','-f','null','-'],input=pcm.tobytes(),capture_output=True,check=True)
    text=analysis.stderr.decode(); measured=json.JSONDecoder().raw_decode(text[text.rfind('{'):])[0]
    # A single gain preserves orchestral phrasing; no pumping compressor or synthesizer layer.
    gain_db=min(-23-float(measured['input_i']), -7.0-float(measured['input_tp']))
    output=Path('assets/music')/(name+'.mp3')
    subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(RATE),'-ac','2','-i','pipe:0',
      '-af',f'volume={gain_db:.4f}dB','-codec:a','libmp3lame','-b:a','128k','-write_xing','1',
      '-metadata','title='+track['title'],'-metadata','artist=Herbier des couleurs',
      '-metadata','copyright=Original score CC0; FluidR3 instruments MIT','-metadata','comment='+notice,str(output)],input=pcm.tobytes(),check=True)
    report[name]={'title':track['title'],'bpm':track['bpm'],'seconds':round(period,6),'programs':PROGRAMS,
      'identity':track['identity'],'integrated_lufs':round(float(measured['input_i'])+gain_db,2),
      'estimated_true_peak_db':round(float(measured['input_tp'])+gain_db,2),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    print(f'{name}: {period:.2f}s, {report[name]["integrated_lufs"]:.1f} LUFS, {track["identity"]}',flush=True)
Path('scripts/meditative-music-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
