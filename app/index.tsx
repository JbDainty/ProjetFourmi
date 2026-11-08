import React, { useContext } from 'react';
import { HomeScreen } from '../src/components/HomeScreen';
import { useGame } from '../src/state/store';
import { BookActionsContext } from '../src/components/BookActions';

export default function Accueil() {
  const { save } = useGame();
  const { replaying } = useContext(BookActionsContext);
  return save.started && !replaying ? <HomeScreen /> : null;
}
