import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

function StarFlower({ filled }: { filled: boolean }) {
  const token = 'star-flower-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg width="64" height="64" viewBox="0 0 80 80" accessible={false}>
      <Defs>
        <LinearGradient id={token} x1="0" y1="0" x2=".8" y2="1">
          <Stop stopColor="#fff0b3" />
          <Stop offset=".45" stopColor="#e0b558" />
          <Stop offset="1" stopColor="#ad8039" />
        </LinearGradient>
      </Defs>
      <G opacity={filled ? 1 : 0.35}>
        <Path
          d="M40 5 Q46 20 51 28 Q65 26 75 29 Q65 40 60 46 Q64 61 63 73 Q49 65 40 59 Q28 68 16 73 Q18 57 20 46 Q9 38 5 29 Q20 29 29 28Z"
          fill={filled ? `url(#${token})` : '#e6dcc0'}
          stroke={filled ? '#9e7c3c' : '#9a8b69'}
          strokeWidth=".85"
        />
        {Array.from({ length: 5 }, (_, i) => (
          <G key={i} transform={`translate(40 40) rotate(${i * 72})`}>
            <Path
              d="M0 4 C-9-2-9-18 0-32 C9-18 9-2 0 4Z"
              fill={filled ? '#fae4a2' : 'none'}
              fillOpacity=".35"
              stroke={filled ? '#ab8540' : '#9a8b69'}
              strokeWidth=".6"
            />
            <Path
              d="M0 2 V-28 M0-9-4-15 M0-15 4-21"
              fill="none"
              stroke={filled ? '#94723d' : '#9a8b69'}
              strokeWidth=".65"
            />
          </G>
        ))}
        <Circle
          cx="40"
          cy="40"
          r="5.5"
          fill={filled ? '#fff1bd' : '#e6dcc0'}
          stroke={filled ? '#a78b46' : '#9a8b69'}
          strokeWidth=".8"
        />
        <Circle cx="40" cy="40" r="1.6" fill={filled ? '#7e8d59' : '#9a8b69'} />
        <Path
          d="M24 72 Q40 78 57 71 M34 75 Q28 73 29 69 M45 75 Q52 72 51 68"
          fill="none"
          stroke={filled ? '#7b9361' : '#9a8b69'}
          strokeWidth=".8"
        />
      </G>
    </Svg>
  );
}

/** Finite, staggered blooms: no replay on colour reveal or ordinary rerenders. */
export function RewardStars({ count, motion }: { count: 1 | 2 | 3; motion: boolean }) {
  const values = useRef([0, 1, 2].map(() => new Animated.Value(motion ? 0 : 1))).current;
  const [settled, setSettled] = useState(!motion);
  useEffect(() => {
    if (!motion) {
      values.forEach((value) => value.setValue(1));
      setSettled(true);
      return;
    }
    setSettled(false);
    values.forEach((value) => value.setValue(0));
    const animation = Animated.sequence([
      Animated.delay(220),
      Animated.stagger(
        360,
        values.slice(0, count).map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 850,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ),
    ]);
    animation.start(({ finished }) => {
      if (finished) setSettled(true);
    });
    return () => animation.stop();
  }, [count, motion, values]);
  return (
    <View
      testID="page-earned-stars"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${count} ${count === 1 ? 'étoile obtenue' : 'étoiles obtenues'} sur 3`}
      accessibilityLiveRegion="polite"
      style={{ marginTop: 6, width: '100%' }}
    >
      <View
        testID={settled ? 'reward-stars-settled' : 'reward-stars-animating'}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, minHeight: 84 }}
      >
        {values.map((value, i) => (
          <View
            key={i}
            testID={i < count ? 'botanical-star-earned' : 'botanical-star-empty'}
            style={{ width: 66, height: 78, marginTop: i === 1 ? 0 : 6 }}
          >
            <View style={{ position: 'absolute', top: 8, left: 1 }}>
              <StarFlower filled={false} />
            </View>
            {i < count && (
              <>
                {motion && (
                  <Animated.View
                    pointerEvents="none"
                    testID="reward-star-sparks"
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: -3,
                      opacity: value.interpolate({
                        inputRange: [0, 0.16, 0.55, 1],
                        outputRange: [0, 0.9, 0.4, 0],
                      }),
                      transform: [
                        {
                          scale: value.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.45, 1.25],
                          }),
                        },
                      ],
                    }}
                  >
                    <Svg width="72" height="72" viewBox="0 0 80 80" accessible={false}>
                      <Circle
                        cx="40"
                        cy="40"
                        r="28"
                        fill="none"
                        stroke="#bd9b50"
                        strokeWidth="1"
                        strokeDasharray="1 8"
                      />
                      {[0, 72, 144, 216, 288].map((angle) => (
                        <G key={angle} transform={`rotate(${angle} 40 40)`}>
                          <Path
                            d="M40 4 41.5 8 45 9 41.5 10 40 14 38.5 10 35 9 38.5 8Z"
                            fill="#c6a155"
                          />
                        </G>
                      ))}
                    </Svg>
                  </Animated.View>
                )}
                <Animated.View
                  testID="reward-star-bloom"
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 1,
                    opacity: motion
                      ? value.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 1, 1] })
                      : 1,
                    transform: motion
                      ? [
                          {
                            scale: value.interpolate({
                              inputRange: [0, 0.45, 0.7, 1],
                              outputRange: [0.2, 1.2, 0.96, 1],
                            }),
                          },
                          {
                            translateY: value.interpolate({
                              inputRange: [0, 0.45, 1],
                              outputRange: [18, -5, 0],
                            }),
                          },
                          {
                            rotate: value.interpolate({
                              inputRange: [0, 0.45, 1],
                              outputRange: ['-24deg', '7deg', '0deg'],
                            }),
                          },
                        ]
                      : [],
                  }}
                >
                  <StarFlower filled />
                </Animated.View>
              </>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
