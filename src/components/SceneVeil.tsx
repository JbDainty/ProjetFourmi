import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

/** A continuous wash keeps the ATH legible without dividing the greenhouse. */
export function SceneVeil({ tint = '#f4ead6' }: { tint?: string }) {
  const id = 'scene-veil-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg
      pointerEvents="none"
      accessible={false}
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tint} stopOpacity=".98" />
          <Stop offset=".25" stopColor={tint} stopOpacity=".89" />
          <Stop offset=".46" stopColor="#f4ead6" stopOpacity=".24" />
          <Stop offset=".72" stopColor="#d4dfbc" stopOpacity=".12" />
          <Stop offset="1" stopColor={tint} stopOpacity=".86" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
