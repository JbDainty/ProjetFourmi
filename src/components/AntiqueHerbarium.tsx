import React, { memo, useId } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { F } from './fonts';
import { T } from './ui';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

const gold = '#e1c58a';
// Original gold-tooling silhouettes: a different herbarium emblem for every biome.
const specimens = [
  'M0 25Q7 0 0-22M2 13Q-19 12-15-2Q-1-1 2 13M3 2Q23-1 18-14Q4-12 3 2M0-20Q-13-29-6-34Q2-34 0-20M0-20Q12-32 17-24Q13-15 0-20M0-20Q-5-39 3-39Q11-31 0-20',
  'M-9 27Q16-1 7-31M-5 16Q-24 9-17-2Q-6 0-5 16M3 4Q23 5 23-10Q9-13 3 4M7-10Q-9-13-4-27Q9-27 7-10M-15 25Q-23 14-29 19Q-34 28-15 25M20 27V13M11 13Q20-2 29 13Z',
  'M-18 21V-30M0 25V-38M17 19V-24M-22-28Q-18-36-14-28V-15Q-18-9-22-15ZM-4-35Q0-43 4-35V-21Q0-15-4-21ZM13-21Q17-29 21-21V-9Q17-3 13-9M-29 27Q-14 22 0 27T29 27M-24 33Q-10 28 4 33T27 33',
  'M-27 27-9-1 1 13 13-9 30 27M-15 10-9 3-4 11M7 4 13-3 20 9M0-12Q-18-5-15-16Q-14-25 0-12Q-15-31-4-31Q5-33 0-12Q12-33 18-25Q22-16 0-12Q23-13 19-3Q9 4 0-12M0-12V23',
  'M-16 27Q3 9 14-30M-7 15Q-27 14-21 1Q-7-2-7 15M0 5Q20 9 24-4Q10-11 0 5M5-8Q-12-9-9-22Q3-23 5-8M10-20Q25-16 29-29Q18-33 10-20M-17 31Q-2 26 12 29M-27-30A12 12 0 1 0-10-40',
  'M-22 24Q4 14 20-28M-9 17Q-29 6-19-7L-8-2-9 17M5 0Q23 4 29-10L17-19 5 0M12-12Q-5-21 3-32L17-28 12-12M-19 3-28-6M21-10 31-18',
  'M0 26V-25M0 9Q-23 6-18-9Q-2-10 0 9M0 2Q22-1 18-16Q4-15 0 2M-7-26A7 7 0 1 1 7-26A7 7 0 1 1-7-26M0-26Q-12-41-18-31Q-24-19-8-20M0-26Q13-41 19-31Q24-18 8-20M-9 26Q-19 16-27 22Q-28 32-9 26',
  'M0 28V-9M0 8Q-28 8-22-8Q-3-12 0 8M0 0Q27-1 22-17Q4-20 0 0M0-8Q-16-23-10-33Q4-37 0-8M0-9Q20-18 14-31Q1-34 0-9M-13 30Q0 21 13 30',
  'M-12 28Q6 3 0-33M-7 15Q-26 10-20-5Q-7-4-7 15M1 2Q21 1 20-14Q5-16 1 2M1-13Q-12-16-9-29Q2-30 1-13M-26 26Q-22 11-14 16M14 25Q29 8 24-4M19 15Q33 18 31 5',
  'M-24 28Q-6 2-20-29M-10 25Q-1-3-1-35M5 26Q14-2 26-23M-20-27-30-20M-1-35 7-26M26-23 29-10M-31 32Q-12 25 0 32T31 32M-30 39Q-12 32 0 39T30 39',
  'M0 28Q9-1 0-34M0 10-15 0M3-3 20-11M2-17-13-24M-19 0Q-24-8-15-11Q-4-8-10 0ZM17-10Q12-21 21-24Q32-19 26-11ZM-16-24Q-22-35-12-38Q-2-32-8-25Z',
  'M-15 27Q-4 0 10-34M7-25Q-21-25-24-8M4-15Q-12-14-17 2M1-5Q23-3 24 13M-4 9Q12 10 15 24M-29 30Q-14 24 0 30T29 30',
  'M0 29V-27M0 15Q-25 11-19 1Q-28-11-12-13Q-18-26-5-26L0-17Q4-35 14-30Q24-29 17-17Q32-12 20-2Q28 12 0 15M0 1-13-10M0-7 11-19',
  'M0 31V-35M0-35-15-13H-8L-24 8H-14L-30 26H30L14 8H24L8-13H15ZM0-20-6-9M0-7 13 8M0 8-19 24',
  'M0 28Q12-1 0-24M4 10Q-16 11-15-4Q-2-7 4 10M7-2Q26-7 19-20Q5-17 7-2M0-24Q-17-36-21-25Q-23-12 0-24Q-3-45 7-40Q17-36 0-24Q21-34 22-21Q18-9 0-24',
  'M-18 31Q-5 9 14-29M-9 18-24 9-25-4-13-1-4-12 2 2-9 18M5-5-3-20 5-28 15-17 28-18 20-5 5-5M-18 31 6 34M-23 20-27 29',
  'M0 30V-36M0 15Q-17 13-14 3Q-4 3 0 15M0 5Q17 3 14-7Q4-7 0 5M0-4Q-17-6-14-16Q-4-16 0-4M0-14Q17-16 14-26Q4-26 0-14M0-23Q-12-31 0-38Q12-31 0-23',
  'M-16 30Q7 7 9-35M0 10Q-22 8-16-7Q1-9 0 10M8-8Q24-9 25-23Q11-27 8-8M-20 29Q-26-2-30-13M-4 29Q19 11 30 8M6-30 14-31M5-24 14-25',
  'M-15 30Q5 8 1-26M-3 8Q-23 4-17-9Q-1-10-3 8M2-2Q23-5 18-18Q4-17 2-2M1-26 1-39M1-26-10-35M1-26 12-35M1-26-16-26M1-26 17-26M1-26-9-17M1-26 12-17',
  'M-12 30Q18 3 7-34M-8 23Q-29 16-23 3Q-9 4-8 23M2 11Q24 13 26-1Q11-7 2 11M10-4Q-7-7-6-22Q9-25 10-4M10-18Q26-18 22-31Q11-35 10-18M7-31Q-6-34 0-42Q11-44 7-31',
];

