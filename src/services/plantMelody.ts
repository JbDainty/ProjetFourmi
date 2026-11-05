import { createBotanicalCue } from './botanicalAudio';
const cue = createBotanicalCue(require('../../assets/plant-celebration.wav'), 0.2, 0.16);
export const preparePlantMelody = cue.prepare;
export const playPlantMelody = cue.play;
