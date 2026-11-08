import React, { memo, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { T } from './ui';
import { F } from './fonts';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

const Pages = memo(function Pages() {
  return (
    <Svg width={56} height={50} viewBox="0 0 72 64" accessible={false}>
      <G strokeLinecap="round" strokeLinejoin="round">
        <Path
          d="M13 14Q25 8 36 15Q49 8 61 13L61 54Q48 48 36 56Q24 49 12 54Z"
          fill="#365644"
          stroke="#aa8c51"
          strokeWidth="1"
        />
        <Path
          d="M16 12Q27 8 36 14Q48 8 59 12L58 51Q47 47 36 53Q25 47 16 51Z"
          fill="#eee0bd"
          stroke="#b19a6a"
          strokeWidth=".8"
        />
        <Path
          d="M36 14V53M19 45Q27 43 33 47M40 47Q48 43 55 46M40 43Q47 40 55 43"
          stroke="#b49d6c"
          strokeWidth=".6"
          fill="none"
        />
        <Path
          d="M25 43Q29 32 24 22M27 35Q17 31 21 26Q28 27 27 35M27 31Q36 26 31 22Q25 24 27 31M24 23Q18 17 24 16Q29 18 24 23"
          stroke="#657e55"
          strokeWidth=".9"
          fill="#afbb8a"
          fillOpacity=".35"
        />
        <Path d="M42 18V31L45 28 48 31V17" fill="#ad6853" stroke="#8b6846" strokeWidth=".5" />
        <Circle cx="13" cy="48" r="10" fill="#eee0bd" stroke="#a68c55" strokeWidth=".7" />
        <Path
          d="M18 51Q23 40 9 43M9 43 13 39M9 43 13 47"
          fill="none"
          stroke="#48684c"
          strokeWidth="1.25"
        />
        <Path
          d="M8 28Q4 23 8 18M8 24Q14 21 12 17M61 45Q68 40 65 35"
          fill="none"
          stroke="#839265"
          strokeWidth=".65"
        />
      </G>
    </Svg>
  );
});
const Cover = memo(function Cover() {
  return (
    <Svg width={27} height={40} viewBox="0 0 33 48" accessible={false}>
      <Path d="M3 5 30 1V42L3 47Z" fill="#3f5d43" stroke="#9f824a" strokeWidth="1" />
      <Path d="M6 8 27 5V39L6 43Z" fill="none" stroke="#c8ae6d" strokeWidth=".65" />
      <Path
        d="M13 36Q21 25 16 15M18 28Q8 25 11 20Q18 21 18 28M18 24Q27 20 23 15Q17 17 18 24M16 17Q10 12 16 10Q21 12 16 17"
        fill="none"
        stroke="#c8ae6d"
        strokeWidth=".85"
        strokeLinecap="round"
      />
    </Svg>
  );
});
function Glyph({ value }: { value?: Animated.Value }) {
  return (
    <Animated.View
      style={{
        width: 56,
        height: 50,
        transform: value
          ? [{ scale: value.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.08, 1] }) }]
          : [],
      }}
    >
      <Pages />
      <Animated.View
        testID="menu-book-cover"
        renderToHardwareTextureAndroid={!!value}
        shouldRasterizeIOS={!!value}
        style={{
          position: 'absolute',
          left: 26,
          top: 5,
          width: 27,
          height: 40,
          transformOrigin: 'left center',
          transform: [
            { perspective: 240 },
            {
              rotateY: value
                ? value.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '-116deg'] })
                : '-8deg',
            },
          ],
        }}
      >
        <Cover />
      </Animated.View>
      {value && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 5,
            right: 0,
            opacity: value.interpolate({ inputRange: [0, 0.2, 0.6, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, -8] }) },
              {
                rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '35deg'] }),
              },
            ],
          }}
        >
          <Svg width={18} height={20} viewBox="0 0 18 20" accessible={false}>
            <Path
              d="M5 17Q-2 6 12 2Q17 12 5 17ZM5 17 11 5"
              fill="#a9b783"
              stroke="#6f8659"
              strokeWidth=".7"
            />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}
function Opening({ onDone }: { onDone: () => void }) {
  const { value } = useNativeProgress(320, true, onDone);
  usePrimaryAnimation(true);
  return (
    <View testID="menu-return-opening">
      <Glyph value={value} />
    </View>
  );
}

/** One direct return to the cabinet; only cached native views move during the gesture. */
export function HerbariumBookButton({ motion, onHome }: { motion: boolean; onHome: () => void }) {
  const [opening, setOpening] = useState(false);
  const activated = useRef(false);
  const activate = () => {
    if (activated.current) return;
    activated.current = true;
    if (motion) setOpening(true);
    else onHome();
  };
  return (
    <Pressable
      testID="herbarium-book-button"
      accessibilityRole="button"
      accessibilityLabel="Menu principal"
      accessibilityHint="Revenir à l’accueil et à tous les accès du jeu, en conservant votre partie"
      accessibilityState={{ busy: opening }}
      disabled={opening}
      onPress={activate}
      style={({ pressed }) => ({
        width: 62,
        minHeight: 74,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {opening ? <Opening onDone={onHome} /> : <Glyph />}
      <T
        maxFontSizeMultiplier={1.3}
        style={{
          fontFamily: F.scientific,
          fontSize: 12,
          lineHeight: 16,
          color: '#6a7652',
          marginTop: -1,
        }}
      >
        Menu
      </T>
    </Pressable>
  );
}