const Medallion = memo(function Medallion({ index, size }: { index: number; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Circle cx="50" cy="50" r="43" fill="#172d2822" stroke={gold} strokeWidth=".7" />
      <Circle
        cx="50"
        cy="50"
        r="39"
        fill="none"
        stroke={gold}
        strokeWidth=".35"
        strokeDasharray="1 5"
      />
      <Path
        d="M17 72Q4 42 27 23M83 72Q96 42 73 23M14 53Q5 45 10 36Q18 40 14 53ZM86 53Q95 45 90 36Q82 40 86 53Z"
        fill="#c4b27633"
        stroke={gold}
        strokeWidth=".7"
      />
      <G
        transform="translate(50 55) scale(.78)"
        fill="none"
        stroke={gold}
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d={specimens[index % specimens.length]} />
      </G>
      <Path
        d="m50 3 1.3 4 4 1.3-4 1.3-1.3 4-1.3-4-4-1.3 4-1.3ZM50 85 53 89 50 93 47 89Z"
        fill={gold}
      />
    </Svg>
  );
});

const Binding = memo(function Binding({
  width,
  height,
  index,
}: {
  width: number;
  height: number;
  index: number;
}) {
  const id = 'archive-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const left = 16,
    right = width - 12,
    bottom = height - 13;
  const corners = [
    [left, 8, 1, 1],
    [right, 8, -1, 1],
    [left, bottom, 1, -1],
    [right, bottom, -1, -1],
  ];
  return (
    <Svg
      width={width}
      height={height}
      style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
      viewBox={`0 0 ${width} ${height}`}
      accessible={false}
    >
      <Defs>
        <LinearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#e9d2a3" stopOpacity=".22" />
          <Stop offset="0.42" stopColor="#fff5c0" stopOpacity="0" />
          <Stop offset="1" stopColor="#081b1a" stopOpacity=".45" />
        </LinearGradient>
        <LinearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#f9e8b2" />
          <Stop offset="0.4" stopColor="#b1975b" />
          <Stop offset="0.72" stopColor="#e4c984" />
          <Stop offset="1" stopColor="#836a39" />
        </LinearGradient>
      </Defs>
      <Rect x="8" y="1" width={width - 14} height={height - 8} rx="7" fill={`url(#${id}-light)`} />
      <Path
        d={`M${left + 9} 8H${right - 9}Q${right} 8 ${right} 17V${bottom - 9}Q${right} ${bottom} ${right - 9} ${bottom}H${left + 9}Q${left} ${bottom} ${left} ${bottom - 9}V17Q${left} 8 ${left + 9} 8Z`}
        fill="none"
        stroke={`url(#${id}-gold)`}
        strokeWidth="1.2"
      />
      <Rect
        x={left + 4}
        y="12"
        width={Math.max(1, right - left - 8)}
        height={Math.max(1, bottom - 16)}
        rx="7"
        fill="none"
        stroke={gold}
        strokeOpacity=".45"
        strokeWidth=".5"
      />
      {corners.map(([x, y, sx, sy], i) => (
        <G
          key={i}
          transform={`translate(${x} ${y}) scale(${sx} ${sy})`}
          fill={`url(#${id}-gold)`}
          stroke="#f3dfaa"
          strokeWidth=".4"
        >
          <Path d="M0 0H25L18 4Q10 4 9 11L4 24 0 26ZM4 5Q4 16 8 14Q13 8 19 8M3 3 12 3 3 12" />
          <Circle cx="3" cy="3" r="1.3" fill="#5a4b2d" />
        </G>
      ))}
      {[0.18, 0.36, 0.65, 0.83].map((p, i) => (
        <G key={i} transform={`translate(0 ${height * p})`}>
          <Path d="M1 0 12-1V4L1 5Z" fill={`url(#${id}-gold)`} stroke="#6c5a36" strokeWidth=".5" />
          <Path d="M2 1 10 0" stroke="#fff0bf" strokeWidth=".7" />
        </G>
      ))}
      <Path
        d={`M${width - 13} ${height * 0.48}h12v18h-12l-5-9Z`}
        fill={`url(#${id}-gold)`}
        stroke="#665536"
        strokeWidth=".7"
      />
      <Path
        d={`M${width - 10} ${height * 0.48 + 4}l3-2 3 5-3 4-3-2Z`}
        fill={['#799b79', '#b5ad77', '#87aaa4', '#a6a3be', '#c2a677'][index % 5]}
        stroke="#f2dfae"
        strokeWidth=".6"
      />
      <Path d={`M3 8V${height - 13}`} stroke="#f6e1a6" strokeOpacity=".4" strokeWidth=".8" />
    </Svg>
  );
});

