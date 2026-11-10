import { BookScrollView } from '../src/components/BookScrollView';
import { HerbariumShelf } from '../src/components/HerbariumShelf';
import { F } from '../src/components/fonts';
import { Paper } from '../src/components/Paper';
import React, { useCallback, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { species } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { restoration } from '../src/state/model';
import { HerbariumPlate } from '../src/components/HerbariumPlate';
import { BotanicalSeal } from '../src/components/BotanicalSeal';
import { T, Label, Button, C, ui } from '../src/components/ui';
export default function Herbier() {
  const { save } = useGame(),
    params = useLocalSearchParams<{ plant?: string }>(),
    { width } = useWindowDimensions();
  const linkedPlant = Number(params.plant);
  const initialPlant =
    params.plant !== undefined &&
    Number.isInteger(linkedPlant) &&
    linkedPlant >= 0 &&
    linkedPlant < species.length
      ? linkedPlant
      : null;
  const [selected, select] = useState<number | null>(initialPlant);
  const [direct, setDirect] = useState(initialPlant !== null);
  const [pigments, setPigments] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [pigmentPage, setPigmentPage] = useState(0);
  const closePlate = useCallback(() => {
    select(null);
    setDirect(false);
  }, []);
  if (direct && selected !== null) {
    return (
      <HerbariumPlate
        selected={selected}
        save={save}
        width={width}
        zoom={zoom}
        onZoom={() => setZoom((value) => !value)}
        onClose={closePlate}
        direct
      />
    );
  }
  const complete = species.filter((_, i) => restoration(save, i) === 5).length;
  return (
    <BookScrollView contentContainerStyle={ui.page}>
      <Label>LA COLLECTION BOTANIQUE</Label>
      <T testID="herbarium-collection-title" serif style={ui.title}>
        Le Grand Herbier
      </T>
      <T style={ui.muted}>Deux cents rencontres, réunies en carnets. Une couleur après l’autre.</T>
      <View
        style={[ui.row, { marginVertical: 25, justifyContent: 'space-between', flexWrap: 'wrap' }]}
      >
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
          <Button icon="book-outline" secondary={pigments} onPress={() => setPigments(false)}>
            Les planches
          </Button>
          <Button icon="water-outline" secondary={!pigments} onPress={() => setPigments(true)}>
            Pigments et sceaux
          </Button>
        </View>
        <Label>{complete} / 200 PLANCHES ESTAMPILLÉES</Label>
      </View>
      {pigments ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {save.pigments.length === 0 ? (
            <T style={ui.muted}>Votre premier pigment vous attend à l’atelier.</T>
          ) : (
            save.pigments.slice(pigmentPage * 8, pigmentPage * 8 + 8).map((p) => (
              <Paper
                key={p.id}
                frame={false}
                style={[
                  ui.card,
                  { width: width < 600 ? '100%' : 230, borderWidth: 0.7, borderColor: C.line },
                ]}
              >
                {p.id % 5 === 0 ? (
                  <View style={{ height: 75, alignItems: 'center' }}>
                    <BotanicalSeal size={74} />
                  </View>
                ) : (
                  <View
                    style={{
                      height: 75,
                      backgroundColor: p.shade,
                      borderRadius: 14,
                      marginBottom: 16,
                    }}
                  />
                )}
                <T serif style={{ fontSize: 24 }}>
                  {p.id % 5 === 0 ? 'Sceau du botaniste' : p.name}
                </T>
                <T style={{ fontSize: 12, color: C.muted }}>{species[p.species].name}</T>
                <T style={{ fontFamily: F.scientific, fontSize: 16 }}>{species[p.species].latin}</T>
                <T style={{ fontSize: 10, marginTop: 10, color: C.muted }}>
                  {p.id % 5 === 0 ? 'Apposé' : 'Découvert'} le{' '}
                  {new Date(p.discovered).toLocaleDateString('fr-FR')}
                </T>
              </Paper>
            ))
          )}
        </View>
      ) : (
        <HerbariumShelf save={save} />
      )}
      {pigments && save.pigments.length > 8 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          <Button
            secondary
            disabled={pigmentPage === 0}
            onPress={() => setPigmentPage((p) => p - 1)}
          >
            Précédents
          </Button>
          <Button
            secondary
            disabled={(pigmentPage + 1) * 8 >= save.pigments.length}
            onPress={() => setPigmentPage((p) => p + 1)}
          >
            Suivants
          </Button>
        </View>
      )}
    </BookScrollView>
  );
}
