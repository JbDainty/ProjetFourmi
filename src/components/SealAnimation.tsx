import React, { memo, useEffect, useId, useMemo } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { BotanicalSeal } from './BotanicalSeal';
import { sealPosition } from '../animation/restoration';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import { playSealSound } from '../services/sealSound';

const duration = 2800;
const impact = 0.4;
const WoodenStamp = memo(function WoodenStamp({ factor }: { factor: number }) {
  const id = 'wood-stamp-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg width={112 * factor} height={152 * factor} viewBox="-56 -132 112 152" accessible={false}>
      <Defs>
        <LinearGradient id={`${id}-wood`}>
          <Stop stopColor="#302b20" />
          <Stop offset="0.28" stopColor="#896b40" />
          <Stop offset="0.48" stopColor="#bd9c61" />
          <Stop offset="0.65" stopColor="#795c36" />
          <Stop offset="1" stopColor="#312b20" />
        </LinearGradient>
        <LinearGradient id={`${id}-brass`} x1="0" y1="0" x2="0" y2="1">
          <Stop stopColor="#d7bf80" />
          <Stop offset="0.5" stopColor="#9f8249" />
          <Stop offset="1" stopColor="#675635" />
        </LinearGradient>
      </Defs>
      <G transform={`rotate(${sealPosition.angle})`}>
        <Ellipse cx="0" cy="4" rx="37" ry="8" fill="#39372a" />
        <Path
          d="M-38-10 Q0-20 38-10 L38 0 Q0 13-38 0Z"
          fill={`url(#${id}-wood)`}
          stroke="#55412a"
          strokeWidth="1"
        />
        <Ellipse
          cx="0"
          cy="-10"
          rx="38"
          ry="9"
          fill={`url(#${id}-brass)`}
          stroke="#6b5936"
          strokeWidth="0.8"
        />
        <Ellipse cx="0" cy="-12" rx="31" ry="6" fill="none" stroke="#eddda9" strokeWidth="0.7" />
        <Path
          d="M-12-18 C-15-31-7-43-10-59 C-14-69-26-74-25-92 C-24-114-8-122 0-122 C8-122 24-114 25-92 C26-74 14-69 10-59 C7-43 15-31 12-18Z"
          fill={`url(#${id}-wood)`}
          stroke="#4c3d28"
          strokeWidth="1.1"
        />
        <Path
          d="M-12-21 Q0-16 12-21 M-10-54 Q0-48 10-54 M-19-102 Q-13-117 0-118 M-18-99 Q-23-85-12-75"
          fill="none"
          stroke="#ddc48a"
          strokeWidth="0.8"
          opacity="0.55"
        />
        <Rect
          x="-13"
          y="-29"
          width="26"
          height="11"
          rx="3"
          fill={`url(#${id}-brass)`}
          stroke="#75603a"
          strokeWidth="0.6"
        />
        <G transform="translate(0 -91)" fill="none" stroke="#d6bc7c" strokeWidth="0.8">
          <Path d="M0 12 Q-3-2 2-15 M0 6 Q-12 3-9-5 Q1-5 0 6 M1-1 Q11-5 8-12 Q0-12 1-1" />
          <Ellipse rx="15" ry="22" strokeWidth="0.5" />
        </G>
        <Path
          d="M-31-4 Q0 3 31-4 M-30-7 Q0-1 30-7"
          stroke="#e5ce91"
          strokeWidth="0.6"
          fill="none"
          opacity="0.6"
        />
      </G>
    </Svg>
  );
});

