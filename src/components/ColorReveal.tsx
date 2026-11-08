import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Botanical } from './Botanical';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

/** Two immutable plates crossfade on the native UI thread, including their watercolor texture. */
export function ColorReveal({
  index,
  from,
  to,
  size,
  motion,
  labels = true,
}: {
  index: number;
  from: number;
  to: number;
  size: number;
  motion: boolean;
  labels?: boolean;
}) {
  const { value, settled } = useNativeProgress(1400, motion && from !== to);
  usePrimaryAnimation(!settled);
  return (
    <View testID="watercolor-reveal" style={{ width: size, height: size * 1.36 }}>
      {!settled && (
        <Animated.View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[
            StyleSheet.absoluteFill,
            { opacity: value.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
          ]}
        >
          <Botanical index={index} stage={from} size={size} labels={labels} />
        </Animated.View>
      )}
      <Animated.View
        testID="watercolor-target"
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={[StyleSheet.absoluteFill, { opacity: value }]}
      >
        <Botanical index={index} stage={to} size={size} labels={labels} />
      </Animated.View>
    </View>
  );
}
