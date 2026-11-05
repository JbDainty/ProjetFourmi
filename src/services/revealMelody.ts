import { createBotanicalCue } from './botanicalAudio';
const cue = createBotanicalCue(require('../../assets/reveal-celebration.wav'), 0.2, 0.16);
export const prepareRevealMelody = cue.prepare;
export const playRevealMelody = cue.play;
