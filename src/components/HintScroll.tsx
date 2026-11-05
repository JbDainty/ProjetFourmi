import { listenVector } from './vectorFrames';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Path,
  Image as SvgImage,
  G,
  Rect,
  Ellipse,
  Circle,
} from 'react-native-svg';
import { PencilNote } from './PencilNote';

/** A rolled botanical manuscript opens first; its graphite note starts second. */
export function HintScroll({
  text,
  motion,
  request,
  pending,
}: {
  text: string;
  motion: boolean;
  request: number;
  pending: boolean;
}) {
  const token = 'hint-scroll-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const value = useRef(new Animated.Value(0)).current;
  const [frame, setFrame] = useState({ request: -1, progress: 0 });
  const [opened, setOpened] = useState(-1);
  const [size, setSize] = useState({ width: 0, height: 60 });
  const progress = !motion ? 1 : frame.request === request ? frame.progress : 0;
  const settled = !motion || opened === request;
  const ready = settled && !pending;
  useEffect(() => {
    value.setValue(0);
    const listener = listenVector(value, (progress) => setFrame({ request, progress }));
    if (!motion) {
      value.setValue(1);
      setOpened(request);
    } else
      Animated.timing(value, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setOpened(request);
      });
    return () => {
      value.stopAnimation();
      value.removeListener(listener);
    };
  }, [request, motion, value]);
  const { width, height } = size;
  const left = width / 2 - (4 + (width / 2 - 14) * progress);
  const right = width - left;
  const span = right - left;
  const roll = 5 + 7 * (1 - progress);
  const sheet = `M${left} 8 Q${left + span * 0.12} 4 ${left + span * 0.22} 7 L${right - span * 0.12} 6 Q${right - span * 0.04} 8 ${right} 5 L${right} ${height - 7} Q${right - span * 0.14} ${height - 4} ${right - span * 0.26} ${height - 7} L${left + span * 0.1} ${height - 5} Q${left + span * 0.04} ${height - 8} ${left} ${height - 6}Z`;
  return (
    <View testID="hint-scroll" style={{ width: '100%', maxWidth: 580, alignSelf: 'center' }}>
      <View
        testID={settled ? 'hint-scroll-open' : 'hint-scroll-unrolling'}
        onLayout={(event) => {
          const next = event.nativeEvent.layout;
          setSize((previous) =>
            previous.width === next.width && previous.height === next.height
              ? previous
              : { width: next.width, height: next.height },
          );
        }}
        style={{
          minHeight: 60,
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        {width > 0 && (
          <Svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            pointerEvents="none"
            accessible={false}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id={`${token}-paper`} x1="0" y1="0" x2="0" y2="1">
                <Stop stopColor="#c6a36a" />
                <Stop offset=".2" stopColor="#efdcad" />
                <Stop offset=".55" stopColor="#f5e5bd" />
                <Stop offset=".83" stopColor="#e5cc96" />
                <Stop offset="1" stopColor="#bc965d" />
              </LinearGradient>
              <LinearGradient id={`${token}-roll`} x1="0" x2="1">
                <Stop stopColor="#795d3b" />
                <Stop offset=".2" stopColor="#c1a16b" />
                <Stop offset=".5" stopColor="#f3dfad" />
                <Stop offset=".78" stopColor="#ddbf83" />
                <Stop offset="1" stopColor="#92703e" />
              </LinearGradient>
              <ClipPath id={`${token}-clip`}>
                <Path d={sheet} />
              </ClipPath>
            </Defs>
            <Ellipse
              cx={width / 2}
              cy={height - 3}
              rx={Math.max(5, (right - left) / 2)}
              ry="3"
              fill="#493d2e"
              opacity=".13"
            />
            <G clipPath={`url(#${token}-clip)`}>
              <Path id="hint-parchment-sheet" d={sheet} fill={`url(#${token}-paper)`} />
              <SvgImage
                href={require('../../assets/illustrations/papier.png')}
                x={10}
                y="3"
                width={Math.max(1, width - 20)}
                height={height - 6}
                preserveAspectRatio="xMidYMid slice"
                opacity=".35"
              />
              <G
                transform={`translate(${width - 63} ${height / 2}) rotate(-24)`}
                fill="none"
                stroke="#526648"
                strokeWidth=".8"
                opacity=".12"
              >
                <Path d="M0 25 Q8 4 0-23 M3 12 Q-13 9-12-2 Q-1-2 3 12 M4 4 Q18 1 18-10 Q7-9 4 4 M1-10 Q-7-17 0-24 Q9-17 1-10" />
                <Circle cx="0" cy="0" r="24" strokeDasharray="1 4" opacity=".5" />
              </G>
              <Path
                d={`M${left + 14} 10 Q${left + 54} 12 ${left + 79} 9 M${right - 95} ${height - 10} Q${right - 56} ${height - 8} ${right - 17} ${height - 11}`}
                fill="none"
                stroke="#9d7c4f"
                strokeWidth=".6"
                opacity=".25"
              />
            </G>
            {[left, right].map((x, index) => (
              <G key={index}>
                <Rect
                  x={x - roll / 2}
                  y="5"
                  width={roll}
                  height={height - 10}
                  rx={roll / 2}
                  fill={`url(#${token}-roll)`}
                />
                <Ellipse
                  cx={x}
                  cy="5"
                  rx={roll / 2}
                  ry="2.5"
                  fill="#dec38e"
                  stroke="#aa8652"
                  strokeWidth=".6"
                />
                <Ellipse cx={x} cy={height - 5} rx={roll / 2} ry="2.5" fill="#9b7745" />
                <Path
                  d={`M${x + roll * 0.15} 11 V${height - 11}`}
                  stroke="#fff0c7"
                  opacity=".4"
                  strokeWidth=".7"
                />
              </G>
            ))}
          </Svg>
        )}
        <PencilNote text={text} handwritten motion={motion} request={request} ready={ready} bare />
      </View>
    </View>
  );
}
