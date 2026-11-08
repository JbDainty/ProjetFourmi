import React, { memo, useId } from 'react';
import { Animated, Image, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { Botanical } from './Botanical';
import { T } from './ui';
import { F } from './fonts';
import { SvgBackdrop } from './SvgBackdrop';

type Timeline = Animated.Value;
function interpolate(value: Timeline, inputRange: number[], outputRange: number[] | string[]) {
  return value.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
}

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

function Fern() {
  return (
    <Svg width="64" height="138" viewBox="0 0 64 138" accessible={false}>
      <G stroke="#6f885b" strokeWidth="0.7" fill="#9bad7d" fillOpacity="0.5">
        <Path d="M14 133Q48 73 38 10" fill="none" strokeWidth="1" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <G key={i} transform={`translate(${24 + i * 2} ${112 - i * 16}) rotate(${-20 + i * 4})`}>
            <Path d="M0 0Q-25-4-22-18Q-5-15 0 0Z M1-3Q24-7 21-20Q6-18 1-3Z" />
            <Path d="M0 0-19-15 M1-3 18-17" fill="none" strokeWidth="0.45" />
          </G>
        ))}
      </G>
    </Svg>
  );
}

function Butterfly() {
  return (
    <Svg width="32" height="26" viewBox="0 0 40 32" accessible={false}>
      <G stroke="#8b7957" strokeWidth="0.7" fill="#d8c295">
        <Path d="M20 16Q2-2 2 11Q1 20 15 20Q4 28 12 30Q19 31 20 18 M20 16Q38-2 38 11Q39 20 25 20Q36 28 28 30Q21 31 20 18" />
        <Path
          d="M20 26V12 M20 13Q12 7 15 5 M20 13Q28 7 25 5 M6 10 17 18 M11 14 17 17 M34 10 23 18 M29 14 23 17"
          fill="none"
        />
        <Circle cx="20" cy="12" r="1.2" fill="#8b7957" />
      </G>
    </Svg>
  );
}

