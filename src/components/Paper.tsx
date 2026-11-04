import React from 'react';
import { FoliageFrame } from './FoliageFrame';
import { Image, StyleSheet, View, type ViewProps } from 'react-native';

/** Non-interactive paper overlay: it never consumes a game gesture. */
export function PaperTexture({
  background = false,
  framed = false,
  vitality,
}: {
  background?: boolean;
  framed?: boolean;
  vitality?: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: -1 }]}
    >
      <Image
        source={require('../../assets/illustrations/papier.png')}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFill,
          { width: '100%', height: '100%', opacity: background ? 0.5 : 0.68 },
        ]}
      />
      {framed && <FoliageFrame vitality={vitality} />}
    </View>
  );
}
export function Paper({ children, style, vitality, ...props }: ViewProps & { vitality?: number }) {
  return (
    <View {...props} style={[{ overflow: 'hidden', zIndex: 0 }, style]}>
      <PaperTexture framed vitality={vitality} />
      {children}
    </View>
  );
}
