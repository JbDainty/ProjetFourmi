import { ecosystemForPage } from '../src/data/ecology';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { View, Pressable, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chapters, species } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { unlocked, loadLevel, restoration } from '../src/state/model';
import { T, Icon, C } from '../src/components/ui';
import { Botanical } from '../src/components/Botanical';
import { Paper } from '../src/components/Paper';
import { F } from '../src/components/fonts';
import { BookActionsContext } from '../src/components/BookActions';
import { BookChromeContext } from '../src/components/BookScrollView';
import { PageTurnContext } from '../src/components/PageTurn';
import { VictoryAction } from '../src/components/VictoryAction';
import { JourneyMap } from '../src/components/JourneyMap';
import { journeyFrontier } from '../src/journey/layout';

export default function Carte() {
  const { save, setSave } = useGame();
  const turnPage = useContext(PageTurnContext);
  const { openWorkshop, enteringWorkshop } = useContext(BookActionsContext);
  const { header } = useContext(BookChromeContext);
  const { height, width } = useWindowDimensions();
  const short = height < 550;
  const frontier = journeyFrontier(save);
  const [biome, setBiome] = useState(ecosystemForPage(save.current));
  const [selected, setSelected] = useState<number | null>(null);
  const launching = useRef(false);
  const choose = useCallback((id: number) => {
    launching.current = false;
    setSelected(id);
  }, []);
  const chapter = chapters[biome];
  const total = Object.entries(save.completed)
    .filter(([id]) => ecosystemForPage(Number(id)) === biome)
    .reduce((sum, [, result]) => sum + result.stars, 0);
  const selectedSpecies = selected ? species[Math.floor((selected - 1) / 5)] : null;
  const completed = selected ? save.completed[selected] : null;
  const resume = selected === save.current && !completed;
  const play = () => {
    if (!selected || launching.current || enteringWorkshop || !unlocked(save, selected)) return;
    launching.current = true;
    const id = selected;
    setSelected(null);
    turnPage(id, () => {
      // Continuing the current attempt keeps its tubes, moves and acquired hint.
      if (!(id === save.current && !save.completed[id])) setSave((s) => loadLevel(s, id));
      openWorkshop();
    });
  };
  return (
    <View testID="ecosystems-screen" style={{ flex: 1, minHeight: 0 }}>
      {short ? (
        <View
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu principal"
            onPress={() => router.dismissTo('/')}
            style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
          >
            <Icon name="book-outline" size={26} />
          </Pressable>
          <T serif style={{ fontSize: 23 }}>
            Écosystèmes
          </T>
          <T style={{ fontSize: 12, color: C.muted }}>★ {total}</T>
        </View>
      ) : (
        header
      )}
      <View
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: 780,
          alignSelf: 'center',
          paddingHorizontal: width < 380 ? 10 : 18,
          paddingBottom: 2,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            paddingTop: short ? 0 : 4,
            paddingBottom: short ? 6 : 13,
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            {!short && (
              <T
                maxFontSizeMultiplier={1.3}
                style={{ fontSize: 10, letterSpacing: 2, color: C.muted }}
              >
                LES ÉCOSYSTÈMES · {String(biome + 1).padStart(2, '0')}
              </T>
            )}
            <T
              testID="journey-biome-title"
              serif
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontSize: short ? 23 : 32, lineHeight: short ? 27 : 38 }}
            >
              {chapter.name}
            </T>
            {!short && (
              <T
                maxFontSizeMultiplier={1.3}
                style={{ fontFamily: F.scientific, fontSize: 13, color: C.muted }}
              >
                Chaque page fait refleurir le paysage.
              </T>
            )}
          </View>
          {!short && (
            <View
              accessibilityLabel={`${total} étoiles récoltées dans cet écosystème`}
              style={{ alignItems: 'center', gap: 1 }}
            >
              <Icon name="leaf-outline" size={24} color={chapter.color} />
              <T style={{ fontSize: 13, color: C.muted }}>★ {total}</T>
            </View>
          )}
        </View>
        <JourneyMap save={save} frontier={frontier} onSelect={choose} onBiome={setBiome} />
      </View>
      <Modal
        visible={selected !== null}
        transparent
        animationType={save.settings.motion ? 'fade' : 'none'}
        onRequestClose={() => setSelected(null)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#243c31ac',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
          }}
        >
          <Pressable
            accessibilityLabel="Fermer la fiche de page"
            accessibilityRole="button"
            onPress={() => setSelected(null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {selected !== null && selectedSpecies && (
            <Paper
              testID="journey-page-dialog"
              accessibilityViewIsModal
              style={{
                width: '100%',
                maxWidth: 420,
                padding: short ? 16 : 25,
                borderRadius: 30,
                backgroundColor: C.card,
                alignItems: 'center',
                gap: short ? 4 : 8,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer la fiche"
                onPress={() => setSelected(null)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 8,
                  minHeight: 44,
                  minWidth: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                <Icon name="close-outline" size={24} />
              </Pressable>
              <T style={{ letterSpacing: 2, fontSize: 10, color: C.muted }}>
                PAGE {String(selected).padStart(2, '0')}
              </T>
              <View
                style={{
                  flexDirection: short ? 'row' : 'column',
                  alignItems: 'center',
                  gap: short ? 16 : 0,
                }}
              >
                <Botanical
                  index={Math.floor((selected - 1) / 5)}
                  stage={restoration(save, Math.floor((selected - 1) / 5))}
                  size={short ? 70 : Math.min(135, height * 0.18)}
                  labels={false}
                />
                <View style={{ alignItems: 'center' }}>
                  <T
                    serif
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontSize: short ? 25 : 30, lineHeight: 35 }}
                  >
                    {selectedSpecies.name}
                  </T>
                  <T style={{ fontFamily: F.scientific, fontSize: 13, color: C.muted }}>
                    {selectedSpecies.latin}
                  </T>
                  <T
                    testID="journey-dialog-stars"
                    accessibilityLabel={
                      completed
                        ? `${completed.stars} étoiles sur 3`
                        : 'Aucune étoile pour le moment'
                    }
                    style={{
                      color: C.gold,
                      fontSize: 23,
                      lineHeight: 29,
                      letterSpacing: 3,
                      marginTop: 4,
                    }}
                  >
                    {completed
                      ? '★'.repeat(completed.stars) + '☆'.repeat(3 - completed.stars)
                      : '☆ ☆ ☆'}
                  </T>
                </View>
              </View>
              {!short && (
                <T
                  style={{
                    fontFamily: F.scientific,
                    fontSize: 15,
                    textAlign: 'center',
                    color: C.muted,
                  }}
                >
                  {completed
                    ? 'Une page déjà fleurie… Et si vous la revisitiez ?'
                    : resume && save.moves > 0
                      ? 'Vos fioles vous attendent, là où vous les avez laissées.'
                      : 'Un nouveau fragment de nature attend vos couleurs.'}
                </T>
              )}
              <VictoryAction
                compact
                icon={completed ? 'refresh-outline' : 'leaf-outline'}
                onPress={play}
              >
                {completed
                  ? 'Rejouer cette page'
                  : resume
                    ? 'Continuer cette page'
                    : 'Explorer cette page'}
              </VictoryAction>
              {!short && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelected(null)}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <T style={{ fontFamily: F.scientific, color: C.muted }}>Rester sur le chemin</T>
                </Pressable>
              )}
            </Paper>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
