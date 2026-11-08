import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { unlockAmbience } from '../src/services/ambience';
import { BotanicalGuide } from '../src/components/BotanicalGuide';
import { useGame } from '../src/state/store';

export default function Aide() {
  const { save, setSave } = useGame();
  const { premiersPas } = useLocalSearchParams<{ premiersPas?: string }>();
  if (!save.started) return null;
  const enter = () => {
    unlockAmbience();
    if (!save.guideSeen) setSave((value) => ({ ...value, guideSeen: true }));
    router.replace('/atelier');
  };
  return (
    <BotanicalGuide
      nickname={save.nickname}
      motion={save.settings.motion}
      firstRun={premiersPas === '1'}
      onEnter={enter}
      onClose={() =>
        premiersPas === '1' ? enter() : router.canGoBack() ? router.back() : router.replace('/')
      }
    />
  );
}
