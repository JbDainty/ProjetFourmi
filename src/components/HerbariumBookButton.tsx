import React, { memo, useId, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { T } from './ui';
import { F } from './fonts';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

const Leaf = memo(function Leaf() {
  return (
    <Svg width={10} height={14} viewBox="0 0 10 14" accessible={false}>
      <Path d="M2 12Q-2 3 8 1Q12 9 2 12Z" fill="#8f9d69" stroke="#61784f" strokeWidth=".6" />
      <Path d="M2 12 7 3M4 8 2 5M5 6 8 5" fill="none" stroke="#d8d4a3" strokeWidth=".55" />
    </Svg>
  );
});

/** Immutable plates: only their containing native views move during opening. */
const Binding = memo(function Binding() {
  const id = 'menu-binding-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg width={64} height={56} viewBox="0 0 64 56" accessible={false}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop stopColor="#b69e6a" />
          <Stop offset="0.18" stopColor="#fff2d0" />
          <Stop offset="0.86" stopColor="#e4d3a9" />
          <Stop offset="1" stopColor="#b69a5f" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="35" cy="51" rx="21" ry="2.4" fill="#4e4630" opacity=".12" />
      <Path d="M15 9 53 4 55 47 18 52 14 48Z" fill="#254636" stroke="#a28a50" strokeWidth=".9" />
      <Path d="M19 10 52 6 52 44 19 49Z" fill={`url(#${id})`} stroke="#b69b64" strokeWidth=".7" />
      <Path
        d="M23 45 50 41M23 47 50 43M24 12 49 9M24 14 49 11"
        fill="none"
        stroke="#bba579"
        strokeWidth=".55"
        opacity=".6"
      />
      <Path
        d="M14 10Q16 7 20 9L21 48Q17 52 14 48Z"
        fill="#416149"
        stroke="#ab8a4d"
        strokeWidth=".7"
      />
      <Path
        d="M15 16 20 15M15 19 20 18M15 39 20 38M15 42 20 41"
        stroke="#d1b577"
        strokeWidth=".8"
      />
      <Path d="M43 44 44 54 47 51 50 53 49 43" fill="#9d5c49" stroke="#794d3d" strokeWidth=".5" />
    </Svg>
  );
});

const Folio = memo(function Folio({ reverse = false }: { reverse?: boolean }) {
  return (
    <Svg width={38} height={48} viewBox="0 0 38 48" accessible={false}>
      <Path
        d="M1 5Q17 3 35 1L36 43Q18 44 2 47Z"
        fill={reverse ? '#e7d7af' : '#f7ebca'}
        stroke="#bca36d"
        strokeWidth=".65"
      />
      <G fill="none" stroke="#7c8e61" strokeLinecap="round" opacity=".75">
        <Path
          d="M17 36Q24 25 18 13M21 29Q12 28 12 22Q20 21 21 29M21 24Q30 20 27 15Q20 16 21 24M18 17Q12 13 17 10Q23 11 18 17"
          strokeWidth=".85"
        />
        <Path d="M8 40 29 37M10 42 27 40" strokeWidth=".55" />
      </G>
      <Path d="M5 8 5 40" stroke="#c6b58a" strokeWidth=".5" />
    </Svg>
  );
});

