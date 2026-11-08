import React, { memo, useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Paper } from './Paper';
import { ui } from './ui';
import { playLeafWind } from '../services/leafWind';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

const VineLeaf = memo(function VineLeaf() {
  return (
    <Svg width={28} height={32} viewBox="-14 -24 28 32" accessible={false}>
      <Defs>
        <LinearGradient id="victory-leaf" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#d0d7aa" />
          <Stop offset="0.45" stopColor="#a0b581" />
          <Stop offset="1" stopColor="#718b60" />
        </LinearGradient>
      </Defs>
      <Path
        d="M0 0 C-7-2-9-10-3-20 C4-17 9-5 0 0Z"
        fill="url(#victory-leaf)"
        stroke="#6a8054"
        strokeWidth="0.6"
      />
      <Path
        d="M0 0-3-18 M-1-7-6-11 M-2-12 2-15 M0 0 Q8 3 11-4 Q4-8 0 0"
        fill="none"
        stroke="#667f50"
        strokeWidth="0.55"
      />
    </Svg>
  );
});
const Stem = memo(function Stem({ height }: { height: number }) {
  return (
    <Svg width={32} height={height} viewBox={`0 0 32 ${height}`} accessible={false}>
      <Path
        testID="victory-vine-stem"
        d={`M16 ${height - 4} C6 ${height * 0.8} 22 ${height * 0.65} 14 ${height * 0.48} S20 ${height * 0.22} 16 4`}
        fill="none"
        stroke="#658153"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <Path
        d={`M16 ${height - 30} Q31 ${height - 47} 24 ${height - 57} Q11 ${height - 58} 19 ${height - 47} M16 36 Q32 25 24 15 Q16 10 16 19 Q19 26 24 20`}
        fill="none"
        stroke="#88925f"
        strokeWidth="0.7"
      />
    </Svg>
  );
});
const Cap = memo(function Cap({ width }: { width: number }) {
  return (
    <Svg width={width} height={26} viewBox={`0 0 ${width} 26`} accessible={false}>
      <Path
        d={`M0 20 Q-3 1 22 6 C${width * 0.3} 15 ${width * 0.4} 1 ${width / 2} 7 C${width * 0.6} 1 ${width * 0.7} 15 ${width - 22} 6 Q${width + 3} 1 ${width} 20`}
        fill="none"
        stroke="#658153"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      {[0.2, 0.36, 0.64, 0.8].map((x, i) => (
        <Path
          key={i}
          d="M0 0 C-6-2-9-12-3-18 Q9-10 0 0Z"
          transform={`translate(${width * x} 8) rotate(${i % 2 ? 20 : -28}) scale(0.65)`}
          fill="#a0b581"
          stroke="#6a8054"
          strokeWidth="0.6"
        />
      ))}
      <Circle cx="9" cy="12" r="1.7" fill="#b69b5c" />
      <Circle cx={width - 9} cy="12" r="1.7" fill="#b69b5c" />
    </Svg>
  );
});

/** Narrow, cached botanical drawings move natively; the result card never redraws per frame. */
export function VictoryPaper({
  children,
  motion,
  sound,
  frame,
  style,
}: {
  children: React.ReactNode;
  motion: boolean;
  sound: boolean;
  frame?: { width: number; height: number };
  style?: ViewStyle;
}) {
  usePrimaryAnimation(true);
  const { value, settled } = useNativeProgress(2200, motion);
  const [measured, setSize] = useState({ width: 0, height: 0 });
  const size = frame ?? measured;
  useEffect(() => playLeafWind(sound), [sound]);
  const decoration = useMemo(() => {
    const { width: w, height: h } = size;
    if (!w || !h) return null;
    const stemHeight = h - 20;
    const count = Math.min(14, Math.max(2, Math.floor((h - 88) / 43)));
    const growth = value.interpolate({
      inputRange: [0, 0.78],
      outputRange: [0.02, 1],
      extrapolate: 'clamp',
    });
    const opacity = value.interpolate({
      inputRange: [0, 0.08],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const caps = value.interpolate({
      inputRange: [0.55, 1],
      outputRange: [0.02, 1],
      extrapolate: 'clamp',
    });
    return (
      <>
        {[false, true].map((mirror) => (
          <View
            key={String(mirror)}
            style={{
              position: 'absolute',
              top: 10,
              left: mirror ? undefined : 1,
              right: mirror ? 1 : undefined,
              width: 32,
              height: stemHeight,
              transform: [{ scaleX: mirror ? -1 : 1 }],
            }}
          >
            <Animated.View
              testID="victory-vine-growth"
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              style={{
                position: 'absolute',
                width: 32,
                height: stemHeight,
                opacity,
                transform: [
                  { translateY: stemHeight / 2 },
                  { scaleY: growth },
                  { translateY: -stemHeight / 2 },
                ],
              }}
            >
              <Stem height={stemHeight} />
            </Animated.View>
            {Array.from({ length: count }, (_, i) => {
              const start = 0.08 + (i / (count - 1)) * 0.64;
              const pop = value.interpolate({
                inputRange: [start, start + 0.11, start + 0.18],
                outputRange: [0.02, 0.9, 0.8],
                extrapolate: 'clamp',
              });
              const alpha = value.interpolate({
                inputRange: [start, start + 0.04],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  renderToHardwareTextureAndroid
                  shouldRasterizeIOS
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: stemHeight - 68 - (i / (count - 1)) * (stemHeight - 104),
                    opacity: alpha,
                    transform: [{ rotate: `${35 + (i % 3) * 7}deg` }, { scale: pop }],
                  }}
                >
                  <VineLeaf />
                </Animated.View>
              );
            })}
          </View>
        ))}
        {[false, true].map((bottom) => (
          <Animated.View
            key={String(bottom)}
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={{
              position: 'absolute',
              left: 17,
              top: bottom ? undefined : 5,
              bottom: bottom ? 5 : undefined,
              width: w - 34,
              height: 26,
              opacity: caps,
              transform: [{ scaleX: caps }, { scaleY: bottom ? -1 : 1 }],
            }}
          >
            <Cap width={w - 34} />
          </Animated.View>
        ))}
      </>
    );
  }, [size, value]);
  return (
    <Paper
      testID="victory-living-paper"
      frame={false}
      style={[ui.card, { width: '100%', alignItems: 'center' }, style]}
      onLayout={({ nativeEvent: { layout } }) =>
        !frame &&
        setSize((previous) =>
          previous.width === layout.width && previous.height === layout.height
            ? previous
            : { width: layout.width, height: layout.height },
        )
      }
    >
      {children}
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        testID={settled ? 'victory-vines-settled' : 'victory-vines-growing'}
        style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
      >
        {decoration}
      </View>
    </Paper>
  );
}
