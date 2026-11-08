import React from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Botanical } from './Botanical';
import { SealAnimation } from './SealAnimation';
import { Paper } from './Paper';
import { F } from './fonts';
import { T, C } from './ui';
import { useNativeProgress } from './useNativeProgress';

/** A viewport-level presentation: scrolling the result cannot hide the stamping. */
export function SealCeremony({
  index,
  name,
  sound,
  onDone,
  viewport,
}: {
  index: number;
  name: string;
  sound: boolean;
  onDone: () => void;
  viewport?: { width: number; height: number };
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const availableWidth = viewport?.width ?? width;
  const availableHeight = viewport?.height ?? height;
  const compact = availableHeight < 640;
  const short = availableHeight < 350;
  const size = Math.max(
    40,
    Math.min(
      320,
      availableWidth - 60,
      (availableHeight - (short ? 118 : compact ? 160 : 220) * Math.min(1.3, fontScale)) / 1.36,
    ),
  );
  const { value } = useNativeProgress(240, true);
  return (
    <View
      testID="seal-ceremony-focus"
      accessibilityViewIsModal
      onAccessibilityEscape={onDone}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: '#1d302be6',
          justifyContent: 'center',
          alignItems: 'center',
          padding: compact ? 8 : 16,
        },
      ]}
    >
      <Animated.View
        style={{
          opacity: value,
          width: '100%',
          maxWidth: 420,
          transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        }}
      >
        <Paper
          vitality={1}
          style={{
            backgroundColor: C.paper,
            borderRadius: 28,
            paddingVertical: compact ? 12 : 24,
            paddingHorizontal: 20,
            alignItems: 'center',
          }}
        >
          <T maxFontSizeMultiplier={1.3} style={{ fontSize: 10, lineHeight: 16, letterSpacing: 2 }}>
            LE SCEAU DU BOTANISTE
          </T>
          <T
            serif
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontSize: compact ? 23 : 29,
              lineHeight: compact ? 27 : 35,
              marginTop: compact ? 4 : 8,
              marginBottom: compact ? 8 : 12,
              textAlign: 'center',
            }}
          >
            {name}
          </T>
          <View testID="focused-finished-plate" style={{ width: size, height: size * 1.36 }}>
            <Botanical index={index} stage={4} size={size} />
            <SealAnimation size={size} motion sound={sound} onDone={onDone} />
          </View>
          {!short && (
            <T
              maxFontSizeMultiplier={1.3}
              numberOfLines={2}
              style={{
                marginTop: compact ? 8 : 14,
                fontSize: 15,
                lineHeight: 21,
                textAlign: 'center',
                fontFamily: F.scientific,
                color: C.green,
              }}
            >
              Une nouvelle merveille rejoint votre herbier.
            </T>
          )}
        </Paper>
      </Animated.View>
    </View>
  );
}