const Cover = memo(function Cover() {
  const id = 'menu-cover-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg width={38} height={48} viewBox="0 0 38 48" accessible={false}>
      <Defs>
        <LinearGradient id={`${id}-leather`} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#668066" />
          <Stop offset="0.38" stopColor="#345b45" />
          <Stop offset="1" stopColor="#203d30" />
        </LinearGradient>
        <LinearGradient id={`${id}-gilt`} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#f0d99c" />
          <Stop offset="0.5" stopColor="#b79a58" />
          <Stop offset="1" stopColor="#e4c982" />
        </LinearGradient>
      </Defs>
      <Path
        d="M1 5Q17 3 35 1L36 43Q18 44 2 47Z"
        fill={`url(#${id}-leather)`}
        stroke="#8d713e"
        strokeWidth="1.1"
      />
      <Path d="M4 8 32 4 33 40 5 44Z" fill="none" stroke={`url(#${id}-gilt)`} strokeWidth=".8" />
      <Path d="M6 10 30 6 31 38 7 41Z" fill="none" stroke="#c3ad72" strokeWidth=".4" opacity=".5" />
      <G fill="none" stroke={`url(#${id}-gilt)`} strokeLinecap="round" strokeLinejoin="round">
        <Path
          d="M8 13 8 10 12 9M26 7 29 7 29 11M8 36 9 39 13 38M26 37 30 36 30 32"
          strokeWidth="1"
        />
        <Path d="M16 37Q23 26 19 14" strokeWidth="1.2" />
        <Path
          d="M20 31Q10 32 11 25Q17 24 20 31ZM21 26Q30 23 27 18Q21 19 21 26ZM20 22Q12 22 13 16Q19 16 20 22Z"
          fill="#b6a56b"
          fillOpacity=".23"
          strokeWidth=".9"
        />
        <Path d="M16 38 23 37" strokeWidth=".7" />
      </G>
      <G fill="#e5ce8d" stroke="#a58c4f" strokeWidth=".4">
        <Circle cx="18.5" cy="12" r="2.3" />
        <Circle cx="20.8" cy="13.6" r="1.7" />
        <Circle cx="16.2" cy="13.8" r="1.7" />
        <Circle cx="18.6" cy="14.1" r="1" fill="#9d7750" />
      </G>
      <Path d="M3 7 4 44" stroke="#efdb9f" strokeWidth=".7" opacity=".35" />
    </Svg>
  );
});

