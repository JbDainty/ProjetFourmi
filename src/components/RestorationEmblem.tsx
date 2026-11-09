import React, { memo, useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

/** A small gameplay emblem: three pigments, engraved glass and a flowering sprig. */
export const RestorationEmblem = memo(function RestorationEmblem({
  size = 110,
}: {
  size?: number;
}) {
  const id = 'menu-glass-' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessible={false}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop stopColor="#fff7d8" stopOpacity="0.7" />
          <Stop offset="0.3" stopColor="#e8eed5" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#adc3a1" stopOpacity="0.45" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="62" r="48" fill="#b6c59a" opacity="0.15" />
      <G stroke="#728869" strokeWidth="0.8" fill="none">
        <Path
          d="M14 91Q5 53 28 28M88 29Q118 58 100 93M25 33Q11 32 19 19Q32 21 25 33M20 42Q4 43 11 30Q23 29 20 42M99 43Q113 41 108 28Q94 29 99 43"
          fill="#a6ba85"
          fillOpacity="0.55"
        />
        <Path d="M23 101Q61 109 98 100" stroke="#b39a61" />
      </G>
      {[
        { x: 24, y: 39, c: '#b66d86', h: 39 },
        { x: 49, y: 23, c: '#c3a251', h: 53 },
        { x: 74, y: 43, c: '#6b9c87', h: 37 },
      ].map((v, i) => (
        <G key={v.x}>
          <Ellipse cx={v.x + 11} cy={102} rx="12" ry="3" fill="#5c6947" opacity="0.12" />
          <Path
            d={`M${v.x} ${v.y}v49q0 13 11 13t11-13V${v.y}Z`}
            fill={`url(#${id})`}
            stroke="#789078"
            strokeWidth="0.8"
          />
          <Path
            d={`M${v.x + 3} ${100 - v.h}v${v.h - 12}q0 10 8 10t8-10v${12 - v.h}Z`}
            fill={v.c}
            fillOpacity="0.8"
          />
          <Ellipse cx={v.x + 11} cy={100 - v.h} rx="8" ry="2" fill={v.c} />
          <Ellipse
            cx={v.x + 11}
            cy={v.y}
            rx="11"
            ry="3"
            fill="#f4edd2"
            stroke="#779074"
            strokeWidth="0.7"
          />
          <Path
            d={`M${v.x + 4} ${v.y + 7}v39q0 8 5 10`}
            fill="none"
            stroke="#fff9df"
            strokeOpacity="0.7"
            strokeWidth="1.8"
          />
        </G>
      ))}
      <G fill="none" stroke="#6d885c" strokeWidth="1">
        <Path d="M60 37Q73 17 89 14M74 23Q62 16 68 8Q80 9 74 23M80 19Q80 4 92 7Q96 18 80 19" />
        <Path d="M92 15Q101 9 103 17Q102 24 94 21" stroke="#ba8a71" />
      </G>
      <G fill="#d8b976">
        <Circle cx="16" cy="59" r="1.5" />
        <Circle cx="105" cy="69" r="1" />
        <Path d="m41 8 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" />
      </G>
    </Svg>
  );
});
