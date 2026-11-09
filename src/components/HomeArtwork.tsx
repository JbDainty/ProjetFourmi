import React, { memo, useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { SvgBackdrop } from './SvgBackdrop';

/** Static original engravings. Only the containing native layers are animated. */
export const HomeEmblem = memo(function HomeEmblem({
  name,
  size = 48,
}: {
  name: 'day' | 'mystery';
  size?: number;
}) {
  const id = 'home-emblem-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View
      pointerEvents="none"
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 80 80" accessible={false}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#fff0c8" />
            <Stop offset="1" stopColor="#c9b889" />
          </LinearGradient>
        </Defs>
        <G
          fill="none"
          stroke="#6e805e"
          strokeWidth="0.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Circle cx="40" cy="40" r="33" stroke="#af965c" strokeWidth="0.5" opacity="0.5" />
          {name === 'day' ? (
            <>
              <Path d="M18 25Q40 20 62 25L60 66Q40 61 19 66Z" fill={`url(#${id})`} />
              <Path
                d="M23 28Q41 24 58 28 M24 60Q40 56 55 60 M29 23V18 M51 23V18"
                stroke="#ab8d51"
              />
              <Circle cx="43" cy="39" r="9" fill="#d7ba70" fillOpacity="0.45" stroke="#aa8c4a" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <Path
                  key={angle}
                  transform={`translate(43 39) rotate(${angle})`}
                  d="M0-12V-15"
                  stroke="#b29758"
                />
              ))}
              <Path
                d="M32 58Q35 45 28 38 M33 51Q23 49 26 43Q34 44 33 51 M33 47Q42 44 39 39"
                fill="#a5b58b"
                fillOpacity="0.45"
              />
              <Path
                d="M12 18 13 22 17 23 13 24 12 28 11 24 7 23 11 22Z"
                fill="#b39a5d"
                stroke="none"
              />
            </>
          ) : (
            <>
              <Path
                d="M30 19H49 M32 20V31Q20 39 20 55Q21 68 40 68Q59 67 60 55Q60 39 47 31V20"
                fill={`url(#${id})`}
              />
              <Path d="M32 16Q40 13 47 16V22Q40 24 32 21Z" fill="#627b5e" />
              <Path
                d="M26 48Q41 43 54 48V56Q51 64 40 64Q27 63 26 56Z"
                fill="#9b88a0"
                fillOpacity="0.55"
              />
              <Path d="M30 35Q25 42 25 52 M37 59Q33 51 37 45 M37 53Q44 51 43 46" stroke="#e7dcb9" />
              <Path
                d="M58 23Q49 19 55 13Q61 9 63 15Q64 20 61 24 M62 29V30 M13 48Q5 40 12 35Q19 33 17 26"
                stroke="#8b7893"
              />
              <Circle cx="62" cy="29" r="1" fill="#a28f5e" stroke="none" />
            </>
          )}
          <Path d="M11 61Q7 51 13 43 M12 54Q20 50 17 44 M64 63Q72 55 68 47" strokeWidth="0.65" />
          <Circle cx="68" cy="17" r="1.3" fill="#b19a5f" stroke="none" />
        </G>
      </Svg>
    </View>
  );
});

export function CabinetFrame({ dark = false }: { dark?: boolean }) {
  return (
    <SvgBackdrop viewBox="0 0 360 240" preserveAspectRatio="none">
      <Path
        d="M24 7Q93 11 180 6Q263 11 336 7C346 10 348 22 348 34Q344 116 350 206C349 223 342 230 329 231Q251 227 180 234Q99 228 27 233C13 231 10 222 10 207Q15 120 10 34C10 20 13 10 24 7Z"
        fill={dark ? '#355441' : '#f5e9cf'}
        fillOpacity={dark ? 1 : 0.8}
        stroke="#b59b64"
        strokeWidth="0.7"
      />
      {[false, true].map((mirror) => (
        <G
          key={String(mirror)}
          transform={mirror ? 'translate(360 240) rotate(180)' : undefined}
          stroke={dark ? '#d8c48c' : '#7e956e'}
          strokeWidth="0.7"
          fill="none"
          opacity="0.75"
        >
          <Path d="M13 56Q28 43 20 20Q39 22 45 14 M20 38Q9 35 13 25Q23 27 20 38 M22 30Q34 28 30 20Q20 20 22 30 M30 21Q34 10 41 13" />
          <Circle cx="48" cy="14" r="1" fill="#b1985e" />
        </G>
      ))}
      <Path
        d="M32 14Q103 18 180 12Q264 18 327 14 M31 224Q108 219 180 228Q258 221 328 225"
        stroke="#c6ad77"
        strokeWidth="0.45"
        fill="none"
        opacity="0.65"
      />
    </SvgBackdrop>
  );
}
