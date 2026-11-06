import React, { memo, useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { F } from './fonts';
import { sealPosition } from '../animation/restoration';

// Original, slightly uneven wax edge. Relief uses static light/shadow, without SVG filters.
const waxEdge =
  'M-5-35 C1-38 7-33 13-34 C20-35 22-29 28-26 C35-24 32-17 35-11 C39-5 34 1 35 7 C37 14 30 17 29 23 C27 30 20 28 15 33 C10 37 4 33-2 35 C-9 38-13 32-19 31 C-26 31-27 24-32 20 C-37 16-33 9-35 3 C-38-3-33-8-34-14 C-35-21-28-23-25-28 C-21-34-14-30-9-34Z';
function Engraving({ highlight = false }: { highlight?: boolean }) {
  return (
    <G
      fill="none"
      stroke={highlight ? '#e18768' : '#6b171d'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="0.75"
    >
      <Circle r="27.5" strokeWidth="0.65" />
      <Circle r="25.2" strokeWidth="0.5" strokeDasharray="0.6 2" />
      {[-1, 1].map((mirror) => (
        <G key={mirror} transform={`scale(${mirror} 1)`}>
          <Path d="M-19 15 Q-28-1-18-15 M-22 7 Q-16 3-17-3 Q-25-2-22 7 M-23-1 Q-31-6-26-11 Q-19-8-23-1 M-21-8 Q-16-13-18-18 Q-25-16-21-8 M-16 21 Q-10 25-3 24" />
          <Path
            d="M-14 21 Q-20 21-19 15 Q-12 16-14 21"
            fill={highlight ? '#da765b' : '#7e1b23'}
            fillOpacity="0.45"
            strokeWidth="0.5"
          />
        </G>
      ))}
      <SvgText
        x="0"
        y="-17"
        textAnchor="middle"
        fontFamily={F.displayBold}
        fontSize="5.9"
        letterSpacing="0.65"
        fill={highlight ? '#df8163' : '#70171e'}
        stroke="none"
      >
        HERBIER
      </SvgText>
      <G transform="translate(0 -2)">
        {[0, 72, 144, 216, 288].map((angle) => (
          <Path
            key={angle}
            transform={`rotate(${angle})`}
            d="M0 0 C-7-3-6-13 0-15 C6-13 7-3 0 0Z"
            strokeWidth="0.85"
          />
        ))}
        <Circle r="2.3" strokeWidth="0.8" />
        <Path d="M0 2 Q-3 9 0 14 M-1 9 Q-10 7-8 3 Q-2 3-1 9 M-1 10 Q7 5 8 1 Q1 2-1 10" />
      </G>
      <SvgText
        x="0"
        y="19"
        textAnchor="middle"
        fontFamily={F.displayBold}
        fontSize="5.4"
        letterSpacing="0.2"
        fill={highlight ? '#df8163' : '#70171e'}
        stroke="none"
      >
        RESTAURÉE
      </SvgText>
    </G>
  );
}

/** Antique burgundy wax with a pooled rim, shallow cracks and an impressed botanical crest. */
export const SealMark = memo(function SealMark() {
  const token = 'wax-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <G testID="red-wax-seal-art">
      <Defs>
        <RadialGradient id={`${token}-edge`} cx="0.32" cy="0.22" r="0.85">
          <Stop stopColor="#e58d6b" />
          <Stop offset="0.23" stopColor="#c85144" />
          <Stop offset="0.62" stopColor="#9e2932" />
          <Stop offset="0.88" stopColor="#7c1927" />
          <Stop offset="1" stopColor="#531320" />
        </RadialGradient>
        <RadialGradient id={`${token}-face`} cx="0.32" cy="0.23" r="0.85">
          <Stop stopColor="#c95d4a" />
          <Stop offset="0.4" stopColor="#b13b37" />
          <Stop offset="0.8" stopColor="#90262e" />
          <Stop offset="1" stopColor="#a83a37" />
        </RadialGradient>
      </Defs>
      <Path d={waxEdge} transform="translate(0.5 1.5)" fill="#513122" opacity="0.24" />
      <Path d={waxEdge} fill={`url(#${token}-edge)`} stroke="#751d26" strokeWidth="0.7" />
      <Path
        d="M-30-11 Q-32-21-22-27 M-16-31 Q-8-30-4-33 M8-32 Q18-32 23-27"
        stroke="#f0b08a"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.52"
      />
      <Path
        d="M-30 16 Q-26 28-15 29 M5 33 Q17 33 23 27 M30 19 Q34 10 33 4"
        stroke="#681622"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
      <Circle cy="0.8" r="29.6" fill="#711a24" />
      <Circle cy="-0.7" r="29.2" fill={`url(#${token}-face)`} stroke="#e28160" strokeWidth="0.55" />
      <Circle cy="-0.3" r="28.2" fill="none" stroke="#7b1e26" strokeWidth="0.75" opacity="0.65" />
      <G transform="translate(0.35 0.7)" opacity="0.76">
        <Engraving highlight />
      </G>
      <Engraving />
      <Path
        d="M-31-16-28-14 M20-30 18-27 M32 12 29 10 M-12 32-11 29"
        fill="none"
        stroke="#6f1c25"
        strokeWidth="0.45"
        opacity="0.6"
      />
      <Ellipse
        cx="-21"
        cy="-25"
        rx="4.5"
        ry="0.65"
        transform="rotate(-30 -21 -25)"
        fill="#f4c39b"
        opacity="0.3"
      />
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
