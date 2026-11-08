import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Defs, LinearGradient, Stop, Path, G, Circle } from 'react-native-svg';
import { SvgBackdrop } from './SvgBackdrop';

/** Carved corners stay outside the map's clipping area and never intercept a gesture. */
export function JourneyFrame({ children }: { children: React.ReactNode }) {
  return (
    <View
      testID="journey-frame"
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
        padding: 13,
        borderRadius: 29,
        backgroundColor: '#6a553b',
        boxShadow: '0 5px 14px #3d392a40',
      }}
    >
      <SvgBackdrop viewBox="0 0 360 600" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="antique-map-gold" x1="0" y1="0" x2="1" y2="0.8">
            <Stop stopColor="#6e5135" />
            <Stop offset="0.18" stopColor="#bf9f60" />
            <Stop offset="0.47" stopColor="#ddc58c" />
            <Stop offset="0.7" stopColor="#816343" />
            <Stop offset="1" stopColor="#c4a471" />
          </LinearGradient>
        </Defs>
        <Path
          d="M29 2Q180 8 331 2Q357 2 358 29Q352 300 358 571Q357 598 331 598Q180 592 29 598Q2 597 2 571Q8 300 2 29Q2 2 29 2Z"
          fill="url(#antique-map-gold)"
          stroke="#715438"
          strokeWidth="2"
        />
        <Path
          d="M27 9Q180 15 333 9Q351 9 351 29L351 571Q351 591 331 591Q180 585 29 591Q9 591 9 571L9 29Q9 9 27 9Z"
          fill="none"
          stroke="#e8d3a0"
          strokeWidth="1"
        />
      </SvgBackdrop>
      <View
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: 17,
          overflow: 'hidden',
          backgroundColor: '#cbd0a9',
          borderWidth: 1,
          borderColor: '#644b32',
        }}
      >
        {children}
      </View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {[false, true].flatMap((bottom) =>
          [false, true].map((right) => (
            <View
              key={`${bottom}${right}`}
              style={{
                position: 'absolute',
                width: 64,
                height: 64,
                top: bottom ? undefined : 0,
                bottom: bottom ? 0 : undefined,
                left: right ? undefined : 0,
                right: right ? 0 : undefined,
                transform: [{ scaleX: right ? -1 : 1 }, { scaleY: bottom ? -1 : 1 }],
              }}
            >
              <SvgBackdrop viewBox="0 0 64 64">
                <G fill="none" stroke="#ead6a2" strokeWidth="0.85">
                  <Path d="M8 60Q13 28 5 19Q3 3 21 5Q34 12 59 8 M13 51Q10 31 20 20Q32 11 51 13 M10 36Q27 36 19 22Q8 15 9 26Q10 31 16 27 M35 11Q36 26 24 20Q17 12 26 10Q31 9 28 15 M19 18Q30 27 36 36 M21 23Q11 32 18 40Q27 33 21 23 M24 21Q32 12 41 18Q35 27 24 21" />
                  <Circle cx="12" cy="12" r="3" fill="#e8d3a0" />
                  <Path d="m36 29 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ab8650" />
                </G>
              </SvgBackdrop>
            </View>
          )),
        )}
      </View>
    </View>
  );
}
