import React from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Botanical } from './Botanical';
import { SealAnimation } from './SealAnimation';
import { Paper } from './Paper';
import { F } from './fonts';
import { Label, T, C } from './ui';
import { useNativeProgress } from './useNativeProgress';

/** A viewport-level presentation: scrolling the result cannot hide the stamping. */
export function SealCeremony({
  index,
  name,
  sound,
  onDone,
}: {
  index: number;
  name: string;
  sound: boolean;
  onDone: () => void;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const size = Math.max(
    90,
    Math.min(320, width - 80, (height - 220 * Math.max(1, fontScale / 1.2)) / 1.36),
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
          padding: 16,
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
            paddingVertical: 24,
            paddingHorizontal: 20,
            alignItems: 'center',
          }}
        >
          <Label>LE SCEAU DU BOTANISTE</Label>
          <T
            serif
            style={{
              fontSize: 29,
              lineHeight: 35,
              marginTop: 8,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {name}
          </T>
          <View testID="focused-finished-plate" style={{ width: size, height: size * 1.36 }}>
            <Botanical index={index} stage={4} size={size} />
            <SealAnimation size={size} motion sound={sound} onDone={onDone} />
          </View>
          <T
            style={{
              marginTop: 14,
              fontSize: 15,
              lineHeight: 21,
              textAlign: 'center',
              fontFamily: F.scientific,
              color: C.green,
            }}
          >
            Une nouvelle merveille rejoint votre herbier.
          </T>
        </Paper>
      </Animated.View>
    </View>
  );
}