/** One photographed book + a real evolving plate; a finite native choreography adds depth. */
export const CabinetBook = memo(function CabinetBook({
  width,
  plant,
  stage,
  value,
  settled,
  onOpen,
}: {
  width: number;
  plant: number;
  stage: number;
  value: Timeline;
  settled: boolean;
  onOpen: () => void;
}) {
  const artWidth = Math.min(430, width),
    height = (artWidth * 2) / 3;
  return (
    <View style={{ height: height + 7, width: '100%', alignItems: 'center', overflow: 'hidden' }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 10,
          opacity: interpolate(value, [0, 0.25, 0.55], [0, 0, 0.65]),
          transform: [
            { translateY: interpolate(value, [0.15, 0.6], [30, 0]) },
            { scaleY: interpolate(value, [0.15, 0.6], [0.3, 1]) },
            { rotate: '-14deg' },
          ],
        }}
      >
        <Fern />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -10,
          top: 2,
          opacity: interpolate(value, [0, 0.25, 0.55], [0, 0, 0.55]),
          transform: [{ scaleY: interpolate(value, [0.2, 0.65], [0.2, 1]) }, { rotate: '165deg' }],
        }}
      >
        <Fern />
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Observer ma planche dans l’herbier"
        onPress={onOpen}
        style={({ pressed }) => ({ width: artWidth, height, opacity: pressed ? 0.85 : 1 })}
      >
        <Animated.View
          testID="home-living-book"
          renderToHardwareTextureAndroid={!settled}
          shouldRasterizeIOS={!settled}
          style={{
            width: artWidth,
            height,
            opacity: interpolate(value, [0, 0.13], [0, 1]),
            transform: [
              { perspective: 900 },
              { translateY: interpolate(value, [0, 0.25, 0.5], [22, -3, 0]) },
              { scale: interpolate(value, [0, 0.25, 0.5], [0.89, 1.015, 1]) },
              { rotateX: interpolate(value, [0, 0.25, 0.5], ['13deg', '-2deg', '0deg']) },
              { rotateZ: interpolate(value, [0, 0.35, 0.6], ['-5deg', '1deg', '0deg']) },
            ],
          }}
        >
          <Image
            source={require('../../assets/home/cabinet-book.png')}
            resizeMode="contain"
            fadeDuration={0}
            accessible={false}
            style={{ width: artWidth, height }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: artWidth * 0.585,
              top: artWidth * 0.095,
              transform: [{ rotate: '-4deg' }, { skewY: '-3deg' }],
            }}
          >
            <Botanical index={plant} stage={stage} size={artWidth * 0.3} labels={false} />
          </View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: artWidth * 0.247,
              top: height * 0.33,
              width: artWidth * 0.25,
              alignItems: 'center',
              transform: [{ rotate: '-6deg' }],
            }}
          >
            <T
              style={{
                fontFamily: F.display,
                fontSize: artWidth * 0.054,
                lineHeight: artWidth * 0.062,
                color: '#6d6c48',
                textAlign: 'center',
              }}
            >
              Flora{String.fromCharCode(10)}mirabilis
            </T>
            <Svg width={artWidth * 0.19} height={18} viewBox="0 0 80 18" accessible={false}>
              <Path
                d="M4 12Q24 15 38 7Q51 14 76 10 M37 7Q28-2 27 5Q29 11 37 7 M39 8Q46-1 49 4Q49 10 39 8"
                fill="none"
                stroke="#a18b58"
                strokeWidth=".8"
              />
            </Svg>
            <T
              style={{
                fontFamily: F.scientific,
                fontSize: artWidth * 0.026,
                lineHeight: artWidth * 0.037,
                color: '#8a784f',
                textAlign: 'center',
              }}
            >
              Le vivant reprend{String.fromCharCode(10)}ses couleurs.
            </T>
          </View>
        </Animated.View>
      </Pressable>
      {!settled && (
        <>
          {[0, 1, 2, 3].map((n) => (
            <Animated.View
              key={n}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: '45%',
                top: '45%',
                opacity: interpolate(
                  value,
                  [0, 0.2 + n * 0.04, 0.32 + n * 0.04, 0.8, 1],
                  [0, 0, 0.8, 0, 0],
                ),
                transform: [
                  {
                    translateX: interpolate(
                      value,
                      [0, 0.25, 0.65, 1],
                      [n * 9, n * 9, 30 + (n - 1.5) * 55, 55 + (n - 1.5) * 70],
                    ),
                  },
                  {
                    translateY: interpolate(
                      value,
                      [0, 0.25, 0.7, 1],
                      [20, 20, -20 - n * 14, -45 - n * 12],
                    ),
                  },
                  { rotate: interpolate(value, [0, 1], ['0deg', '90deg']) },
                ],
              }}
            >
              <Svg width="12" height="12" viewBox="0 0 16 16" accessible={false}>
                <Path d="M8 1 10 6 15 8 10 10 8 15 6 10 1 8 6 6Z" fill="#c1a15b" fillOpacity=".7" />
                <Circle cx="8" cy="8" r="2" fill="#fff0bf" />
              </Svg>
            </Animated.View>
          ))}
          <Animated.View
            testID="home-butterfly"
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: '10%',
              top: '55%',
              opacity: interpolate(value, [0, 0.35, 0.47, 0.87, 1], [0, 0, 1, 1, 0]),
              transform: [
                {
                  translateX: interpolate(
                    value,
                    [0, 0.35, 0.55, 0.75, 1],
                    [0, 0, artWidth * 0.2, artWidth * 0.55, artWidth * 0.8],
                  ),
                },
                {
                  translateY: interpolate(
                    value,
                    [0, 0.35, 0.55, 0.75, 1],
                    [0, 0, -height * 0.35, -height * 0.5, -height * 0.9],
                  ),
                },
                {
                  rotate: interpolate(
                    value,
                    [0, 0.4, 0.6, 0.8, 1],
                    ['-20deg', '-20deg', '12deg', '-8deg', '-30deg'],
                  ),
                },
                {
                  scaleX: interpolate(
                    value,
                    [0, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 1],
                    [0.6, 0.6, 1, 0.3, 1, 0.3, 1, 0.3, 1, 0.3, 1, 0.3, 1, 0.5],
                  ),
                },
              ],
            }}
          >
            <Butterfly />
          </Animated.View>
        </>
      )}
    </View>
  );
});
