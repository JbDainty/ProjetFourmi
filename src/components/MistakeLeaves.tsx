import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';
import { T } from './ui';
import { F } from './fonts';
import { SvgBackdrop } from './SvgBackdrop';

const lifetime = 5800;

/** A gentle correction carried by a falling, pressed botanical leaf. */
export function MistakeLeaves({
  text,
  motion,
  onDismiss,
}: {
  text: string;
  motion: boolean;
  onDismiss: () => void;
}) {
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const token = 'mistake-leaf-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => {
    if (!motion) {
      const timeout = setTimeout(() => dismiss.current(), lifetime);
      return () => clearTimeout(timeout);
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: lifetime,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) dismiss.current();
    });
    return () => animation.stop();
  }, [motion, progress]);
  const interpolate = (inputRange: number[], outputRange: number[]) =>
    progress.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
  const leaf =
    'M14 49 C31 13 99 3 164 10 C246 20 336-2 410 29 Q390 43 381 55 C328 91 235 80 168 81 C94 94 39 81 14 49Z';
  return (
    <View
      testID="mistake-leaf-note"
      pointerEvents="none"
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={text.replace(/\s+/g, ' ')}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 98, zIndex: 4 }}
    >
      {motion &&
        [0.01, 0.07, 0.88, 0.95].map((position, i) => {
          const start = i * 0.025,
            end = start + 0.36;
          return (
            <Animated.View
              key={i}
              testID="mistake-falling-leaf"
              accessible={false}
              style={{
                position: 'absolute',
                zIndex: 1,
                left: `${position * 100}%`,
                top: 0,
                opacity: interpolate([start, start + 0.04, end - 0.06, end], [0, 0.9, 0.8, 0]),
                transform: [
                  { translateY: interpolate([start, end], [-20, 95]) },
                  {
                    translateX: interpolate(
                      [start, start + 0.12, start + 0.24, end],
                      [0, i % 2 ? -14 : 12, i % 2 ? 8 : -5, 0],
                    ),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [start, end],
                      outputRange: [`${-55 + i * 26}deg`, `${70 - i * 21}deg`],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}
            >
              <Svg width={17 + i * 2} height="30" viewBox="0 0 24 34" accessible={false}>
                <Path
                  d="M11 28 C-1 24 0 10 18 2 C27 18 22 28 11 28Z"
                  fill={['#9caa79', '#c5ad70', '#748d68', '#b6bb82'][i]}
                  stroke="#687b52"
                  strokeWidth=".65"
                />
                <Path
                  d="M8 33 Q13 19 18 3 M12 24 6 17 M14 17 10 11 M14 19 20 15"
                  fill="none"
                  stroke="#566b45"
                  strokeWidth=".65"
                />
              </Svg>
            </Animated.View>
          );
        })}
      <Animated.View
        testID={motion ? 'mistake-leaf-drifting' : 'mistake-leaf-still'}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
          minHeight: 84,
          justifyContent: 'center',
          paddingHorizontal: 34,
          paddingVertical: 15,
          opacity: motion ? interpolate([0, 0.055, 0.88, 1], [0, 1, 1, 0]) : 1,
          transform: motion
            ? [
                { translateY: interpolate([0, 0.15, 0.27, 1], [-27, 4, 0, 7]) },
                { translateX: interpolate([0, 0.13, 0.27, 1], [-6, 3, 0, 0]) },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 0.15, 0.27, 1],
                    outputRange: ['-7deg', '2deg', '-.6deg', '-1.5deg'],
                  }),
                },
              ]
            : [],
        }}
      >
        <SvgBackdrop viewBox="0 0 420 90" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={token} x1="0" y1="0" x2="1" y2="1">
              <Stop stopColor="#eeebcb" />
              <Stop offset=".55" stopColor="#d9dbad" />
              <Stop offset="1" stopColor="#bfca97" />
            </LinearGradient>
          </Defs>
          <Path d={leaf} transform="translate(0 2)" fill="#34472e" opacity=".13" />
          <Path d={leaf} fill={`url(#${token})`} stroke="#9aab79" strokeWidth=".8" />
          <G fill="none" stroke="#788b5d" strokeWidth=".85" opacity=".17">
            <Path d="M17 49 Q186 56 407 30 M72 51 Q68 31 79 19 M112 52 Q112 28 137 13 M165 52 Q173 30 196 20 M223 48 Q235 30 264 19 M290 42 Q307 28 335 18 M71 52 Q85 70 102 77 M127 53 Q145 68 166 77 M184 52 Q202 66 227 76 M245 47 Q263 61 289 71 M302 40 Q324 52 345 59" />
          </G>
          <Path
            d="M4 57 Q17 48 35 49"
            fill="none"
            stroke="#859568"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </SvgBackdrop>
        <T
          testID="mistake-leaf-text"
          style={{
            fontFamily: F.handwritingMedium,
            fontSize: Math.min(22, Math.max(18, width / 17)),
            lineHeight: 24,
            textAlign: 'center',
            color: '#394d36',
          }}
        >
          {text}
        </T>
      </Animated.View>
    </View>
  );
}
