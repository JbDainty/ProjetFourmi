import { createBotanicalCue } from './botanicalAudio';
const cue = createBotanicalCue(require('../../assets/leaf-wind.wav'), 0.22, 0.55);
export const prepareLeafWind = cue.prepare;
export const playLeafWind = cue.play;
