import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { T, C } from './ui';

export function PageFolio({ page, compact = false }: { page: number; compact?: boolean }) {
  return (
    <View
      testID="page-folio"
      style={{
        alignItems: 'center',
        width: compact ? 108 : undefined,
        height: compact ? 24 : 36,
        marginBottom: compact ? 0 : 8,
      }}
    >
      <Svg
        pointerEvents="none"
        accessible={false}
        width={compact ? 108 : 172}
        height={compact ? 24 : 34}
        viewBox="0 0 172 34"
        style={{ position: 'absolute' }}
      >
        <G
          fill="none"
          stroke="#a68c57"
          strokeWidth="0.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M9 20 Q30 24 49 18 M123 18 Q142 24 163 20 M30 22 Q25 16 19 17 Q21 23 30 22 M142 22 Q147 16 153 17 Q151 23 142 22 M42 20 Q40 15 44 12 Q48 17 42 20 M130 20 Q132 15 128 12 Q124 17 130 20 M64 31 Q86 35 108 31" />
          <Circle cx="5" cy="19" r="1" />
          <Circle cx="167" cy="19" r="1" />
        </G>
      </Svg>
      <T
        serif
        maxFontSizeMultiplier={compact ? 1 : undefined}
        style={{
          fontSize: compact ? 10 : 12,
          lineHeight: compact ? 22 : 29,
          color: '#826c3e',
          letterSpacing: 1.3,
        }}
      >
        PAGE{' '}
        <T
          serif
          maxFontSizeMultiplier={compact ? 1 : undefined}
          style={{ fontSize: compact ? 19 : 25, lineHeight: compact ? 22 : 29, color: C.green }}
        >
          {String(page).padStart(2, '0')}
        </T>
      </T>
    </View>
  );
}
