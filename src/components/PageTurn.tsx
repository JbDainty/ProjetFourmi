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
import { Paper } from './Paper';
import { T, C } from './ui';
import { F } from './fonts';
import { species } from '../data/botany';
import { singleTurnDuration, speciesTurnDuration, type TurningPage } from '../animation/book';
export type { TurningPage } from '../animation/book';

export const PageTurnContext = createContext<(page: number, commit: () => void) => void>(
  (_page, commit) => commit(),
);
const clamp = (value: number) => Math.max(0, Math.min(1, value));

const PrintedPage = memo(function PrintedPage({
  width,
  height,
  plant,
  stage,
  folio,
  destination = false,
}: {
  width: number;
  height: number;
  plant: number;
  stage: number;
  folio: number;
  destination?: boolean;
}) {
  const specimen = species[plant];
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <T
        style={{
          fontFamily: F.scientific,
          fontSize: 18,
          color: '#87734d',
          textAlign: 'center',
          paddingHorizontal: 20,
        }}
      >
        {destination
          ? stage === 0
            ? 'Une nouvelle espèce s’éveille…'
            : 'Une planche à retrouver…'
          : 'Le carnet des merveilles vivantes'}
      </T>
      <T serif style={{ fontSize: Math.min(41, width / 10), color: C.green }}>
        Herbier des couleurs
      </T>
      <T
        testID={destination ? 'book-destination-species' : 'book-source-species'}
        serif
        style={{
          fontSize: Math.min(34, width / 10.5),
          color: C.green,
          textAlign: 'center',
          paddingHorizontal: 20,
        }}
      >
        {specimen.name}
      </T>
      <T style={{ fontFamily: F.scientific, fontSize: 17, color: '#87734d', textAlign: 'center' }}>
        {specimen.latin}
      </T>
      <View
        testID={destination ? 'book-destination-plate' : 'book-source-plate'}
        style={{
          opacity: destination ? 0.85 : 0.52,
          transform: [{ rotate: '-4deg' }],
          marginVertical: 8,
        }}
      >
        <Botanical index={plant} stage={stage} size={Math.min(width * 0.68, height * 0.38, 360)} />
      </View>
      <T style={{ fontFamily: F.scientific, fontSize: 19, color: '#87734d' }}>
        {folio ? `Page ${String(folio).padStart(2, '0')}` : 'Le livre s’éveille…'}
      </T>
    </View>
  );
});

function TurningSheet({
  width: w,
  height: h,
  progress,
  children,
  neutral = false,
}: {
  width: number;
  height: number;
  progress: number;
  children?: React.ReactNode;
  neutral?: boolean;
}) {
  const id = 'turn-sheet-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const raw = clamp(progress);
  const q = raw * raw * (3 - 2 * raw);
  const curl = Math.sin(q * Math.PI) * Math.min(w * 0.28, 200);
  const x = w + 4 - q * (w + 20);
  const top = x + curl * 0.25,
    bottom = x - curl * 0.4;
  const face = `M0 0 H${top} C${x + curl * 0.12} ${h * 0.32} ${x - curl * 0.7} ${h * 0.68} ${bottom} ${h} H0Z`;
  const fold = `M${top} 0 C${x + curl * 0.12} ${h * 0.32} ${x - curl * 0.7} ${h * 0.68} ${bottom} ${h} Q${x + curl * 0.72} ${h * 0.55} ${top + curl * 0.85} ${h * 0.04} Q${top + curl * 0.3} ${h * 0.03} ${top} 0Z`;
  return (
    <View
      testID="book-turning-sheet"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity: progress >= 1 ? 0 : 1 }]}
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
        {neutral && (
          <G
            clipPath={`url(#${id}-face)`}
            transform={`translate(${w * 0.45} ${h * 0.35}) scale(${Math.min(w / 350, 1.8)})`}
            fill="none"
            stroke="#6f805a"
            strokeWidth=".7"
            opacity=".14"
          >
            <Path d="M0 140 C40 90-25 45 10-40 M13 94 C-36 86-38 46-24 34 Q8 42 13 94 M9 70 C48 62 56 24 40 9 Q10 15 9 70 M4 22 C-32 10-33-18-21-30 Q5-22 4 22 M5-8 Q40-26 30-50 Q6-46 5-8" />
          </G>
        )}
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
        <View style={{ transform: [{ translateX: -q * w * 0.06 }] }}>{children}</View>
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
  );
}

/** One covered commit; a new species is revealed beneath five quick interleaves. */
export function PageTurn({
  page,
  onCovered,
  onFinished,
}: {
  page: TurningPage;
  onCovered: () => void;
  onFinished: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const value = useRef(new Animated.Value(0)).current;
  const callbacks = useRef({ onCovered, onFinished });
  callbacks.current = { onCovered, onFinished };
  const [progress, setProgress] = useState(0);
  const multiple = page.kind === 'species';
  useEffect(() => {
    let covered = false;
    const listener = value.addListener(({ value: next }) => {
      if (!covered && next >= (multiple ? 0.2 : 0.32)) {
        covered = true;
        callbacks.current.onCovered();
      }
      setProgress(next);
    });
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: multiple ? speciesTurnDuration : singleTurnDuration,
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
  }, [value, page.id, multiple]);
  const source = (
    <PrintedPage
      width={width}
      height={height}
      plant={page.plant}
      stage={page.stage}
      folio={page.from}
    />
  );
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
        testID={multiple ? 'book-species-riffle' : 'book-single-turn'}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: multiple
              ? clamp(progress / 0.14) * clamp((1 - progress) / 0.12)
              : clamp(progress / 0.25),
          },
        ]}
      >
        {multiple ? (
          <>
            <Paper frame={false} style={[StyleSheet.absoluteFill, { backgroundColor: '#ecddba' }]}>
              <PrintedPage
                width={width}
                height={height}
                plant={page.targetPlant}
                stage={page.targetStage}
                folio={page.to}
                destination
              />
            </Paper>
            {[4, 3, 2, 1, 0].map((i) => (
              <TurningSheet
                key={i}
                width={width}
                height={height}
                progress={clamp((progress - (0.15 + i * 0.075)) / 0.24)}
                neutral={i !== 0}
              >
                {i === 0 ? source : undefined}
              </TurningSheet>
            ))}
          </>
        ) : (
          <TurningSheet width={width} height={height} progress={clamp((progress - 0.38) / 0.62)}>
            {source}
          </TurningSheet>
        )}
      </View>
    </View>
  );
}
