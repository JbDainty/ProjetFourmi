import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import {
  configureAmbience,
  disposeAmbience,
  unlockAmbience,
  prepareAmbience,
} from '../services/ambience';
import { setAudioForeground } from '../services/audioFocus';
import { stopBotanicalCues } from '../services/botanicalAudio';
import { nativeAudioLifecycle } from '../services/nativeAudio';

export function Soundscape({
  music,
  sound,
  started,
  ecosystem,
}: {
  music: boolean;
  sound: boolean;
  started: boolean;
  ecosystem: number;
}) {
  useEffect(() => {
    if (music) prepareAmbience(ecosystem);
  }, [music, ecosystem]);
  useEffect(() => {
    configureAmbience(music && started, ecosystem);
  }, [music, started, ecosystem]);
  useEffect(() => {
    if (!sound) stopBotanicalCues();
  }, [sound]);
  useEffect(() => {
    const focus = (active: boolean) => {
      if (Platform.OS === 'web') setAudioForeground(active);
      else void nativeAudioLifecycle.setActive(active);
      if (!active) stopBotanicalCues();
    };
    if (Platform.OS === 'web') {
      const visible = () => focus(!document.hidden);
      const gesture = () => unlockAmbience();
      document.addEventListener('pointerdown', gesture, { capture: true, passive: true });
      document.addEventListener('keydown', gesture, true);
      document.addEventListener('visibilitychange', visible);
      visible();
      return () => {
        document.removeEventListener('pointerdown', gesture, true);
        document.removeEventListener('keydown', gesture, true);
        document.removeEventListener('visibilitychange', visible);
        focus(false);
        disposeAmbience();
      };
    }
    focus(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const subscription = AppState.addEventListener('change', (state) => focus(state === 'active'));
    return () => {
      subscription.remove();
      focus(false);
      disposeAmbience();
    };
  }, []);
  return null;
}
