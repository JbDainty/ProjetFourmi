import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { species } from '../data/botany';
import { botanicalRasters } from '../data/botanicalRasters';
import { F } from './fonts';

type Props = { index: number; stage: number; size?: number; labels?: boolean };

/** The same six SVG restoration states, compiled once instead of filtering an
 * entire atlas into several offscreen bitmaps every time Android paints it. */
function BotanicalDrawing({ index, stage, size = 330, labels = true }: Props) {
  const restored = Math.round(Math.max(0, Math.min(5, stage)));
  const ink = '#806c4d';
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Planche de ${species[index].name}, ${restored} couleurs sur cinq restaurées`}
      pointerEvents="none"
      style={{ width: size, height: size * 1.36 }}
    >
      <Image
        source={botanicalRasters[index][restored]}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
        style={[StyleSheet.absoluteFill, { width: size, height: size * 1.36 }]}
      />
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
