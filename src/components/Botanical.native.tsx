import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { species } from '../data/botany';
import { botanicalRasters } from '../data/botanicalRasters';
import { F } from './fonts';
import { restorationDescription, restorationState } from '../animation/restoration';
import { PlateSeal } from './BotanicalSeal';

type Props = { index: number; stage: number; size?: number; labels?: boolean };

/** Five watercolor washes cached once, with a small static seal after the fifth page.
 * This avoids filtering an
 * entire atlas into several offscreen bitmaps every time Android paints it. */
function BotanicalDrawing({ index, stage, size = 330, labels = true }: Props) {
  const restored = restorationState(stage);
  // The first two washes share one strip on new plates. Clip a single cached
  // bitmap rather than decoding an atlas or adding more Expo update resources.
  const packed = index >= 20 && restored.colors < 2;
  const ink = '#806c4d';
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Planche de ${species[index].name}, ${restorationDescription(stage)}`}
      pointerEvents="none"
      style={{ width: size, height: size * 1.36 }}
    >
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Image
          source={botanicalRasters[index][restored.colors]}
          resizeMode={packed ? 'stretch' : 'contain'}
          fadeDuration={0}
          accessible={false}
          style={{
            position: 'absolute',
            top: 0,
            left: packed ? -restored.colors * size : 0,
            width: packed ? size * 2 : size,
            height: size * 1.36,
          }}
        />
      </View>
      {restored.sealed && <PlateSeal size={size} />}
      {labels && (
        <View
          style={{
            position: 'absolute',
            left: size * 0.086,
            right: size * 0.086,
            top: size * 1.311,
            borderTopWidth: 0.45,
            borderTopColor: '#9a7d548c',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: size * 0.01,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: F.medium,
              fontSize: size / 45,
              lineHeight: size / 36,
              includeFontPadding: false,
              color: ink,
              letterSpacing: size / 225,
            }}
          >
            PL. {String(index + 1).padStart(2, '0')}
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: F.scientific,
              fontSize: size / 45,
              lineHeight: size / 36,
              includeFontPadding: false,
              color: ink,
            }}
          >
            Flore d’Europe · {species[index].family}
          </Text>
        </View>
      )}
    </View>
  );
}
export const Botanical = React.memo(BotanicalDrawing);
