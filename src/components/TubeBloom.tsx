import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '../data/botany';
import { colorMix } from '../animation/liquid';

/** A finite garland grows around a newly unified vial; it never takes input. */
export function TubeBloom({
  motion,
  color,
  onDone,
}: {
  motion: boolean;
  color: number;
  onDone: () => void;
}) {
  const value = useRef(new Animated.Value(motion ? 0 : 1)).current;
  const [progress, setProgress] = useState(motion ? 0 : 1);
  const done = useRef(onDone);
  done.current = onDone;
  const token = 'tube-bloom-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => {
    if (!motion) {
      const timeout = setTimeout(() => done.current(), 1300);
      return () => clearTimeout(timeout);
    }
    const listener = value.addListener(({ value: p }) => setProgress(p));
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 1750,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) done.current();
    });
    return () => {
      animation.stop();
      value.removeListener(listener);
    };
  }, [motion, value]);
  const bloom = motion ? Math.min(1, progress / 0.45) : 1;
  const fade = motion ? Math.min(1, progress / 0.08, (1 - progress) / 0.25) : 0.8;
  const gold = colorMix(palette[color], '#e8ca76', 0.62);
  return (
    <G
      testID={motion ? 'completed-vial-bloom' : 'completed-vial-seal'}
      pointerEvents="none"
      opacity={fade}
    >
      <Defs>
        <RadialGradient id={token}>
          <Stop stopColor={gold} stopOpacity=".3" />
          <Stop offset="1" stopColor={gold} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="0" cy="80" rx={29 + bloom * 8} ry="88" fill={`url(#${token})`} />
      <Path
        testID="vial-bloom-stem"
        d="M-28 152 C-36 116-28 104-31 77 S-34 30-23 9 M28 152 C35 120 27 102 31 76 S32 33 23 9"
        fill="none"
        stroke="#90a775"
        strokeWidth="1.1"
        strokeDasharray="300 300"
        strokeDashoffset={300 * (1 - bloom)}
      />
      {[false, true].map((mirror) => (
        <G key={String(mirror)} transform={mirror ? 'scale(-1 1)' : undefined}>
          {[0, 1, 2, 3].map((i) => (
            <G
              key={i}
              transform={`translate(-30 ${131 - i * 31}) rotate(${i % 2 ? -40 : 23}) scale(${Math.max(0, Math.min(1, (bloom - i * 0.13) * 2)) * 0.55})`}
            >
              <Path
                d="M0 0 C-12-4-13-17-3-23 Q10-11 0 0Z"
                fill="#b8c493"
                stroke="#809467"
                strokeWidth=".9"
              />
              <Path d="M0 0-3-20" fill="none" stroke="#6f8659" strokeWidth=".7" />
            </G>
          ))}
        </G>
      ))}
      <G transform={`translate(0 -7) scale(${bloom})`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Path
            key={i}
            transform={`rotate(${i * 72})`}
            d="M0 2 C-6-1-7-10 0-14 C7-10 6-1 0 2Z"
            fill={gold}
            stroke="#b39b59"
            strokeWidth=".7"
          />
        ))}
        <Circle r="2.7" fill="#fff4c4" stroke="#a0a16b" strokeWidth=".65" />
      </G>
      {motion &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <G
            key={i}
            transform={`translate(${Math.sin(i * 2.3 + progress * 3) * (25 + progress * 8)} ${130 - progress * (108 + i * 10)})`}
            opacity={Math.max(0, Math.sin(progress * Math.PI))}
          >
            <Path d="M0-3 1-1 3 0 1 1 0 3-1 1-3 0-1-1Z" fill={i % 2 ? '#ecce80' : '#e4ebbb'} />
          </G>
        ))}
    </G>
  );
}
