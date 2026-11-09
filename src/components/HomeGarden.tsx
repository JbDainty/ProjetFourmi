import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useAmbientMotion } from './usePrimaryAnimation';

const Pollen = memo(function Pollen() {
  return (
    <Svg width={74} height={160} viewBox="0 0 74 160" accessible={false}>
      <G fill="#fff1ad">
        <Circle cx="17" cy="18" r="2" />
        <Circle cx="54" cy="67" r="1.6" />
        <Circle cx="25" cy="119" r="1.4" />
        <Circle cx="63" cy="146" r="1.7" />
        <Path d="m37 29 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        <Path d="m20 80 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" />
      </G>
    </Svg>
  );
});
const Fern = memo(function Fern() {
  return (
    <Svg width={85} height={190} viewBox="0 0 85 190" accessible={false}>
      <G stroke="#4e7554" strokeWidth="0.7" fill="#90aa73" fillOpacity="0.5">
        <Path d="M4 189Q64 115 55 14" fill="none" strokeWidth="1.2" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <G key={i} transform={`translate(${20 + i * 5} ${164 - i * 21}) rotate(${-25 + i * 5})`}>
            <Path d="M0 0Q-25-6-22-21Q-6-18 0 0M2-3Q27-9 24-24Q7-20 2-3" />
            <Path d="M0 0-18-17M2-3 20-20" fill="none" />
          </G>
        ))}
      </G>
    </Svg>
  );
});

/** One shared native clock animates cached small drawings; no SVG geometry changes per frame. */
export function HomeGarden({
  width,
  height,
  motion,
}: {
  width: number;
  height: number;
  motion: boolean;
}) {
  const enabled = useAmbientMotion(motion);
  const clock = useRef(new Animated.Value(0)).current;
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!enabled) {
      clock.setValue(0);
      setRunning(false);
      return;
    }
    let animation: Animated.CompositeAnimation | undefined;
    const sync = (active: boolean) => {
      animation?.stop();
      clock.setValue(0);
      setRunning(active);
      if (!active) return;
      animation = Animated.loop(
        Animated.timing(clock, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      );
      animation.start();
    };
    sync(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const subscription = AppState.addEventListener('change', (state) => sync(state === 'active'));
    return () => {
      subscription.remove();
      animation?.stop();
      clock.stopAnimation();
    };
  }, [enabled, clock]);
  return (
    <View
      testID={running ? 'home-garden-animating' : 'home-garden-still'}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#e8e5ca' }]}
    >
      <Image
        testID="home-garden-background"
        source={require('../../assets/home/garden.png')}
        fadeDuration={0}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f6efd32a' }]} />
      {running && (
        <>
          {[false, true].map((right) => (
            <Animated.View
              key={String(right)}
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              style={{
                position: 'absolute',
                left: right ? undefined : 8,
                right: right ? 6 : undefined,
                top: height * (right ? 0.5 : 0.24),
                width: 74,
                height: 160,
                opacity: clock.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: right ? [0, 0.5, 0.9, 0.4, 0] : [0, 0.85, 0.3, 0.7, 0],
                }),
                transform: [
                  { translateY: clock.interpolate({ inputRange: [0, 1], outputRange: [25, -55] }) },
                  {
                    translateX: clock.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: right ? [0, -12, 0] : [0, 15, 0],
                    }),
                  },
                ],
              }}
            >
              <Pollen />
            </Animated.View>
          ))}
          <Animated.View
            testID="home-garden-fern"
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={{
              position: 'absolute',
              left: -13,
              bottom: height * 0.09,
              width: 85,
              height: 190,
              opacity: 0.5,
              transformOrigin: 'bottom left',
              transform: [
                {
                  rotate: clock.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['-3deg', '2deg', '-3deg'],
                  }),
                },
              ],
            }}
          >
            <Fern />
          </Animated.View>
          <Animated.View
            testID="home-garden-butterfly"
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 34,
              height: 28,
              opacity: clock.interpolate({
                inputRange: [0, 0.08, 0.3, 0.45, 1],
                outputRange: [0, 0.8, 0.8, 0, 0],
              }),
              transform: [
                {
                  translateX: clock.interpolate({
                    inputRange: [0, 0.15, 0.3, 0.45, 1],
                    outputRange: [
                      width * 0.04,
                      width * 0.13,
                      width * 0.72,
                      width * 0.91,
                      width * 0.91,
                    ],
                  }),
                },
                {
                  translateY: clock.interpolate({
                    inputRange: [0, 0.15, 0.3, 0.45, 1],
                    outputRange: [
                      height * 0.75,
                      height * 0.49,
                      height * 0.22,
                      height * 0.16,
                      height * 0.16,
                    ],
                  }),
                },
                {
                  rotate: clock.interpolate({
                    inputRange: [0, 0.2, 0.45, 1],
                    outputRange: ['-20deg', '12deg', '-14deg', '-14deg'],
                  }),
                },
              ],
            }}
          >
            <Svg width={34} height={28} viewBox="0 0 40 32" accessible={false}>
              <G fill="#e6c789" stroke="#8c784c" strokeWidth="0.7">
                <Path d="M20 16Q2-2 2 11Q1 20 15 20Q4 28 12 30Q19 31 20 18M20 16Q38-2 38 11Q39 20 25 20Q36 28 28 30Q21 31 20 18" />
                <Path d="M20 26V12M20 13Q12 7 15 5M20 13Q28 7 25 5" fill="none" />
              </G>
            </Svg>
          </Animated.View>
        </>
      )}
    </View>
  );
}