/** A carved wood tool lands, presses, leaves its botanical imprint and lifts away. */
export function SealAnimation({
  size,
  motion,
  sound,
  onDone,
}: {
  size: number;
  motion: boolean;
  sound: boolean;
  onDone: () => void;
}) {
  usePrimaryAnimation(true);
  const { value } = useNativeProgress(duration, motion, onDone);
  useEffect(() => playSealSound(sound, motion ? duration * impact : 0), [sound, motion]);
  useEffect(() => {
    if (!motion) onDone();
  }, [motion, onDone]);
  const factor = size / 360;
  const toolFactor = (factor * sealPosition.diameter) / 76;
  const diameter = sealPosition.diameter * factor;
  const curves = useMemo(
    () => ({
      lift: value.interpolate({
        inputRange: [0, 0.16, 0.29, impact, 0.47, 0.55, 0.76, 1],
        outputRange: [-190, -150, -52, 0, -1, 0, -100, -210].map((y) => y * toolFactor),
      }),
      drift: value.interpolate({
        inputRange: [0, impact, 0.5, 1],
        outputRange: [35, 0, 0, -28].map((x) => x * factor),
      }),
      turn: value.interpolate({
        inputRange: [0, 0.24, impact, 0.52, 1],
        outputRange: ['22deg', '8deg', '0deg', '0deg', '-15deg'],
      }),
      scale: value.interpolate({
        inputRange: [0, 0.29, impact, 0.46, 0.55, 1],
        outputRange: [1.3, 1.12, 1, 0.97, 1, 1.15],
      }),
      toolOpacity: value.interpolate({
        inputRange: [0, 0.08, 0.72, 0.9, 1],
        outputRange: [0, 1, 1, 0, 0],
      }),
      inkOpacity: value.interpolate({
        inputRange: [0, impact - 0.005, impact, 0.44, 1],
        outputRange: [0, 0, 1, 0.88, 1],
      }),
      inkScale: value.interpolate({
        inputRange: [0, impact, 0.42, 0.54, 1],
        outputRange: [1.1, 1.1, 0.99, 1, 1],
      }),
      poolOpacity: value.interpolate({
        inputRange: [0, 0.12, 0.2, impact, impact + 0.005, 1],
        outputRange: [0, 0, 1, 1, 0, 0],
      }),
      poolScale: value.interpolate({
        inputRange: [0, 0.12, 0.27, impact, 1],
        outputRange: [0.1, 0.1, 0.85, 1, 1],
      }),
      dustOpacity: value.interpolate({
        inputRange: [0, impact, 0.47, 0.76, 1],
        outputRange: [0, 0, 0.55, 0, 0],
      }),
      dustScale: value.interpolate({
        inputRange: [0, impact, 0.68, 1],
        outputRange: [0.7, 0.7, 1.3, 1.3],
      }),
    }),
    [value, factor, toolFactor],
  );
  const cx = sealPosition.x * factor,
    cy = sealPosition.y * factor;
  return (
    <View
      testID="ancient-stamp-animation"
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Animated.View
        testID="molten-red-wax"
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{
          position: 'absolute',
          left: cx - diameter / 2,
          top: cy - diameter / 2,
          opacity: curves.poolOpacity,
          transform: [{ scale: curves.poolScale }],
        }}
      >
        <Svg width={diameter} height={diameter} viewBox="-38 -38 76 76" accessible={false}>
          <Defs>
            <LinearGradient id="warm-wax-pool" x1="0" y1="0" x2="0.8" y2="1">
              <Stop stopColor="#db7354" />
              <Stop offset="0.48" stopColor="#ae3734" />
              <Stop offset="1" stopColor="#7b1d29" />
            </LinearGradient>
          </Defs>
          <Path
            d="M-29-15 C-20-35 4-36 23-24 C41-12 34 13 21 27 C3 39-22 31-30 13 C-36 0-36-5-29-15Z"
            fill="url(#warm-wax-pool)"
            stroke="#8c252b"
            strokeWidth="0.8"
          />
          <Path
            d="M-24-13 Q-18-26-4-27"
            fill="none"
            stroke="#f4bd92"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.5"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        testID="seal-ink-impression"
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{
          position: 'absolute',
          left: cx - diameter / 2,
          top: cy - diameter / 2,
          opacity: curves.inkOpacity,
          transform: [{ rotate: `${sealPosition.angle}deg` }, { scale: curves.inkScale }],
        }}
      >
        <BotanicalSeal size={diameter} />
      </Animated.View>
      <Animated.View
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{
          position: 'absolute',
          left: cx - diameter / 2,
          top: cy - diameter / 2,
          opacity: curves.dustOpacity,
          transform: [{ scale: curves.dustScale }],
        }}
      >
        <Svg width={diameter} height={diameter} viewBox="-44 -44 88 88" accessible={false}>
          <Circle r="38" stroke="#b89a58" strokeWidth="0.6" strokeDasharray="1 7" fill="none" />
          {[-32, -19, 16, 31].map((x, i) => (
            <Path
              key={i}
              transform={`translate(${x} ${i % 2 ? -33 : 31}) rotate(${i * 28})`}
              d="M0 0 Q-7-2-4-10 Q5-7 0 0Z"
              fill="#9ea777"
            />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View
        testID="carved-wood-stamp"
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{
          position: 'absolute',
          width: 112 * toolFactor,
          height: 152 * toolFactor,
          left: cx - 56 * toolFactor,
          top: cy - 132 * toolFactor,
          opacity: curves.toolOpacity,
          transform: [
            { translateY: curves.lift },
            { translateX: curves.drift },
            { translateY: 56 * toolFactor },
            { rotate: curves.turn },
            { scale: curves.scale },
            { translateY: -56 * toolFactor },
          ],
        }}
      >
        <WoodenStamp factor={toolFactor} />
      </Animated.View>
    </View>
  );
}
