import React from 'react';
import { router } from 'expo-router';
import { BotanicalGuide } from '../src/components/BotanicalGuide';
import { useGame } from '../src/state/store';

export default function Aide() {
  const { save } = useGame();
  if (!save.guideSeen) return null;
  return (
    <BotanicalGuide
      nickname={save.nickname}
      motion={save.settings.motion}
      onEnter={() => router.replace('/')}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}
