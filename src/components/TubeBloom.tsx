import React, { memo, useId, useMemo } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '../data/botany';
import { colorMix } from '../animation/liquid';
import { useNativeProgress } from './useNativeProgress';

const BloomLeaf = memo(function BloomLeaf({ scale }: { scale: number }) {
  return (
    <Svg width={32 * scale} height={32 * scale} viewBox="-16 -24 32 32" accessible={false}>
      <Path
        d="M0 0 C-12-4-13-17-3-23 Q10-11 0 0Z"
        fill="#b8c493"
        stroke="#809467"
        strokeWidth="0.9"
      />
      <Path d="M0 0-3-20" fill="none" stroke="#6f8659" strokeWidth="0.7" />
    </Svg>
  );
});
const BloomStem = memo(function BloomStem({ scale }: { scale: number }) {
  return (
    <Svg width={88 * scale} height={160 * scale} viewBox="-44 0 88 160" accessible={false}>
      <Path
        testID="vial-bloom-stem"
        d="M-28 152 C-36 116-28 104-31 77 S-34 30-23 9 M28 152 C35 120 27 102 31 76 S32 33 23 9"
        fill="none"
        stroke="#90a775"
        strokeWidth="1.1"
      />
    </Svg>
  );
});
const BloomFlower = memo(function BloomFlower({ scale, gold }: { scale: number; gold: string }) {
  return (
    <Svg width={34 * scale} height={34 * scale} viewBox="-17 -17 34 34" accessible={false}>
      {Array.from({ length: 5 }, (_, i) => (
        <Path
          key={i}
          transform={`rotate(${i * 72})`}
          d="M0 2 C-6-1-7-10 0-14 C7-10 6-1 0 2Z"
          fill={gold}
          stroke="#b39b59"
          strokeWidth="0.7"
        />
      ))}
      <Circle r="2.7" fill="#fff4c4" stroke="#a0a16b" strokeWidth="0.65" />
    </Svg>
  );
});

/** Independent view overlay: no SVG-root redraws alongside a moving vessel. */
export const TubeBloom = memo(function TubeBloom({
  motion,
  color,
  onDone,
  x,
  y,
  scale,
}: {
  motion: boolean;
  color: number;
  onDone: () => void;
  x: number;
  y: number;
  scale: number;
}) {
  const { value } = useNativeProgress(1750, motion, onDone, 1300);
  const token = 'tube-bloom-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gold = colorMix(palette[color], '#e8ca76', 0.62);
  const art = useMemo(() => {
    const fade = value.interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 1, 0] });
    const growth = value.interpolate({
      inputRange: [0, 0.45],
      outputRange: [0.02, 1],
      extrapolate: 'clamp',
    });
    const particles = [0, 1, 2, 3, 4, 5].map((i) => {
      const frames = [0, 0.2, 0.5, 0.8, 1];
      return {
        x: value.interpolate({
          inputRange: frames,
          outputRange: frames.map((p) => Math.sin(i * 2.3 + p * 3) * (25 + p * 8) * scale),
        }),
        y: value.interpolate({
          inputRange: [0, 1],
          outputRange: [130 * scale, (22 - i * 10) * scale],
        }),
        fade: value.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 0.7, 0.8, 0] }),
      };
    });
    return (
      <Animated.View
        style={{ width: 88 * scale, height: 208 * scale, opacity: motion ? fade : 0.8 }}
      >
        <View
          pointerEvents="none"
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={{ position: 'absolute' }}
        >
          <Svg width={88 * scale} height={208 * scale} viewBox="-44 -24 88 208" accessible={false}>
            <Defs>
              <RadialGradient id={token}>
                <Stop stopColor={gold} stopOpacity="0.3" />
                <Stop offset="1" stopColor={gold} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="0" cy="80" rx="37" ry="88" fill={`url(#${token})`} />
          </Svg>
        </View>
        <Animated.View
          testID="vial-bloom-growth"
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={{
            position: 'absolute',
            top: 24 * scale,
            width: 88 * scale,
            height: 160 * scale,
            transform: [
              { translateY: 80 * scale },
              { scaleY: growth },
              { translateY: -80 * scale },
            ],
          }}
        >
          <BloomStem scale={scale} />
        </Animated.View>
        {[false, true].flatMap((mirror) =>
          [0, 1, 2, 3].map((i) => {
            const start = i * 0.13 * 0.45;
            const pop = value.interpolate({
              inputRange: [start, start + 0.23],
              outputRange: [0.02, 0.55],
              extrapolate: 'clamp',
            });
            const alpha = value.interpolate({
              inputRange: [start, start + 0.04],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={`${mirror}-${i}`}
                renderToHardwareTextureAndroid
                shouldRasterizeIOS
                style={{
                  position: 'absolute',
                  left: ((mirror ? 74 : 14) - 16) * scale,
                  top: (131 - i * 31) * scale,
                  opacity: alpha,
                  transform: [
                    { scaleX: mirror ? -1 : 1 },
                    { rotate: `${i % 2 ? -40 : 23}deg` },
                    { scale: pop },
                  ],
                }}
              >
                <BloomLeaf scale={scale} />
              </Animated.View>
            );
          }),
        )}
        <Animated.View
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={{ position: 'absolute', left: 27 * scale, top: 0, transform: [{ scale: growth }] }}
        >
          <BloomFlower scale={scale} gold={gold} />
        </Animated.View>
        {motion &&
          particles.map((particle, i) => (
            <Animated.View
              key={i}
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              style={{
                position: 'absolute',
                left: 40 * scale,
                top: 20 * scale,
                opacity: particle.fade,
                transform: [{ translateX: particle.x }, { translateY: particle.y }],
              }}
            >
              <Svg width={8 * scale} height={8 * scale} viewBox="-4 -4 8 8" accessible={false}>
                <Path d="M0-3 1-1 3 0 1 1 0 3-1 1-3 0-1-1Z" fill={i % 2 ? '#ecce80' : '#e4ebbb'} />
              </Svg>
            </Animated.View>
          ))}
      </Animated.View>
    );
  }, [value, motion, scale, token, gold]);
  return (
    <View
      testID={motion ? 'completed-vial-bloom' : 'completed-vial-seal'}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      style={{
        position: 'absolute',
        left: x - 44 * scale,
        top: y - 24 * scale,
        width: 88 * scale,
        height: 208 * scale,
        zIndex: 1,
      }}
    >
      {art}
    </View>
  );
});
