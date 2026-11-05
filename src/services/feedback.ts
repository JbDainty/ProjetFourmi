import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Settings } from '../state/model';
import { prepareLeafWind } from './leafWind';
import { preparePlantMelody } from './plantMelody';
import { preparePageSounds } from './pageSounds';
import { preparePourSounds } from './pourSound';
import { prepareRevealMelody } from './revealMelody';
import { unlockAmbience } from './ambience';
import { prepareVialChime } from './vialChime';
export function feedback(settings: Settings, success = false) {
  unlockAmbience();
  if (settings.haptics && Platform.OS !== 'web')
    void Haptics.impactAsync(
      success ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
  if (settings.sound) {
    prepareLeafWind();
    preparePlantMelody();
    preparePageSounds();
    preparePourSounds();
    prepareRevealMelody();
    prepareVialChime();
  }
}
