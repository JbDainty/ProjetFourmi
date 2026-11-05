import { BookScrollView } from '../src/components/BookScrollView';
import { F } from '../src/components/fonts';
import { Paper, PaperTexture } from '../src/components/Paper';
import React, { useState } from 'react';
import { View, ScrollView, Pressable, Modal, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { species } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { restoration, unlocked } from '../src/state/model';
import { Botanical } from '../src/components/Botanical';
import { T, Label, Button, Progress, Icon, C, ui } from '../src/components/ui';
export default function Herbier() {
  const { save } = useGame(),
    params = useLocalSearchParams<{ plant?: string }>(),
    { width } = useWindowDimensions();
  const [selected, select] = useState<number | null>(
      params.plant && Number(params.plant) >= 0 && Number(params.plant) < 20
        ? Number(params.plant)
        : null,
    ),
    [pigments, setPigments] = useState(false),
    [zoom, setZoom] = useState(false);
  const complete = species.filter((_, i) => restoration(save, i) === 5).length;
  return (
    <BookScrollView contentContainerStyle={ui.page}>
      <Label>LA COLLECTION BOTANIQUE</Label>
      <T serif style={ui.title}>
        Le Grand Herbier
      </T>
      <T style={ui.muted}>Vingt rencontres avec le vivant. Une couleur après l’autre.</T>
      <View
        style={[ui.row, { marginVertical: 25, justifyContent: 'space-between', flexWrap: 'wrap' }]}
      >
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
          <Button icon="book-outline" secondary={pigments} onPress={() => setPigments(false)}>
            Les planches
          </Button>
          <Button icon="water-outline" secondary={!pigments} onPress={() => setPigments(true)}>
            Les pigments
          </Button>
        </View>
        <Label>{complete} / 20 PLANCHES RESTAURÉES</Label>
      </View>
      {pigments ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {save.pigments.length === 0 ? (
            <T style={ui.muted}>Votre premier pigment vous attend à l’atelier.</T>
          ) : (
            save.pigments.map((p) => (
              <Paper key={p.id} style={[ui.card, { width: width < 600 ? '100%' : 230 }]}>
                <View
                  style={{
                    height: 75,
                    backgroundColor: p.shade,
                    borderRadius: 14,
                    marginBottom: 16,
                  }}
                />
                <T serif style={{ fontSize: 24 }}>
                  {p.name}
                </T>
                <T style={{ fontSize: 12, color: C.muted }}>{species[p.species].name}</T>
                <T style={{ fontFamily: F.scientific, fontSize: 16 }}>{species[p.species].latin}</T>
                <T style={{ fontSize: 10, marginTop: 10, color: C.muted }}>
                  Découvert le {new Date(p.discovered).toLocaleDateString('fr-FR')}
                </T>
              </Paper>
            ))
          )}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
          {species.map((s, i) => {
            const stage = restoration(save, i),
              open = unlocked(save, i * 5 + 1);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Observer ${s.name}`}
                key={s.latin}
                onPress={() => {
                  select(i);
                  setZoom(false);
                }}
                style={[
                  ui.card,
                  {
                    width: width < 600 ? '100%' : width < 1100 ? '47%' : '31%',
                    padding: 24,
                    alignItems: 'center',
                  },
                ]}
              >
                <PaperTexture framed vitality={stage / 5} />
                <View
                  style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Label>PL. {String(i + 1).padStart(2, '0')}</Label>
                  <Icon
                    name={
                      stage === 5
                        ? 'checkmark-circle-outline'
                        : open
                          ? 'ellipse-outline'
                          : 'lock-closed-outline'
                    }
                    color={C.gold}
                    size={16}
                  />
                </View>
                <Botanical index={i} stage={stage} size={180} labels={false} />
                <T serif style={{ fontSize: 25 }}>
                  {s.name}
                </T>
                <T style={{ fontFamily: F.scientific, fontSize: 17, color: C.muted }}>{s.latin}</T>
                <View style={{ width: '100%', marginTop: 18 }}>
                  <Progress value={stage / 5} />
                  <T style={{ textAlign: 'center', fontSize: 10, color: C.muted, marginTop: 7 }}>
                    {stage === 5 ? 'RESTAURÉE' : open ? `${stage} / 5 PIGMENTS` : 'À DÉCOUVRIR'}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => select(null)}
      >
        <View
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
                    onPress={() => select(null)}
                    style={{ padding: 12 }}
                  >
                    <Icon name="close-outline" />
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Agrandir l’illustration"
                  onPress={() => setZoom(!zoom)}
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
                  Restauration : {restoration(save, selected)} / 5 pigments
                  {restoration(save, selected) === 5
                    ? ` · Achevée le ${new Date(save.completed[(selected + 1) * 5].date).toLocaleDateString('fr-FR')}`
                    : ''}
                </T>
                <Button
                  icon="book-outline"
                  secondary
                  onPress={() => select(null)}
                  style={{ marginTop: 22 }}
                >
                  Refermer la planche
                </Button>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </BookScrollView>
  );
}
