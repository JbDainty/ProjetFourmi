import React from 'react';
import { Image, StyleSheet, View, type ViewProps } from 'react-native';

/** Non-interactive paper overlay: it never consumes a game gesture. */
export function PaperTexture({
  background = false,
  framed = false,
}: {
  background?: boolean;
  framed?: boolean;
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
      {framed && (
        <>
          <View
            style={[
              StyleSheet.absoluteFill,
              { margin: 8, borderWidth: 1, borderColor: '#8e70492b', borderRadius: 2 },
            ]}
          />
          <View
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              width: 24,
              height: 1,
              backgroundColor: '#9e7e4e55',
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              width: 24,
              height: 1,
              backgroundColor: '#9e7e4e55',
            }}
          />
        </>
      )}
    </View>
  );
}
export function Paper({ children, style, ...props }: ViewProps) {
  return (
    <View {...props} style={[{ overflow: 'hidden', zIndex: 0 }, style]}>
      <PaperTexture framed />
      {children}
    </View>
  );
}
