import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';
import { F } from './fonts';
import { sealPosition } from '../animation/restoration';

/** Original engraved rosette. The stamp celebrates restoration, not scientific certification. */
export const SealMark = memo(function SealMark() {
  return (
    <G fill="none" stroke="#526d51" strokeLinecap="round" strokeLinejoin="round" opacity="0.86">
      <Circle r="35.5" strokeWidth="1.1" strokeDasharray="83 1 40 0.8 92 1" />
      <Circle r="32.6" strokeWidth="0.55" />
      <Circle r="29.4" strokeWidth="0.55" strokeDasharray="0.5 2.1" />
      <Path d="M-27 7 Q-31-8-22-19 M27 7 Q31-8 22-19" strokeWidth="0.7" />
      {[-1, 1].map((mirror) => (
        <G key={mirror} transform={`scale(${mirror} 1)`}>
          <Path
            d="M24-3 Q15-6 19-13 Q27-12 24-3 M25-10 Q32-14 28-20 Q21-17 25-10 M22-18 Q17-20 19-25 Q25-25 22-18"
            fill="#526d51"
            fillOpacity="0.18"
            strokeWidth="0.5"
          />
          <Path d="M-5 27 Q-13 30-20 24 M-14 27 Q-18 20-22 23 Q-22 28-14 27" strokeWidth="0.6" />
        </G>
      ))}
      <SvgText
        x="0"
        y="-18"
        textAnchor="middle"
        fontFamily={F.display}
        fontSize="7.3"
        letterSpacing="1.1"
        fill="#526d51"
        stroke="none"
      >
        HERBIER
      </SvgText>
      <G transform="translate(0 -3)">
        {[0, 72, 144, 216, 288].map((angle) => (
          <Ellipse
            key={angle}
            cx="0"
            cy="-5.4"
            rx="2.8"
            ry="5.3"
            transform={`rotate(${angle})`}
            strokeWidth="0.65"
            fill="#526d51"
            fillOpacity="0.07"
          />
        ))}
        <Circle r="2" strokeWidth="0.65" />
        <Path
          d="M0 2 Q-3 8 1 12 M0 8 Q-8 7-7 3 Q-1 3 0 8 M0 7 Q7 3 7 0 Q1 1 0 7"
          strokeWidth="0.7"
        />
      </G>
      <SvgText
        x="0"
        y="17"
        textAnchor="middle"
        fontFamily={F.displayBold}
        fontSize="6.8"
        letterSpacing="0.35"
        fill="#526d51"
        stroke="none"
      >
        RESTAURÉE
      </SvgText>
      <Path d="M-17 21 Q0 24 17 21" strokeWidth="0.5" />
      <Circle cx="-27" cy="14" r="0.8" fill="#526d51" />
      <Circle cx="27" cy="14" r="0.8" fill="#526d51" />
    </G>
  );
});

export const BotanicalSeal = memo(function BotanicalSeal({ size }: { size: number }) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      testID="botanical-restoration-seal"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="-38 -38 76 76" accessible={false}>
        <SealMark />
      </Svg>
    </View>
  );
});

export function PlateSeal({ size }: { size: number }) {
  const factor = size / 360;
  const diameter = sealPosition.diameter * factor;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: sealPosition.x * factor - diameter / 2,
        top: sealPosition.y * factor - diameter / 2,
        transform: [{ rotate: `${sealPosition.angle}deg` }],
      }}
    >
      <BotanicalSeal size={diameter} />
    </View>
  );
}
