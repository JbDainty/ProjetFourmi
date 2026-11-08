import React, { memo, useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
export type CarnetEmblem =
  'herbier' | 'ecosystemes' | 'boutique' | 'parametres' | 'atelier' | 'resume' | 'aide' | 'accueil';

/** Original miniature engravings, rasterized as small immutable views on mobile. */
export const CarnetIllustration = memo(function CarnetIllustration({
  name,
  size = 64,
  light = false,
}: {
  name: CarnetEmblem;
  size?: number;
  light?: boolean;
}) {
  const id = 'carnet-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ink = light ? '#e4d7a3' : '#45634b';
  const gold = '#af8e4c';
  return (
    <View
      testID={`carnet-emblem-${name}`}
      pointerEvents="none"
      accessible={false}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 80 80" accessible={false}>
        <Defs>
          <LinearGradient id={`${id}-paper`} x1="0" y1="0" x2="0.8" y2="1">
            <Stop stopColor="#fff4cf" />
            <Stop offset="1" stopColor="#d7c494" />
          </LinearGradient>
          <LinearGradient id={`${id}-gold`} x1="0" y1="0" x2="0.8" y2="1">
            <Stop stopColor="#e7ce8c" />
            <Stop offset="0.48" stopColor="#bb9854" />
            <Stop offset="1" stopColor="#8b703d" />
          </LinearGradient>
          <LinearGradient id={`${id}-green`} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#6e8964" />
            <Stop offset="1" stopColor="#2f5443" />
          </LinearGradient>
          <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#fffbe1" stopOpacity="0.65" />
            <Stop offset="0.45" stopColor="#bad4be" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#7a9e83" stopOpacity="0.5" />
          </LinearGradient>
        </Defs>
        <G fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="40" cy="40" r="32" stroke={gold} strokeWidth="0.55" opacity="0.36" />
          <Path
            d="M8 42 A32 32 0 0 1 35 8 M47 72 A32 32 0 0 0 72 43"
            stroke={gold}
            strokeWidth="1.1"
            opacity="0.48"
          />
          {[12, 68].map((x, i) => (
            <G
              key={x}
              transform={`translate(${x} ${i ? 57 : 25}) rotate(${i ? 145 : -25})`}
              stroke={ink}
              strokeWidth="0.65"
            >
              <Path
                d="M0 9 Q-3-2 1-12 M0 3 Q-9-1-6-7 Q1-6 0 3 M0-3 Q8-6 5-12 Q-1-11 0-3"
                fill={ink}
                fillOpacity="0.09"
              />
            </G>
          ))}
          {name === 'herbier' && (
            <G stroke={ink} strokeWidth="0.85">
              <Path
                d="M13 31 Q26 24 40 31 Q54 24 67 31 L68 65 Q53 59 40 66 Q26 59 12 65Z"
                fill={`url(#${id}-green)`}
              />
              <Path
                d="M15 29 Q28 23 40 30 Q52 23 65 29 L64 61 Q51 56 40 63 Q29 56 16 61Z"
                fill={`url(#${id}-paper)`}
              />
              <Path
                d="M40 30V63 M18 58 Q29 55 37 59 M43 59 Q52 55 62 58 M18 55 Q29 52 37 56"
                strokeWidth="0.55"
              />
              <Path
                d="M26 55 Q28 39 23 22 M26 45 Q15 39 20 33 Q29 36 26 45 M25 35 Q34 30 31 25 Q22 28 25 35 M24 29 Q17 24 20 19"
                strokeWidth="1"
              />
              <G transform="translate(23 19)">
                {[0, 72, 144, 216, 288].map((a) => (
                  <Ellipse
                    key={a}
                    transform={`rotate(${a})`}
                    cy="-4"
                    rx="2.2"
                    ry="4"
                    fill="#b1b9cc"
                    stroke="#77888c"
                    strokeWidth="0.5"
                  />
                ))}
                <Circle r="1.6" fill="#d2af58" />
              </G>
              <Path
                d="M48 51 Q55 48 57 36 M52 46 Q44 41 48 36 Q56 38 52 46 M54 42 Q63 39 60 34"
                strokeWidth="0.7"
              />
              <Path
                d="M45 30V44 L48 41 51 44V29"
                fill="#ba6a55"
                stroke="#966a4a"
                strokeWidth="0.6"
              />
              <Path
                d="M44 53 Q52 50 61 53 M44 56 Q51 53 59 56"
                stroke="#a58b5b"
                strokeWidth="0.45"
              />
            </G>
          )}
          {name === 'ecosystemes' && (
            <G stroke={ink} strokeWidth="0.8">
              <Path
                d="M25 67H55 M31 63H49 M40 58V66 M25 14 Q9 28 17 46 Q24 62 42 62"
                stroke={gold}
                strokeWidth="1.2"
              />
              <Circle
                cx="41"
                cy="34"
                r="23.5"
                fill={`url(#${id}-glass)`}
                stroke={gold}
                strokeWidth="1"
              />
              <Ellipse cx="41" cy="34" rx="12" ry="23.5" strokeWidth="0.45" opacity="0.45" />
              <Path
                d="M18 34H64 M22 22 Q41 29 60 22 M22 46 Q41 40 60 46"
                strokeWidth="0.45"
                opacity="0.5"
              />
              <Path
                d="M21 43 32 29 40 40 48 25 62 44"
                fill="#a1b392"
                fillOpacity="0.6"
                strokeWidth="0.7"
              />
              <Path d="M31 31 32 29 37 36 M45 30 48 25 52 32" stroke="#faf2d6" />
              <Path
                d="M25 48 Q41 41 58 48 M30 51 Q42 46 54 51 M42 46V36 M38 41 42 32 46 41 M38 44 42 36 46 44"
                strokeWidth="0.7"
              />
              <Circle cx="53" cy="19" r="2.8" fill="#e6ce89" stroke={gold} strokeWidth="0.6" />
              <Path d="M65 14V6 M61 10H69 M67 58V64 M64 61H70" stroke={gold} strokeWidth="0.65" />
            </G>
          )}
          {name === 'boutique' && (
            <G stroke="#79633e" strokeWidth="0.85">
              <Path
                d="M31 23 Q24 32 21 45 Q13 64 36 66 H48 Q66 62 58 46 Q53 34 50 23Z"
                fill={`url(#${id}-gold)`}
              />
              <Path d="M29 18 Q40 23 52 17 L49 27 Q40 31 31 26Z" fill="#a88b50" />
              <Path
                d="M28 26 Q39 31 53 25 M31 29 Q39 32 50 28 M29 30 Q25 20 19 25 Q16 33 31 30 M49 28 Q58 20 62 25 Q61 34 49 28 M53 29 Q64 35 58 41"
                stroke={ink}
                strokeWidth="1"
              />
              <Path d="M26 43 Q22 55 28 60 M51 38 Q59 56 51 61" stroke="#efdba5" opacity="0.7" />
              <Ellipse
                cx="40"
                cy="47"
                rx="8"
                ry="11"
                transform="rotate(-22 40 47)"
                fill="#e5cc8c"
                strokeWidth="0.65"
              />
              <Path d="M40 55 Q35 44 40 38 M38 46 Q43 48 44 43" stroke={ink} strokeWidth="0.7" />
              {[
                [-1, 0],
                [10, -1],
                [18, -6],
              ].map(([x, y], i) => (
                <G key={i} transform={`translate(${24 + x} ${70 + y}) rotate(${i * 35 - 30})`}>
                  <Ellipse rx="2.5" ry="4.4" fill="#d4b46c" strokeWidth="0.6" />
                  <Path d="M0-3Q-1 0 0 3" strokeWidth="0.45" />
                </G>
              ))}
              <Path d="M41 7V15 M37 11H45 M60 12V18 M57 15H63" stroke={gold} strokeWidth="0.7" />
            </G>
          )}
          {name === 'parametres' && (
            <G stroke={ink} strokeWidth="0.8">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <G key={a} transform={`translate(40 39) rotate(${a})`}>
                  <Path
                    d="M-4-22 Q-9-32 0-35 Q9-32 4-22Z"
                    fill={`url(#${id}-gold)`}
                    stroke={gold}
                    strokeWidth="0.65"
                  />
                  <Path d="M0-24V-32" strokeWidth="0.5" />
                </G>
              ))}
              <Circle
                cx="40"
                cy="39"
                r="24"
                fill={`url(#${id}-paper)`}
                stroke={gold}
                strokeWidth="1.3"
              />
              <Circle cx="40" cy="39" r="20" strokeWidth="0.55" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <Path
                  key={a}
                  transform={`translate(40 39) rotate(${a})`}
                  d="M0-16V-18"
                  stroke={gold}
                />
              ))}
              <Path
                d="M39 53 Q43 36 36 25 M40 42 Q28 38 32 31 Q44 33 40 42 M39 35 Q51 30 47 24 Q36 26 39 35"
                fill="#789167"
                fillOpacity="0.24"
                strokeWidth="0.9"
              />
              <Circle cx="40" cy="39" r="2.2" fill={gold} strokeWidth="0.6" />
              <Path d="M40 39 50 31 M40 39 34 47" strokeWidth="1.2" />
              <Path d="M31 67Q40 72 49 67" stroke={gold} strokeWidth="0.7" />
              <Circle cx="40" cy="69" r="1.3" fill={gold} />
            </G>
          )}
          {name === 'atelier' && (
            <G stroke={ink} strokeWidth="0.95">
              <Path
                d="M20 24H34 M23 25V38 L14 59 Q12 64 19 65H38 Q44 64 42 59L32 38V25"
                fill={`url(#${id}-glass)`}
              />
              <Path
                d="M19 52H38 L42 60 Q43 64 37 64H20 Q14 64 16 59Z"
                fill="#839d83"
                fillOpacity="0.65"
                strokeWidth="0.5"
              />
              <Path
                d="M22 43 19 55 M26 60 Q22 52 28 46 Q34 53 26 60 M52 17V49 M46 17H58 M47 22H57V54 Q52 64 47 54Z"
                fill={`url(#${id}-glass)`}
              />
              <Path
                d="M48 43H56V54 Q52 62 48 54Z"
                fill="#c88e73"
                fillOpacity="0.75"
                strokeWidth="0.5"
              />
              <Path
                d="M46 23H58 M51 16Q43 9 48 6 Q56 7 51 16 M54 15Q60 10 63 13"
                strokeWidth="0.8"
              />
              <Path d="M11 69 Q40 72 65 68" stroke={gold} strokeWidth="1.3" />
            </G>
          )}
          {name === 'accueil' && (
            <G stroke={ink} strokeWidth="0.8">
              <Path
                d="M14 63V35Q14 12 40 9Q66 12 66 35V63Z"
                fill={`url(#${id}-glass)`}
                stroke={gold}
                strokeWidth="1.2"
              />
              <Path
                d="M19 59V35Q19 17 40 14Q61 17 61 35V59 M40 14V61 M16 36H64 M17 53H63 M24 19 40 36 56 19"
                strokeWidth="0.55"
              />
              <Path
                d="M10 67Q40 70 70 67 M25 61Q32 53 40 57Q48 53 55 61L54 70Q47 65 40 69Q32 65 26 70Z"
                fill={`url(#${id}-paper)`}
              />
              <Path
                d="M40 57V69 M33 57Q35 43 30 33 M34 49Q24 45 28 39Q36 40 34 49 M33 42Q43 37 39 32"
                fill="#9eb18a"
                fillOpacity="0.35"
              />
              <Circle cx="30" cy="29" r="3.7" fill="#c6ab69" />
            </G>
          )}
          {name === 'aide' && (
            <G stroke={ink} strokeWidth="0.85">
              <Path d="M18 21Q39 17 60 21L58 64Q39 60 16 64Z" fill={`url(#${id}-paper)`} />
              <Path
                d="M22 26Q39 23 54 26 M22 31Q37 28 48 31 M22 53Q36 50 49 53 M22 57Q36 54 45 57"
                stroke={gold}
                strokeWidth="0.55"
              />
              <Path
                d="M36 51Q38 39 32 31 M37 43Q27 40 30 35Q39 36 37 43 M36 38Q44 34 43 29"
                fill="#9eaf83"
                fillOpacity="0.3"
              />
              <Path
                d="M44 60Q52 38 63 12Q74 28 64 40L49 53 M49 53 60 31 M57 37 56 27 M59 32 66 27 M54 44 66 39"
                fill="#c6cda7"
                fillOpacity="0.45"
              />
              <Circle cx="25" cy="42" r="2" fill={gold} stroke="none" />
              <Path
                d="M14 15 15 19 19 20 15 21 14 25 13 21 9 20 13 19Z"
                fill={gold}
                stroke="none"
              />
            </G>
          )}
          {name === 'resume' && (
            <G stroke={ink} strokeWidth="0.9">
              <Path
                d="M24 13 Q40 18 55 13 V61 L40 52 24 61Z"
                fill={light ? '#294b3b' : `url(#${id}-green)`}
              />
              <Path d="M28 18 Q40 22 51 18 V53 L40 47 28 53Z" stroke={gold} strokeWidth="0.6" />
              <Path
                d="M39 44 Q42 32 36 24 M40 37 Q29 34 33 28 Q43 30 40 37 M39 31 Q48 28 45 22"
                strokeWidth="1"
              />
              <Path
                d="M14 55 Q7 44 16 37 M11 39 16 37 16 43 M57 47Q69 39 61 30 M61 35 61 30 66 31"
                stroke={gold}
                strokeWidth="0.9"
              />
              <Path d="M54 64Q48 71 38 67 M45 67 38 67 41 72" stroke={ink} />
            </G>
          )}
          <Circle cx="9" cy="45" r="1.1" fill={gold} />
          <Circle cx="69" cy="27" r="1" fill={gold} />
        </G>
      </Svg>
    </View>
  );
});
