import { createBotanicalCue } from './botanicalAudio';
import { audioEpoch } from './audioFocus';

const cue = createBotanicalCue(require('../../assets/seal-impression.wav'), 0.18, 0.55);
export function playSealSound(enabled: boolean, delay: number) {
  if (!enabled) return () => {};
  cue.prepare();
  const epoch = audioEpoch();
  let stop = () => {};
  const timer = setTimeout(() => {
    if (audioEpoch() === epoch) stop = cue.play(true);
  }, delay);
  return () => {
    clearTimeout(timer);
    stop();
  };
}
