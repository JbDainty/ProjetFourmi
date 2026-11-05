import { listenVector } from './vectorFrames';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, G, Ellipse } from 'react-native-svg';

function AntiqueBook({ progress, state }: { progress: number; state: string }) {
  const id = 'book-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const hinge = 17 + progress * 19;
  const projection = Math.cos(progress * Math.PI);
  const edge = hinge + (38 - progress * 8) * projection;
  const outerTop = 7 + progress * 11;
  const outerBottom = 60 + progress * 5;
  const inside = progress > 0.5;
  return (
    <Svg
      testID={`herbarium-book-${state}`}
      width="62"
      height="66"
      viewBox="0 0 76 76"
      accessible={false}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={`${id}-leather`} x1="0" x2="1">
          <Stop stopColor="#263e32" />
          <Stop offset="0.35" stopColor="#526447" />
          <Stop offset="1" stopColor="#344b38" />
        </LinearGradient>
        <LinearGradient id={`${id}-paper`} x1="0" x2="1">
          <Stop stopColor="#d8c39a" />
          <Stop offset="0.18" stopColor="#f5e8c8" />
          <Stop offset="0.8" stopColor="#ebd8ad" />
          <Stop offset="1" stopColor="#c5ac7b" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="38" cy="69" rx={22 + progress * 9} ry="3" fill="#413321" opacity="0.14" />
      <Path
        d={`M${hinge - 3} 11 L${hinge + 38 - progress * 8} ${15 + progress * 4} L${hinge + 38 - progress * 8} 67 L${hinge - 2} 66Z`}
        fill="#6a5034"
        stroke="#493c29"
        strokeWidth="0.7"
      />
      <Path
        d={`M${hinge} 14 L${hinge + 35 - progress * 6} ${17 + progress * 4} V64 L${hinge} 63Z`}
        fill={`url(#${id}-paper)`}
      />
      <G opacity={progress}>
        <Path
          d={`M${hinge} 16 Q${hinge + 13} 12 ${hinge + 29} 21 V63 Q${hinge + 13} 57 ${hinge} 63Z`}
          fill="#f4e6c6"
          stroke="#b9a078"
          strokeWidth="0.6"
        />
        <G
          transform={`translate(${hinge + 12} 0)`}
          fill="none"
          stroke="#7f8b5e"
          strokeWidth="0.8"
          strokeLinecap="round"
        >
          <Path d="M0 53 Q5 40 1 30 M2 42 Q-9 37-7 31 Q1 32 2 42 M3 38 Q11 35 12 28 Q5 28 3 38 M1 31 Q-5 24 1 21 Q8 25 1 31" />
          <Path d="M-5 56 10 57 M-3 59 8 60" stroke="#b49a6b" />
        </G>
      </G>
      <Path d={`M${hinge} 13 V64`} stroke="#816a41" strokeWidth="3" />
      <G transform={`matrix(${projection} 0 0 1 ${hinge} 0)`}>
        <Path
          id="antique-book-cover"
          d={`M0 12 L${38 - progress * 8} ${outerTop} L${38 - progress * 8} ${outerBottom} L0 65Z`}
          fill={inside ? `url(#${id}-paper)` : `url(#${id}-leather)`}
          stroke="#725b36"
          strokeWidth="1"
        />
        <Path
          d={`M4 17 L${33 - progress * 8} ${outerTop + 5} V${outerBottom - 5} L4 59Z`}
          fill="none"
          stroke={inside ? '#b7a17b' : '#baa26b'}
          strokeWidth="0.8"
        />
        <G
          fill="none"
          stroke={inside ? '#6b7e51' : '#c1ab70'}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M15 52 Q22 40 16 26 M18 42 Q7 37 9 31 Q16 32 18 42 M19 37 Q29 34 28 26 Q20 28 19 37 M17 29 Q10 23 16 20 Q23 23 17 29" />
          <Path d="M9 17 12 16 M26 53 29 52 M9 54 12 55" opacity="0.65" />
        </G>
        {!inside && <Path d="M2 22 2 27 M2 44 2 49" stroke="#c8b27c" strokeWidth="2.5" />}
      </G>
      <Path d={`M${hinge - 2} 14 V62`} stroke="#a68c56" strokeWidth="0.8" opacity="0.7" />
      {!inside && (
        <Path
          d={`M${edge + 1} ${outerTop + 5} V${outerBottom - 1}`}
          stroke="#d4bd8e"
          strokeWidth="1"
        />
      )}
    </Svg>
  );
}

export function HerbariumBookButton({
  open,
  motion,
  onOpen,
}: {
  open: boolean;
  motion: boolean;
  onOpen: () => void;
}) {
  const value = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    const listener = listenVector(value, setProgress);
    return () => {
      value.stopAnimation();
      value.removeListener(listener);
    };
  }, [value]);
  useEffect(() => {
    if (open) value.setValue(1);
    else
      Animated.timing(value, {
        toValue: 0,
        duration: motion ? 220 : 0,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [open, motion, value]);
  const activate = () => {
    if (open || opening) return;
    if (!motion) {
      value.setValue(1);
      onOpen();
      return;
    }
    setOpening(true);
    Animated.timing(value, {
      toValue: 1,
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      setOpening(false);
      if (finished) onOpen();
    });
  };
  return (
    <Pressable
      testID="herbarium-book-button"
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le carnet"
      accessibilityHint="Ouvrir le vieux livre pour retrouver votre herbier et les réglages"
      accessibilityState={{ expanded: open, busy: opening }}
      disabled={open || opening}
      onPress={activate}
      style={({ pressed }) => ({
        width: 62,
        height: 66,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <AntiqueBook progress={progress} state={opening ? 'opening' : open ? 'open' : 'closed'} />
    </Pressable>
  );
}
