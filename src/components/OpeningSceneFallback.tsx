import React, { useId, useEffect } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  Image,
  ClipPath,
} from 'react-native-svg';
import { Asset } from 'expo-asset';
import type { OpeningSceneProps } from '../scene/prologueTextures';
import { prologueFrame } from '../animation/prologue';
const clamp = (x: number) => Math.max(0, Math.min(1, x));

export function OpeningScene({ progress: p, onReady }: OpeningSceneProps) {
  useEffect(() => {
    onReady?.();
  }, []);
  const token = 'opening-' + useId().replace(/[^a-z0-9]/gi, '');
  const opening = prologueFrame(p).opening,
    flight = clamp((p - 0.31) / 0.55),
    cover = Math.cos(opening * Math.PI);
  return (
    <Svg
      testID="opening-svg-book"
      width="100%"
      height="100%"
      viewBox="0 0 600 700"
      accessible={false}
    >
      <Defs>
        <ClipPath id={token + '-grain'}>
          <Path d="M0-168 181-150 187 166 0 184Z" />
        </ClipPath>
        <RadialGradient id={token + '-glow'}>
          <Stop stopColor="#c4b778" stopOpacity="0.4" />
          <Stop offset="1" stopColor="#233e33" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={token + '-paper'}>
          <Stop stopColor="#b9a47b" />
          <Stop offset="0.17" stopColor="#f0dfb5" />
          <Stop offset="0.78" stopColor="#f9edcf" />
          <Stop offset="1" stopColor="#b7a17b" />
        </LinearGradient>
        <LinearGradient id={token + '-leather'}>
          <Stop stopColor="#213c31" />
          <Stop offset="0.55" stopColor="#516048" />
          <Stop offset="1" stopColor="#2e4133" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="300" cy="350" rx="295" ry="330" fill={`url(#${token}-glow)`} />
      {Array.from({ length: 18 }, (_, i) => (
        <Circle
          key={i}
          cx={70 + ((i * 79) % 470) + Math.sin(p * 5 + i) * 9}
          cy={650 - ((i * 67 + p * 180) % 600)}
          r={i % 3 === 0 ? 1.9 : 1}
          fill="#ddc486"
          opacity={0.12 + 0.25 * Math.sin(p * Math.PI)}
        />
      ))}
      <G
        transform={`translate(300 ${390 - Math.sin(p * Math.PI) * 12}) scale(${0.85 + p * 0.2}) rotate(${-5 + p * 5})`}
      >
        <Ellipse cx="10" cy="173" rx={137 + opening * 78} ry="18" fill="#0f251d" opacity="0.45" />
        <Path
          d="M-8-164 181-147 187 162 0 181-15 166Z"
          fill="#654f34"
          stroke="#b39a64"
          strokeWidth="2"
        />
        {[0, 1, 2, 3].map((i) => (
          <Path
            key={i}
            d={`M0 ${-153 + i * 3} Q80 ${-172 + i * 3} 175 ${-139 + i * 3} L179 ${149 + i * 3} Q82 ${138 + i * 3} 0 ${174 + i * 2}Z`}
            fill={`url(#${token}-paper)`}
            stroke="#b9a57e"
            strokeWidth="0.8"
          />
        ))}
        <Path
          d="M0-147 Q-80-169-178-140 L-184 153 Q-88 139 0 175Z"
          fill={`url(#${token}-paper)`}
          opacity={opening}
        />
        <Path d="M0-147 Q83-166 174-139 L179 151 Q82 139 0 175Z" fill={`url(#${token}-paper)`} />
        <Path d="M0-148 Q-7 7 0 175" stroke="#8f7853" strokeWidth="3" fill="none" />
        <G transform={`matrix(${cover} 0 0 1 0 0)`}>
          <Path
            d="M0-168 181-150 187 166 0 184Z"
            fill={cover < 0 ? `url(#${token}-paper)` : `url(#${token}-leather)`}
            stroke="#b49b61"
            strokeWidth="2.4"
          />
          <Path
            d="M17-146 162-132 166 147 17 159Z"
            fill="none"
            stroke="#c4ac72"
            strokeWidth="1.1"
          />
          <Image
            href={Asset.fromModule(require('../../assets/illustrations/papier.png')).uri}
            x="0"
            y="-168"
            width="187"
            height="352"
            opacity="0.18"
            clipPath={`url(#${token}-grain)`}
          />
          {cover > 0 && (
            <G stroke="#ccb67b" fill="none" strokeWidth="1.5">
              <Path d="M87 99 Q114 5 86-58 M97 35 Q53 19 53-11 Q92-14 97 35 M101 1 Q145-12 139-39 Q101-33 101 1 M86-58 C57-72 61-107 86-105 C109-106 122-72 86-58Z" />
              <Circle cx="86" cy="-84" r="5" fill="#ccb67b" />
              <Path d="M50 116 131 118 M61 125 119 127" />
            </G>
          )}
        </G>
        <G opacity={opening * 0.7} fill="none" stroke="#849167" strokeWidth="1.2">
          <Path d="M90 112 Q115 40 86-44 M99 53 Q60 46 63 20 Q93 19 99 53 M100 21 Q137 10 133-18 Q99-11 100 21 M86-44 C64-48 68-81 86-82 C108-79 112-50 86-44Z" />
          <Path d="M-144-92-52-100 M-140-73-70-80 M-137-55-60-60" stroke="#b3a07a" />
        </G>
      </G>
      {Array.from({ length: 7 }, (_, i) => {
        const t = clamp((flight - i * 0.045) * 1.3),
          side = i % 2 ? 1 : -1,
          x = 300 + side * Math.sin(t * Math.PI * 0.8) * (165 + i * 17),
          y = 380 - t * (300 + i * 33);
        return (
          <G
            key={'page' + i}
            testID="opening-flying-page"
            opacity={Math.sin(t * Math.PI) * 0.8}
            transform={`translate(${x} ${y}) rotate(${side * (18 + t * 180) + i * 9}) scale(${0.3 + 0.5 * Math.sin(t * Math.PI)})`}
          >
            <Path d="M-48-68 Q0-82 48-62 L46 67 Q0 56-48 72Z" fill="#f3e3bd" stroke="#bda77d" />
            <Path
              d="M-29-36 28-34 M-30-23 24-22 M-29-10 29-9 M-28 3 13 4"
              stroke="#b4a17c"
              strokeWidth="1.5"
            />
            <Path
              d="M-7 53 Q9 34 0 15 M3 32 Q-14 27-13 18 Q0 17 3 32"
              fill="none"
              stroke="#8e9b6d"
            />
          </G>
        );
      })}
      {Array.from({ length: 15 }, (_, i) => {
        const t = clamp((flight - (i % 5) * 0.035) * 1.15),
          side = i % 2 ? 1 : -1;
        return (
          <G
            key={'leaf' + i}
            opacity={Math.sin(t * Math.PI) * 0.9}
            transform={`translate(${300 + side * Math.sin(t * 3 + i * 0.3) * (80 + i * 13)} ${405 - t * (180 + i * 20)}) rotate(${i * 47 + t * side * 220}) scale(${0.5 + (i % 3) * 0.15})`}
          >
            <Path
              d="M0 14 C-19 1-13-22 4-29 C18-12 17 3 0 14Z"
              fill={i % 3 ? '#a8b886' : '#ccb374'}
              stroke="#74835d"
            />
            <Path d="M0 14 4-25 M2-1-7-8 M3-10 10-15" stroke="#6e7c57" fill="none" />
          </G>
        );
      })}
    </Svg>
  );
}
