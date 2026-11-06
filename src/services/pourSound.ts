import type { Settings } from '../state/model';
import { timeline } from '../animation/liquid';
import { createBotanicalCue } from './botanicalAudio';
import { audioEpoch } from './audioFocus';

const cues = [
  createBotanicalCue(require('../../assets/pour.wav'), 0.26, 0.35),
  createBotanicalCue(require('../../assets/pour-2.wav'), 0.26, 0.35),
  createBotanicalCue(require('../../assets/pour-3.wav'), 0.26, 0.35),
  createBotanicalCue(require('../../assets/pour-4.wav'), 0.26, 0.35),
];
export function preparePourSounds() {
  cues.forEach((cue) => cue.prepare());
}
export function playPourSound(settings: Settings, units: number): () => void {
  if (!settings.sound) return () => {};
  const cue = cues[Math.max(0, Math.min(3, Math.round(units) - 1))];
  cue.prepare();
  let stop = () => {};
  const epoch = audioEpoch();
  const timer = setTimeout(
    () => {
      if (audioEpoch() === epoch) stop = cue.play(true);
    },
    settings.motion ? timeline(units).lift : 0,
  );
  return () => {
    clearTimeout(timer);
    stop();
  };
}
