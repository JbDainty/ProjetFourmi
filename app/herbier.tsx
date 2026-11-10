import { BookScrollView } from '../src/components/BookScrollView';
import { F } from '../src/components/fonts';
import { Paper, PaperTexture } from '../src/components/Paper';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  useWindowDimensions,
  BackHandler,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { chapters } from '../src/data/botany';
import { plantsForEcosystem } from '../src/data/ecology';
import { species } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { restoration, unlocked, type Save } from '../src/state/model';
import { Botanical } from '../src/components/Botanical';
import { BotanicalSeal } from '../src/components/BotanicalSeal';
import { RestorationProgress } from '../src/components/RestorationProgress';
import { restorationCaption } from '../src/animation/restoration';
import { T, Label, Button, Icon, C, ui } from '../src/components/ui';
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
            save.pigments.slice(pigmentPage * 20, pigmentPage * 20 + 20).map((p) => (
              <Paper key={p.id} style={[ui.card, { width: width < 600 ? '100%' : 230 }]}>
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
          {chapters.map((eco, i) => {
            const plants = plantsForEcosystem(i),
              done = plants.filter((p) => restoration(save, p) === 5).length;
            return (
              <Pressable
                key={eco.name}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir le carnet ${eco.name}`}
                onPress={() =>
                  router.push({ pathname: '/carnet' as any, params: { ecosystem: String(i) } })
                }
                style={{ width: width < 600 ? '100%' : '47%', minHeight: 190 }}
              >
                <Paper
                  style={{
                    padding: 28,
                    borderRadius: 24,
                    backgroundColor: '#f4ead6',
                    height: '100%',
                    gap: 8,
                  }}
                  vitality={done / 10}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                    <View style={{ backgroundColor: eco.color, padding: 12, borderRadius: 10 }}>
                      <Icon name="book-outline" size={44} color="#eee5c6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label>CARNET {String(i + 1).padStart(2, '0')}</Label>
                      <T serif style={{ fontSize: 25, lineHeight: 29 }}>
                        {eco.name}
                      </T>
                    </View>
                  </View>
                  <T style={{ fontFamily: F.scientific, color: C.muted }}>{eco.subtitle}</T>
                  <T>
                    {done} / {plants.length} planches estampillées
                  </T>
                </Paper>
              </Pressable>
            );
          })}
        </View>
      )}
      {pigments && save.pigments.length > 20 && (
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
            disabled={(pigmentPage + 1) * 20 >= save.pigments.length}
            onPress={() => setPigmentPage((p) => p + 1)}
          >
            Suivants
          </Button>
        </View>
      )}
      <Modal
        visible={selected !== null}
        transparent
        animationType={save.settings.motion ? 'fade' : 'none'}
        onRequestClose={closePlate}
      >
        {selected !== null && (
          <HerbariumPlate
            selected={selected}
            save={save}
            width={width}
            zoom={zoom}
            onZoom={() => setZoom((value) => !value)}
            onClose={closePlate}
          />
        )}
      </Modal>
    </BookScrollView>
  );
}

/** Linked entries draw the actual plate as their first native view, without presenting a Modal
 * over twenty freshly mounted collection cards. Collection entries retain their existing dialog. */
export function HerbariumPlate({
  selected,
  save,
  width,
  zoom,
  onZoom,
  onClose,
  direct = false,
}: {
  selected: number;
  save: Save;
  width: number;
  zoom: boolean;
  onZoom: () => void;
  onClose: () => void;
  direct?: boolean;
}) {
  useEffect(() => {
    if (!direct) return;
    if (Platform.OS === 'web') {
      const key = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      };
      document.addEventListener('keydown', key);
      return () => document.removeEventListener('keydown', key);
    }
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => back.remove();
  }, [direct, onClose]);
  return (
    <View
      testID={direct ? 'herbarium-direct-plate' : 'herbarium-plate'}
      accessibilityViewIsModal
      style={{
        flex: 1,
        backgroundColor: '#253b30b0',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      {selected !== null && (
        <ScrollView
          testID="herbarium-plate-scroll"
          style={{
            width: '100%',
            maxWidth: 700,
            maxHeight: '95%',
            backgroundColor: C.paper,
            borderRadius: 28,
          }}
        >
          <View style={{ padding: 26, zIndex: 0 }}>
            <PaperTexture
              framed
              vitality={selected === null ? 0 : restoration(save, selected) / 5}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Label>
                PLANCHE {String(selected + 1).padStart(2, '0')} · {species[selected].family}
              </Label>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer la planche"
                onPress={() => onClose()}
                style={{ padding: 12 }}
              >
                <Icon name="close-outline" />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Agrandir l’illustration"
              onPress={() => onZoom()}
              style={{ alignItems: 'center', overflow: 'hidden' }}
            >
              <Botanical
                index={selected}
                stage={restoration(save, selected)}
                size={zoom ? Math.min(width - 60, 600) : Math.min(width - 90, 310)}
              />
              <T style={{ fontSize: 11, color: C.muted }}>
                Touchez pour {zoom ? 'réduire' : 'agrandir'} la planche
              </T>
            </Pressable>
            <T serif style={{ fontSize: 38, lineHeight: 44, marginTop: 20 }}>
              {species[selected].name}
            </T>
            <T style={{ fontFamily: F.scientific, fontSize: 24, color: C.muted }}>
              {species[selected].latin}
            </T>
            <View style={ui.rule} />
            <Label>HABITAT</Label>
            <T style={{ marginTop: 6, marginBottom: 14 }}>{species[selected].habitat}</T>
            <Label>FLORAISON INDICATIVE · SELON L’ALTITUDE ET LE CLIMAT</Label>
            <T style={{ marginTop: 6, marginBottom: 20 }}>{species[selected].bloom}</T>
            <T style={{ lineHeight: 25 }}>{species[selected].facts}</T>
            <T style={{ fontSize: 11, color: C.muted, marginTop: 20 }}>
              {restorationCaption(restoration(save, selected))}
              {restoration(save, selected) === 5
                ? ` · Achevée le ${new Date(save.completed[(selected + 1) * 5].date).toLocaleDateString('fr-FR')}`
                : ''}
            </T>
            <Button
              icon="book-outline"
              secondary
              onPress={() => onClose()}
              style={{ marginTop: 22 }}
            >
              Refermer la planche
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
