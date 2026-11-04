import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer } from 'expo-audio';
import { Settings } from '../state/model';
let player: ReturnType<typeof createAudioPlayer> | undefined;
export function feedback(settings: Settings, success = false) {
  if (settings.haptics && Platform.OS !== 'web')
    void Haptics.impactAsync(
      success ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
  if (settings.sound) {
    try {
      player ??= createAudioPlayer(require('../../assets/pour.wav'));
      void player.seekTo(0);
      player.play();
    } catch {
      /* Audio unavailable: game remains playable. */
    }
  }
}
