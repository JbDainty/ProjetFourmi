import React, { useId } from 'react';
import Svg, { Defs, LinearGradient, Stop, G, Path, Circle, Ellipse } from 'react-native-svg';

export type SpellIconName = 'undo' | 'restart' | 'hint' | 'mix';
function Leaf({ x, y, angle, size = 1 }: { x: number; y: number; angle: number; size?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
      <Path
        d="M0 0 C-10-4-11-15-3-23 C6-18 11-6 0 0Z"
        fill="#a9b687"
        fillOpacity="0.75"
        stroke="#49684c"
        strokeWidth="1.1"
      />
      <Path d="M0 0-3-21 M-1-8-6-12 M-2-13 2-16" fill="none" stroke="#55744f" strokeWidth="0.8" />
    </G>
  );
}
function Star({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return (
    <Path
      d="M0-5 Q1-1 5 0 Q1 1 0 5 Q-1 1-5 0 Q-1-1 0-5Z"
      transform={`translate(${x} ${y}) scale(${size})`}
      fill="#b49450"
      stroke="#8c743f"
      strokeWidth="0.5"
    />
  );
}
export function SpellIcon({ name, size = 36 }: { name: SpellIconName; size?: number }) {
  const id = 'spell-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg
      testID={`spell-icon-${name}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessible={false}
      accessibilityElementsHidden
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#d2b66f" />
          <Stop offset="0.5" stopColor="#987a3d" />
          <Stop offset="1" stopColor="#d9c28a" />
        </LinearGradient>
      </Defs>
      <G strokeLinecap="round" strokeLinejoin="round">
        {name === 'mix' && (
          <>
            <Path
              d="M10 18 C28 12 31 49 53 44 M44 36 54 44 44 50 M10 46 C28 51 32 14 53 20 M44 12 54 20 44 27"
              fill="none"
              stroke={`url(#${id})`}
              strokeWidth="2"
            />
            <Leaf x={19} y={23} angle={-40} size={0.5} />
            <Leaf x={23} y={43} angle={45} size={0.48} />
            <Star x={35} y={32} size={0.7} />
            <Star x={13} y={9} size={0.45} />
          </>
        )}
        {name === 'undo' && (
          <>
            <Path
              d="M46 10 A21 21 0 1 0 49 49 A19 19 0 0 1 46 10Z"
              fill="#cbb77e"
              fillOpacity="0.17"
              stroke="#b3a06a"
              strokeWidth="0.75"
            />
            <Path
              d="M14 22 C33 5 59 20 51 40 Q46 54 28 49 Q17 46 16 39 M16 12 Q15 21 8 26 Q18 25 25 30"
              fill="none"
              stroke="#4a6b4d"
              strokeWidth="2"
            />
            <Path
              d="M21 18 C39 9 55 24 49 38"
              fill="none"
              stroke={`url(#${id})`}
              strokeWidth="0.85"
            />
            <Leaf x={47} y={41} angle={68} size={0.7} />
            <Leaf x={31} y={50} angle={-67} size={0.55} />
            <Leaf x={22} y={18} angle={-33} size={0.4} />
            <Path
              d="M29 33 Q32 24 37 29 Q43 35 35 40 Q28 42 29 33Z"
              fill="#d7c28b"
              fillOpacity="0.5"
              stroke="#9c8449"
              strokeWidth="0.9"
            />
            <Path d="M31 37 36 29" stroke="#a0884f" strokeWidth="0.7" />
            <Star x={53} y={12} size={0.68} />
            <Circle cx="13" cy="51" r="1" fill="#b49450" />
          </>
        )}
        {name === 'restart' && (
          <>
            <Circle
              cx="32"
              cy="32"
              r="24"
              fill="none"
              stroke="#b49b60"
              strokeWidth="0.6"
              strokeDasharray="1 3"
            />
            <Path
              d="M48 17 C35-1 8 12 11 35 Q13 55 34 54 Q49 53 54 38 M48 8 Q49 17 55 21 Q46 21 41 25"
              fill="none"
              stroke="#49694c"
              strokeWidth="1.8"
            />
            <Path
              d="M16 35 C16 49 33 54 44 45"
              fill="none"
              stroke={`url(#${id})`}
              strokeWidth="1"
            />
            <Leaf x={14} y={36} angle={-39} size={0.57} />
            <Leaf x={23} y={51} angle={-66} size={0.55} />
            <Leaf x={47} y={45} angle={74} size={0.52} />
            <Path d="M30 43 Q36 32 32 23" fill="none" stroke="#63834f" strokeWidth="1.1" />
            <Leaf x={32} y={39} angle={55} size={0.35} />
            {Array.from({ length: 6 }, (_, index) => (
              <Ellipse
                key={index}
                cx="32"
                cy="20"
                rx="3"
                ry="5.8"
                transform={`rotate(${index * 60} 32 26)`}
                fill="#e9d3b1"
                stroke="#ad8d59"
                strokeWidth="0.7"
              />
            ))}
            <Circle cx="32" cy="26" r="3.2" fill="#b69b50" />
            <Star x={55} y={32} size={0.5} />
          </>
        )}
        {name === 'hint' && (
          <>
            <Circle
              cx="27"
              cy="27"
              r="18"
              fill="#e5e0bd"
              fillOpacity="0.22"
              stroke={`url(#${id})`}
              strokeWidth="2.3"
            />
            <Circle cx="27" cy="27" r="14.8" fill="none" stroke="#627c56" strokeWidth="0.7" />
            <Path
              d="M39 40 51 55 Q55 59 58 55 L43 39 M42 43 54 55"
              fill="#a5a87c"
              fillOpacity="0.45"
              stroke="#597149"
              strokeWidth="1.2"
            />
            <Leaf x={50} y={51} angle={69} size={0.5} />
            <Path
              d="M24 39 Q32 29 26 18 M27 34 Q17 30 19 24 Q26 25 27 34"
              fill="none"
              stroke="#53764c"
              strokeWidth="1.1"
            />
            <Star x={28} y={21} size={1.05} />
            <Star x={49} y={10} size={0.8} />
            <Star x={12} y={47} size={0.52} />
            <Path d="M14 22 Q16 16 21 14" fill="none" stroke="#f8eed0" strokeWidth="2" />
            <Circle cx="52" cy="22" r="1.1" fill="#b49450" />
            <Circle cx="6" cy="32" r="0.9" fill="#b49450" />
          </>
        )}
      </G>
    </Svg>
  );
}