function Glyph({ value }: { value?: Animated.Value }) {
  const turn = (delay: number, angle: number) =>
    value
      ? value.interpolate({
          inputRange: [
            0,
            delay,
            delay + (0.88 - delay) * 0.25,
            delay + (0.88 - delay) * 0.7,
            0.88,
            1,
          ],
          outputRange: [
            '0deg',
            '0deg',
            `${angle * 0.18}deg`,
            `${angle * 0.88}deg`,
            `${angle}deg`,
            `${angle}deg`,
          ],
          extrapolate: 'clamp',
        })
      : '0deg';
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: 64,
        height: 56,
        transform: value
          ? [
              {
                translateX: value.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0, 10] }),
              },
              {
                translateY: value.interpolate({
                  inputRange: [0, 0.14, 0.55, 1],
                  outputRange: [0, 1.2, -2.5, -1],
                }),
              },
              {
                scale: value.interpolate({
                  inputRange: [0, 0.14, 0.6, 1],
                  outputRange: [1, 0.95, 1.03, 1],
                }),
              },
            ]
          : undefined,
      }}
    >
      {value && (
        <Animated.View
          testID="menu-book-aura"
          style={{
            position: 'absolute',
            left: 5,
            top: 2,
            opacity: value.interpolate({
              inputRange: [0, 0.15, 0.55, 1],
              outputRange: [0, 0, 0.65, 0],
            }),
            transform: [
              { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) },
            ],
          }}
        >
          <Svg width={52} height={50} viewBox="0 0 52 50" accessible={false}>
            <Ellipse cx="26" cy="25" rx="24" ry="22" fill="#e7d79a" fillOpacity=".3" />
            <Path
              d="M6 27Q1 13 15 6M39 43Q51 36 47 20"
              fill="none"
              stroke="#c4aa68"
              strokeWidth=".65"
            />
            <Path
              d="m12 8 1-3 1 3 3 1-3 1-1 3-1-3-3-1Zm31 25 1-3 1 3 3 1-3 1-1 3-1-3-3-1Z"
              fill="#bd9f57"
            />
          </Svg>
        </Animated.View>
      )}
      <Binding />
      <View style={{ position: 'absolute', left: 18, top: 3 }}>
        <Folio />
      </View>
      {value &&
        [0, 1].map((i) => (
          <Animated.View
            key={i}
            testID={`menu-book-folio-${i}`}
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={{
              position: 'absolute',
              left: 18,
              top: 3,
              width: 38,
              height: 48,
              transformOrigin: 'left center',
              transform: [
                { perspective: 220 },
                { rotateY: turn(i ? 0.38 : 0.25, i ? -112 : -135) },
              ],
            }}
          >
            <Folio reverse={i === 1} />
          </Animated.View>
        ))}
      <Animated.View
        testID="menu-book-cover"
        renderToHardwareTextureAndroid={!!value}
        shouldRasterizeIOS={!!value}
        style={{
          position: 'absolute',
          left: 18,
          top: 3,
          width: 38,
          height: 48,
          transformOrigin: 'left center',
          transform: [{ perspective: 220 }, { rotateY: turn(0.12, -150) }],
        }}
      >
        <Cover />
      </Animated.View>
      {value &&
        [0, 1].map((i) => (
          <Animated.View
            key={i}
            testID={`menu-book-leaf-${i}`}
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={{
              position: 'absolute',
              left: i ? 43 : 16,
              top: i ? 16 : 25,
              opacity: value.interpolate({
                inputRange: [0, 0.48, 0.65, 1],
                outputRange: [0, 0, 0.9, 0],
              }),
              transform: [
                {
                  translateX: value.interpolate({
                    inputRange: [0, 0.48, 1],
                    outputRange: [0, 0, i ? 4 : -9],
                  }),
                },
                {
                  translateY: value.interpolate({
                    inputRange: [0, 0.48, 1],
                    outputRange: [0, 0, i ? -14 : -20],
                  }),
                },
                {
                  rotate: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [i ? '-20deg' : '20deg', i ? '35deg' : '-35deg'],
                  }),
                },
              ],
            }}
          >
            <Leaf />
          </Animated.View>
        ))}
    </Animated.View>
  );
}
function Opening({ onDone }: { onDone: () => void }) {
  const { value } = useNativeProgress(440, true, onDone);
  usePrimaryAnimation(true);
  return (
    <View testID="menu-return-opening">
      <Glyph value={value} />
    </View>
  );
}

export function HerbariumBookButton({
  motion,
  onHome,
  compact = false,
}: {
  motion: boolean;
  onHome: () => void;
  compact?: boolean;
}) {
  const [opening, setOpening] = useState(false);
  const activated = useRef(false);
  const activate = () => {
    if (activated.current) return;
    activated.current = true;
    if (motion) setOpening(true);
    else onHome();
  };
  return (
    <Pressable
      testID="herbarium-book-button"
      accessibilityRole="button"
      accessibilityLabel="Menu principal"
      accessibilityHint="Ouvrir le menu principal en conservant votre partie"
      accessibilityState={{ busy: opening }}
      disabled={opening}
      onPress={activate}
      style={({ pressed }) => ({
        width: compact ? 44 : 62,
        minHeight: compact ? 48 : 74,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View pointerEvents="none" style={{ width: compact ? 44 : 62, height: compact ? 34 : 54 }}>
        <View
          style={{
            position: 'absolute',
            top: compact ? -2 : 0,
            left: 0,
            width: 64,
            height: 56,
            transform: [{ scale: compact ? 0.7 : 0.95 }],
            transformOrigin: 'top left',
          }}
        >
          {opening ? <Opening onDone={onHome} /> : <Glyph />}
        </View>
      </View>
      <T
        numberOfLines={1}
        maxFontSizeMultiplier={1.15}
        style={{
          fontFamily: F.scientific,
          fontSize: compact ? 10 : 12,
          lineHeight: compact ? 12 : 16,
          height: compact ? 12 : 16,
          color: '#53684b',
          textAlign: 'center',
        }}
      >
        Menu
      </T>
    </Pressable>
  );
}