type Props = {
  index: number;
  title: string;
  color: string;
  done: number;
  total: number;
  width: number;
  height: number;
  glimmer: Animated.Value;
};
export const AntiqueHerbarium = memo(function AntiqueHerbarium({
  index,
  title,
  color,
  done,
  total,
  width,
  height,
  glimmer,
}: Props) {
  const tiny = height < 115,
    small = height < 280;
  const emblem = tiny ? 0 : Math.min(small ? (height < 200 ? 32 : 50) : 78, height * 0.25);
  const titleSize = tiny ? 14 : small ? 17 : Math.min(29, width * 0.13);
  const leather =
    '#' +
    color
      .slice(1)
      .match(/../g)!
      .map((v) =>
        Math.round(parseInt(v, 16) * 0.53)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');
  const start = (index % 4) * 0.24;
  return (
    <View testID={`antique-binding-${index}`} style={{ width, height }} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          left: 6,
          right: 1,
          top: 7,
          bottom: 2,
          borderRadius: 6,
          backgroundColor: '#2e372a',
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 10,
          right: 0,
          top: 11,
          bottom: 5,
          borderRadius: 5,
          backgroundColor: '#d2bc87',
          overflow: 'hidden',
        }}
      >
        <Image
          source={require('../../assets/prologue/edge.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
          fadeDuration={0}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 6,
          top: 0,
          bottom: 9,
          backgroundColor: leather,
          borderRadius: 6,
          borderTopLeftRadius: 3,
          borderBottomLeftRadius: 3,
          overflow: 'hidden',
          borderWidth: 0.7,
          borderColor: '#ad925b',
        }}
      >
        <Image
          source={require('../../assets/prologue/leather.png')}
          fadeDuration={0}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            width: width * 4,
            height: height * 4,
            left: -width * 0.28,
            top: -height * 0.28,
            opacity: 0.42,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 11,
            backgroundColor: '#142c2966',
            borderRightColor: '#d2b57b88',
            borderRightWidth: 1,
          }}
        />
      </View>
      <Binding width={width} height={height} index={index} />
      <View
        style={{
          position: 'absolute',
          left: 25,
          right: 23,
          top: tiny ? 8 : 18,
          bottom: tiny ? 13 : 23,
          alignItems: 'center',
          justifyContent: 'center',
          gap: small ? 1 : 6,
          zIndex: 2,
        }}
      >
        {!tiny && (
          <T
            maxFontSizeMultiplier={1.1}
            style={{
              fontSize: small ? 8 : 9,
              lineHeight: 12,
              letterSpacing: 1.4,
              color: '#ecdbab',
            }}
          >
            VOLUME {String(index + 1).padStart(2, '0')}
          </T>
        )}
        {emblem > 0 && <Medallion index={index} size={emblem} />}
        <T
          serif
          testID={`antique-cover-title-${index}`}
          numberOfLines={tiny ? 2 : 3}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          maxFontSizeMultiplier={height < 210 ? 1 : 1.1}
          style={{
            fontSize: titleSize,
            lineHeight: Math.ceil(titleSize * 1.4),
            textAlign: 'center',
            color: '#fff0c8',
            flexShrink: 1,
            width: '100%',
          }}
        >
          {title}
        </T>
        {!small && <PathDivider width={Math.min(100, width - 70)} />}
        <T
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          style={{
            fontFamily: F.scientific,
            fontSize: tiny ? 9 : small ? 10 : 13,
            lineHeight: tiny ? 11 : small ? 13 : 17,
            color: '#e5d3a4',
            marginTop: small ? 2 : 4,
          }}
        >
          {done} / {total} estampillées
        </T>
        {height > 310 && (
          <T
            maxFontSizeMultiplier={1.1}
            style={{ fontFamily: F.scientific, fontSize: 12, lineHeight: 16, color: '#cbb57f' }}
          >
            Ouvrir le carnet
          </T>
        )}
      </View>
      <Animated.View
        testID={`antique-cover-glimmer-${index}`}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{
          position: 'absolute',
          left: 15,
          right: 10,
          top: 8,
          bottom: 14,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: '#ffedb5',
          zIndex: 3,
          opacity: glimmer.interpolate({
            inputRange: [0, start + 0.025, start + 0.1, start + 0.2, 1],
            outputRange: [0, 0, 0.65, 0, 0],
            extrapolate: 'clamp',
          }),
        }}
      />
    </View>
  );
});
function PathDivider({ width }: { width: number }) {
  return (
    <Svg width={width} height={9} viewBox="0 0 100 9" accessible={false}>
      <Path d="M0 4H38M62 4H100M44 4 50 0 56 4 50 8Z" stroke={gold} strokeWidth=".7" fill="none" />
    </Svg>
  );
}

export function OpeningHerbarium({
  onDone,
  children,
}: {
  onDone: () => void;
  children: React.ReactNode;
}) {
  const { value } = useNativeProgress(360, true, onDone);
  usePrimaryAnimation(true);
  return (
    <Animated.View
      testID="antique-book-opening"
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={{
        transformOrigin: 'left center',
        opacity: value.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0.82] }),
        transform: [
          { perspective: 700 },
          {
            rotateY: value.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: ['0deg', '-2deg', '-15deg'],
            }),
          },
          { scale: value.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.012, 1.025] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
