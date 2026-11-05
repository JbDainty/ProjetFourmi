import { listenVector } from './vectorFrames';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, G, Path, Circle } from 'react-native-svg';
import { Paper } from './Paper';
import { ui } from './ui';
import { playLeafWind } from '../services/leafWind';

export function VictoryPaper({
  children,
  motion,
  sound,
}: {
  children: React.ReactNode;
  motion: boolean;
  sound: boolean;
}) {
  const value = useRef(new Animated.Value(motion ? 0 : 1)).current;
  const [progress, setProgress] = useState(motion ? 0 : 1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const token = 'victory-leaves-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => {
    const listener = listenVector(value, setProgress);
    if (!motion) value.setValue(1);
    else
      Animated.timing(value, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    return () => {
      value.stopAnimation();
      value.removeListener(listener);
    };
  }, [motion, value]);
  useEffect(() => playLeafWind(sound), [sound]);
  const { width: w, height: h } = size;
  const stemLength = Math.max(1, h + w - 60);
  const leftStem = `M${w / 2} ${h - 12} C${w * 0.32} ${h - 5} ${w * 0.22} ${h - 19} 42 ${h - 12} Q9 ${h - 10} 12 ${h - 42} C19 ${h * 0.72} 7 ${h * 0.65} 13 ${h * 0.48} S8 ${h * 0.23} 14 43 Q9 11 42 12 C${w * 0.22} 21 ${w * 0.32} 5 ${w / 2} 12`;
  const count = Math.max(2, Math.floor((h - 88) / 43));
  const reveal = (start: number) => Math.max(0, Math.min(1, (progress - start) / 0.18));
  return (
    <Paper
      testID="victory-living-paper"
      frame={false}
      style={[ui.card, { width: '100%', alignItems: 'center' }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((previous) =>
          previous.width === width && previous.height === height ? previous : { width, height },
        );
      }}
    >
      {children}
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        testID={progress < 1 ? 'victory-vines-growing' : 'victory-vines-settled'}
        style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
      >
        {w > 0 && h > 0 && (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} accessible={false}>
            <Defs>
              <LinearGradient id={token} x1="0" y1="0" x2="1" y2="1">
                <Stop stopColor="#d0d7aa" />
                <Stop offset=".45" stopColor="#a0b581" />
                <Stop offset="1" stopColor="#718b60" />
              </LinearGradient>
            </Defs>
            {[false, true].map((mirror) => (
              <G
                key={String(mirror)}
                transform={mirror ? `translate(${w} 0) scale(-1 1)` : undefined}
              >
                <Path
                  testID="victory-vine-stem"
                  d={leftStem}
                  fill="none"
                  stroke="#658153"
                  strokeWidth=".95"
                  strokeLinecap="round"
                  strokeDasharray={`${stemLength} ${stemLength}`}
                  strokeDashoffset={stemLength * (1 - progress)}
                />
                {Array.from({ length: count }, (_, i) => {
                  const growth = reveal(0.08 + (i / (count - 1)) * 0.64);
                  const y = h - 52 - (i / (count - 1)) * (h - 104);
                  return (
                    <G
                      key={i}
                      transform={`translate(${12 + Math.sin(i * 1.7) * 1.5} ${y}) rotate(${35 + (i % 3) * 7 + (1 - progress) * Math.sin(progress * 12 + i) * 4}) scale(${growth * 0.8})`}
                    >
                      <Path
                        d="M0 0 C-7-2-9-10-3-20 C4-17 9-5 0 0Z"
                        fill={`url(#${token})`}
                        stroke="#6a8054"
                        strokeWidth=".6"
                      />
                      <Path
                        d="M0 0-3-18 M-1-7-6-11 M-2-12 2-15 M0 0 Q8 3 11-4 Q4-8 0 0"
                        fill="none"
                        stroke="#667f50"
                        strokeWidth=".55"
                      />
                    </G>
                  );
                })}
                <Path
                  d={`M15 ${h - 43} Q30 ${h - 60} 23 ${h - 70} Q10 ${h - 71} 18 ${h - 60} M15 46 Q32 35 24 25 Q16 20 16 29 Q19 36 24 30`}
                  fill="none"
                  stroke="#88925f"
                  strokeWidth=".7"
                  opacity={reveal(0.55)}
                />
                {[0.2, 0.36].map((x, i) => (
                  <G
                    key={i}
                    transform={`translate(${w * x} 13) rotate(${i ? 20 : -28}) scale(${reveal(0.78 + i * 0.03) * 0.65})`}
                  >
                    <Path
                      d="M0 0 C-6-2-9-12-3-18 Q9-10 0 0Z"
                      fill={`url(#${token})`}
                      stroke="#6a8054"
                      strokeWidth=".6"
                    />
                    <Path d="M0 0-3-16" stroke="#6a8054" strokeWidth=".5" />
                  </G>
                ))}
                <Circle cx="24" cy="24" r="1.7" fill="#b69b5c" opacity={reveal(0.8)} />
              </G>
            ))}
          </Svg>
        )}
      </View>
    </Paper>
  );
}
