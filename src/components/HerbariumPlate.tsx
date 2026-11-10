import React, { useEffect } from 'react';
import { View, ScrollView, Pressable, BackHandler, Platform } from 'react-native';
import { PaperTexture } from './Paper';
import { Botanical } from './Botanical';
import { species } from '../data/botany';
import { restoration, type Save } from '../state/model';
import { restorationCaption } from '../animation/restoration';
import { F } from './fonts';
import { T, Label, Button, Icon, C, ui } from './ui';
/** A single plate shared by direct links and ecosystem albums. */
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
  const stage = restoration(save, selected);
  const recorded = save.completed[String((selected + 1) * 5)]?.date;
  const completedDate =
    recorded && Number.isFinite(Date.parse(recorded))
      ? new Date(recorded).toLocaleDateString('fr-FR')
      : null;
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
            <PaperTexture framed vitality={selected === null ? 0 : stage / 5} />
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
                stage={stage}
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
              {restorationCaption(stage)}
              {stage === 5 && completedDate ? ` · Achevée le ${completedDate}` : ''}
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
