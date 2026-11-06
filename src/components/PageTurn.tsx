import React, { createContext, memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { Paper } from './Paper';
import { PrintedPage } from './PrintedBookPage';
import { nativeSequence } from '../animation/nativeSequence';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import { singleTurnDuration, speciesTurnDuration, type TurningPage } from '../animation/book';
export type { TurningPage } from '../animation/book';

export const PageTurnContext = createContext<(page: number, commit: () => void) => void>(
  (_page, commit) => commit(),
);
const native = Platform.OS !== 'web';
const ease = (p: number) => p * p * (3 - 2 * p);

const SheetArt = memo(function SheetArt({
  width,
  height,
  children,
  neutral,
}: {
  width: number;
  height: number;
  children?: React.ReactNode;
  neutral: boolean;
}) {
  return (
    <View style={{ width, height, backgroundColor: '#ecddba', overflow: 'hidden' }}>
      <Image
        source={require('../../assets/illustrations/papier.png')}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { width, height, opacity: 0.8 }]}
      />
      <View
        style={{
          position: 'absolute',
          left: width * 0.08,
          top: 0,
          bottom: 0,
          borderLeftWidth: 0.6,
          borderRightWidth: 0.6,
          borderColor: '#aa8e584d',
          width: width * 0.012,
        }}
      />
      {neutral && (
        <View style={{ position: 'absolute', left: width * 0.27, top: height * 0.32 }}>
          <Svg
            width={width * 0.46}
            height={height * 0.38}
            viewBox="-80 -70 180 240"
            accessible={false}
          >
            <Path
              d="M0 140 C40 90-25 45 10-40 M13 94 C-36 86-38 46-24 34 Q8 42 13 94 M9 70 C48 62 56 24 40 9 Q10 15 9 70 M4 22 C-32 10-33-18-21-30 Q5-22 4 22 M5-8 Q40-26 30-50 Q6-46 5-8"
              fill="none"
              stroke="#6f805a"
              strokeWidth="0.7"
              opacity="0.18"
            />
          </Svg>
        </View>
      )}
      {children}
      <View
        testID="book-page-curl"
        pointerEvents="none"
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 22 }}
      >
        <Svg width={22} height={height} accessible={false}>
          <Defs>
            <LinearGradient id="paper-rim" x1="0" x2="1">
              <Stop stopColor="#f4e6c2" stopOpacity="0" />
              <Stop offset="0.72" stopColor="#fff3d5" stopOpacity="0.65" />
              <Stop offset="1" stopColor="#9a8054" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          <Rect width={22} height={height} fill="url(#paper-rim)" />
        </Svg>
      </View>
    </View>
  );
});

const TurningSheet = memo(function TurningSheet({
  width,
  height,
  clock,
  start,
  end,
  children,
  neutral,
}: {
  width: number;
  height: number;
  clock: Animated.Value;
  start: number;
  end: number;
  children?: React.ReactNode;
  neutral: boolean;
}) {
  const timing = useMemo(
    () => Array.from({ length: 13 }, (_, i) => start + ((end - start) * i) / 12),
    [start, end],
  );
  const angles = useMemo(() => timing.map((_, i) => `${-90 * ease(i / 12)}deg`), [timing]);
  const edge = useMemo(
    () =>
      timing.map((_, i) => {
        const angle = (ease(i / 12) * Math.PI * 90) / 180;
        return (
          (width * Math.cos(angle)) / (1 - (width * Math.sin(angle)) / Math.max(900, width * 3.4))
        );
      }),
    [timing, width],
  );
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 50,
          height,
          opacity: clock.interpolate({
            inputRange: [start, (start + end) / 2, end],
            outputRange: [0, 0.16, 0],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              translateX: clock.interpolate({
                inputRange: timing,
                outputRange: edge,
                extrapolate: 'clamp',
              }),
            },
          ],
        }}
      >
        <Svg width={50} height={height} accessible={false}>
          <Defs>
            <LinearGradient id="leaf-shadow">
              <Stop stopColor="#302b1c" />
              <Stop offset="1" stopColor="#302b1c" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width={50} height={height} fill="url(#leaf-shadow)" />
        </Svg>
      </Animated.View>
      <Animated.View
        testID="book-turning-sheet"
        pointerEvents="none"
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{
          position: 'absolute',
          width,
          height,
          top: 0,
          left: 0,
          backfaceVisibility: 'hidden',
          opacity: clock.interpolate({
            inputRange: [start, end - (end - start) * 0.04, end],
            outputRange: [1, 1, 0],
            extrapolate: 'clamp',
          }),
          transform: [
            { perspective: Math.max(900, width * 3.4) },
            { translateX: -width / 2 },
            {
              rotateY: clock.interpolate({
                inputRange: timing,
                outputRange: angles,
                extrapolate: 'clamp',
              }),
            },
            { translateX: width / 2 },
          ],
        }}
      >
        <SheetArt width={width} height={height} neutral={neutral}>
          {children}
        </SheetArt>
      </Animated.View>
    </>
  );
});

