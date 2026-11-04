import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { T, C } from './ui';

/** Typeset like a botanical frontispiece; lettering stays real, accessible text. */
export function HerbariumTitle({ compact = false }: { compact?: boolean }) {
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="L’Herbier des Couleurs"
      testID="herbarium-book-title"
      style={{ alignItems: 'center', width: '100%', maxWidth: compact ? 200 : 300 }}
    >
      <T
        serif
        style={{
          fontWeight: '700',
          fontSize: compact ? 32 : 42,
          lineHeight: compact ? 36 : 46,
          letterSpacing: 0.5,
          color: C.green,
        }}
      >
        L’Herbier
      </T>
      <T
        serif
        style={{
          fontSize: compact ? 11 : 13,
          lineHeight: compact ? 15 : 18,
          letterSpacing: compact ? 2.6 : 3.5,
          color: '#826c3e',
        }}
      >
        DES COULEURS
      </T>
      <Svg
        width={compact ? 144 : 184}
        height={compact ? 11 : 14}
        viewBox="0 0 200 18"
        accessible={false}
        pointerEvents="none"
      >
        <G
          fill="none"
          stroke="#a38a51"
          strokeWidth=".9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M12 11 Q40 16 85 8 M188 11 Q160 16 115 8 M45 13 Q43 8 35 6 Q35 12 45 13 M61 12 Q62 6 70 4 Q70 10 61 12 M155 13 Q157 8 165 6 Q165 12 155 13 M139 12 Q138 6 130 4 Q130 10 139 12" />
          <Path
            d="M94 9 Q89 2 96 2 Q100 2 100 8 Q101 2 105 2 Q112 3 106 9 Q112 15 105 16 Q101 16 100 10 Q99 16 95 16 Q88 15 94 9Z"
            fill="#a38a51"
            fillOpacity=".12"
          />
          <Circle cx="100" cy="9" r="1.6" fill="#826c3e" />
          <Circle cx="5" cy="10" r="1" />
          <Circle cx="195" cy="10" r="1" />
        </G>
      </Svg>
    </View>
  );
}
