import React, { createContext, memo, useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Path,
  G,
  Image as SvgImage,
} from 'react-native-svg';
import { Botanical } from './Botanical';
import { T, C } from './ui';
import { F } from './fonts';

export const PageTurnContext = createContext<(page: number, commit: () => void) => void>(
  (_page, commit) => commit(),
);
export type TurningPage = { id: number; from: number; to: number; plant: number; stage: number };

const PrintedPage = memo(function PrintedPage({
  width,
  height,
  page,
}: {
  width: number;
  height: number;
  page: TurningPage;
}) {
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center', gap: 15 }}>
      <T style={{ fontFamily: F.scientific, fontSize: 18, color: '#87734d' }}>
        Le carnet des merveilles vivantes
      </T>
      <T serif style={{ fontSize: Math.min(41, width / 10), color: C.green }}>
        Herbier des couleurs
      </T>
      <View style={{ opacity: 0.52, transform: [{ rotate: '-5deg' }], marginVertical: 12 }}>
        <Botanical
          index={page.plant}
          stage={page.stage}
          size={Math.min(width * 0.68, height * 0.42, 360)}
        />
      </View>
      <T style={{ fontFamily: F.scientific, fontSize: 19, color: '#87734d' }}>
        {page.from ? `Page ${String(page.from).padStart(2, '0')}` : 'Le livre s’éveille…'}
      </T>
    </View>
  );
});

/** Cover the old scene first, commit once under the paper, then curl it away. */
export function PageTurn({
  page,
  onCovered,
  onFinished,
}: {
  page: TurningPage;
  onCovered: () => void;
  onFinished: () => void;
}) {
  const { width: w, height: h } = useWindowDimensions();
  const value = useRef(new Animated.Value(0)).current;
  const callbacks = useRef({ onCovered, onFinished });
  callbacks.current = { onCovered, onFinished };
  const [progress, setProgress] = useState(0);
  const id = 'turn-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => {
    let covered = false;
    const listener = value.addListener(({ value: next }) => {
      if (!covered && next >= 0.32) {
        covered = true;
        callbacks.current.onCovered();
      }
      setProgress(next);
    });
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) {
        if (!covered) callbacks.current.onCovered();
        callbacks.current.onFinished();
      }
    });
    return () => {
      animation.stop();
      value.removeListener(listener);
    };
  }, [value, page.id]);
  const raw = Math.max(0, Math.min(1, (progress - 0.38) / 0.62));
  const q = raw * raw * (3 - 2 * raw);
  const curl = Math.sin(q * Math.PI) * Math.min(w * 0.28, 200);
  const x = w + 4 - q * (w + 20);
  const top = x + curl * 0.25,
    bottom = x - curl * 0.4;
  const face = `M0 0 H${top} C${x + curl * 0.12} ${h * 0.32} ${x - curl * 0.7} ${h * 0.68} ${bottom} ${h} H0Z`;
  const fold = `M${top} 0 C${x + curl * 0.12} ${h * 0.32} ${x - curl * 0.7} ${h * 0.68} ${bottom} ${h} Q${x + curl * 0.72} ${h * 0.55} ${top + curl * 0.85} ${h * 0.04} Q${top + curl * 0.3} ${h * 0.03} ${top} 0Z`;
  return (
    <View
      testID="book-page-turn"
      accessibilityViewIsModal
      accessibilityLabel={`Ouverture de la page ${page.to}`}
      accessibilityRole="progressbar"
      style={[StyleSheet.absoluteFill, { zIndex: 50, overflow: 'hidden' }]}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: Math.min(1, progress / 0.25) }]}
      >
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} accessible={false}>
          <Defs>
            <ClipPath id={`${id}-face`}>
              <Path d={face} />
            </ClipPath>
            <LinearGradient id={`${id}-shadow`} x1="0" x2="1">
              <Stop stopColor="#302b1c" stopOpacity=".3" />
              <Stop offset="1" stopColor="#302b1c" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M${top} 0 L${top + curl + 28} 0 Q${x + curl} ${h * 0.55} ${bottom + 32} ${h} H${bottom}Z`}
            fill={`url(#${id}-shadow)`}
            opacity={Math.sin(q * Math.PI)}
          />
          <G clipPath={`url(#${id}-face)`}>
            <Path d={face} fill="#ecddba" />
            <SvgImage
              href={require('../../assets/illustrations/papier.png')}
              x="0"
              y="0"
              width={w}
              height={h}
              preserveAspectRatio="xMidYMid slice"
              opacity=".8"
            />
            <Path
              d={`M${w * 0.08} 0 V${h} M${w * 0.09} 0 V${h}`}
              stroke="#aa8e58"
              strokeWidth=".6"
              opacity=".3"
            />
          </G>
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: Math.max(0, Math.min(w, x - curl * 0.7)),
            overflow: 'hidden',
          }}
        >
          <View style={{ transform: [{ translateX: -q * w * 0.06 }] }}>
            <PrintedPage width={w} height={h} page={page} />
          </View>
        </View>
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} accessible={false}>
          <Defs>
            <LinearGradient id={`${id}-fold`} x1="0" x2="1">
              <Stop stopColor="#a88d5b" />
              <Stop offset=".22" stopColor="#dec698" />
              <Stop offset=".65" stopColor="#fff1cd" />
              <Stop offset="1" stopColor="#bea16c" />
            </LinearGradient>
            <ClipPath id={`${id}-reverse`}>
              <Path d={fold} />
            </ClipPath>
          </Defs>
          <Path
            testID="book-page-curl"
            d={fold}
            fill={`url(#${id}-fold)`}
            stroke="#a68b59"
            strokeWidth=".4"
            opacity={raw > 0 ? 1 : 0}
          />
          <G clipPath={`url(#${id}-reverse)`} opacity={raw > 0 ? 0.16 : 0}>
            <SvgImage
              href={require('../../assets/illustrations/papier.png')}
              x="0"
              y="0"
              width={w}
              height={h}
              preserveAspectRatio="xMidYMid slice"
            />
          </G>
        </Svg>
      </View>
    </View>
  );
}
