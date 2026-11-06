"""Original short wood-and-paper stamp impression; dedicated under CC0 1.0."""
from pathlib import Path
import wave
import numpy as np
from scipy.signal import butter, sosfilt
rate = 22050
t = np.arange(round(.42 * rate)) / rate
rng = np.random.default_rng(2045)
wood = sum(level * np.sin(2*np.pi*hz*t) * np.exp(-decay*t)
           for hz, level, decay in [(135, .8, 33), (245, .22, 41), (410, .08, 55)])
paper = sosfilt(butter(2, [450, 2400], fs=rate, btype='bandpass', output='sos'), rng.normal(0, 1, len(t)))
waveform = (wood + paper*.2*np.exp(-t*29)) * (1-np.exp(-t*1500))
waveform[-round(.08*rate):] *= np.linspace(1,0,round(.08*rate))**2
waveform *= .35 / np.max(np.abs(waveform))
with wave.open(str(Path('assets/seal-impression.wav')), 'wb') as out:
 out.setparams((1,2,rate,0,'NONE','not compressed'))
 out.writeframes(np.round(waveform*32767).astype('<i2').tobytes())
print('Original seal impression: 0.42s mono PCM, 22050Hz, CC0.')
