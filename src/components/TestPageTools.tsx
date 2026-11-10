import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../state/store';
import { loadLevel } from '../state/model';
import { testToolsAvailable } from '../services/testTools';
import { BookActionsContext } from './BookActions';
import { Paper } from './Paper';
import { T, Label, Button, C, ui } from './ui';
export function TestPageTools() {
  const { save, setSave } = useGame();
  const { openWorkshop } = React.useContext(BookActionsContext);
  const [page, setPage] = useState(String(save.current)),
    [error, setError] = useState('');
  if (!testToolsAvailable()) return null;
  return (
    <Paper testID="test-page-tools" style={[ui.card, { marginTop: 22, gap: 12 }]}>
      <Label>CARNET D’ESSAIS · VERSION DE TEST</Label>
      <T serif style={{ fontSize: 26 }}>
        Ouvrir une page
      </T>
      <T>
        Choisissez une page de 1 à 1 000. L’essai utilise une réserve fictive et ne modifie pas
        votre progression réelle.
      </T>
      <TextInput
        accessibilityLabel="Numéro de la page à tester"
        keyboardType="number-pad"
        value={page}
        onChangeText={setPage}
        maxLength={4}
        style={{
          fontSize: 24,
          color: C.ink,
          borderBottomWidth: 1,
          borderColor: C.line,
          minHeight: 48,
        }}
      />
      {!!error && <T accessibilityRole="alert">{error}</T>}
      <Button
        onPress={() => {
          const id = Number(page);
          if (!Number.isInteger(id) || id < 1 || id > 1000) {
            setError('Choisissez un nombre entier entre 1 et 1 000.');
            return;
          }
          setSave((s) =>
            loadLevel({ ...s, testSession: s.testSession ?? { returnSave: s }, seeds: 50 }, id),
          );
          openWorkshop();
        }}
      >
        Tester cette page
      </Button>
      {save.testSession && (
        <Button
          secondary
          onPress={() => {
            setSave((s) => s.testSession?.returnSave ?? s);
            router.dismissTo('/');
          }}
        >
          Quitter l’essai et retrouver ma partie
        </Button>
      )}
    </Paper>
  );
}