/** Cached paper textures move on the UI thread. React never redraws the five leaves per frame. */
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
  usePrimaryAnimation(true);
  const cover = useRef(new Animated.Value(0)).current;
  const clock = useRef(new Animated.Value(0)).current;
  const callbacks = useRef({ onCovered, onFinished });
  callbacks.current = { onCovered, onFinished };
  const multiple = page.kind === 'species';
  useEffect(() => {
    const stage = (value: Animated.Value, duration: number, complete?: () => void) => ({
      duration,
      complete,
      play(remaining: number, done: () => void) {
        const animation = Animated.timing(value, {
          toValue: 1,
          duration: remaining,
          easing: Easing.linear,
          useNativeDriver: native,
        });
        animation.start(({ finished }) => {
          if (finished) done();
        });
        return {
          stop(read: (progress: number) => void) {
            animation.stop();
            value.stopAnimation(read);
          },
        };
      },
    });
    const sequence = nativeSequence(
      [
        stage(cover, 220, () => callbacks.current.onCovered()),
        stage(clock, (multiple ? speciesTurnDuration : singleTurnDuration) - 220),
      ],
      () => callbacks.current.onFinished(),
    );
    sequence.setActive(
      AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
    );
    const sub = AppState.addEventListener('change', (state) =>
      sequence.setActive(state === 'active'),
    );
    return () => {
      sub.remove();
      sequence.dispose();
    };
  }, [page.id, multiple, cover, clock]);
  const source = useMemo(
    () => (
      <PrintedPage
        width={width}
        height={height}
        plant={page.plant}
        stage={page.stage}
        folio={page.from}
      />
    ),
    [width, height, page],
  );
  return (
    <View
      testID="book-page-turn"
      accessibilityViewIsModal
      accessibilityLabel={`Ouverture de la page ${page.to}`}
      accessibilityRole="progressbar"
      style={[StyleSheet.absoluteFill, { zIndex: 50, overflow: 'hidden' }]}
    >
      <Animated.View
        pointerEvents="none"
        testID={multiple ? 'book-species-riffle' : 'book-single-turn'}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: Animated.multiply(
              cover,
              clock.interpolate({ inputRange: [0, 0.91, 1], outputRange: [1, 1, 0] }),
            ),
          },
        ]}
      >
        {multiple && (
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
        )}
        {(multiple ? [4, 3, 2, 1, 0] : [0]).map((i) => (
          <TurningSheet
            key={i}
            width={width}
            height={height}
            clock={clock}
            start={multiple ? 0.04 + i * 0.105 : 0.08}
            end={multiple ? 0.42 + i * 0.105 : 1}
            neutral={i !== 0}
          >
            {i === 0 ? source : undefined}
          </TurningSheet>
        ))}
      </Animated.View>
    </View>
  );
}
