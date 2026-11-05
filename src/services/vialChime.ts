import { createBotanicalCue } from './botanicalAudio';

// A single, damped glass resonance at the same instant as the botanical bloom.
const cue = createBotanicalCue(require('../../assets/vial-complete.wav'), 0.14, 0.65);
export const prepareVialChime = cue.prepare;
export const playVialChime = cue.play;
