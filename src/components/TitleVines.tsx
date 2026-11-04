import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Ellipse, Circle } from 'react-native-svg';

const unfurl = (value: number, start: number) => Math.max(0, Math.min(1, (value - start) / 0.18));
export function TitleVines({
  progress,
  foreground = false,
}: {
  progress: number;
  foreground?: boolean;
}) {
  const leaves = [
    [35, 59, -50, 0.13],
    [45, 35, -36, 0.23],
    [67, 20, 42, 0.34],
    [99, 48, 60, 0.46],
    [139, 16, -48, 0.56],
    [183, 43, 55, 0.68],
    [231, 34, 38, 0.78],
  ];
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[StyleSheet.absoluteFill, { top: -12, bottom: -12, left: -16, right: -16 }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 260 100" accessible={false}>
        {!foreground ? (
          <>
            <Path
              testID="title-vine-stem"
              d="M12 86 C43 88 32 16 67 18 C99 20 81 52 109 49 C130 48 118 12 150 14 C178 14 166 51 195 45 C219 40 229 21 248 32"
              fill="none"
              stroke="#4e7150"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="410 410"
              strokeDashoffset={410 * (1 - progress)}
            />
            <Path
              d="M244 81 C218 88 208 60 190 65 S169 88 146 76 S111 65 89 77 S51 84 37 74"
              fill="none"
              stroke="#8b9462"
              strokeWidth=".85"
              strokeDasharray="250 250"
              strokeDashoffset={250 * (1 - progress)}
            />
            {leaves.map(([x, y, angle, start], index) => (
              <G
                key={index}
                transform={`translate(${x} ${y}) rotate(${angle}) scale(${unfurl(progress, start)})`}
              >
                <Path
                  d="M0 0 C-8-3-10-11-3-20 C5-17 9-5 0 0Z"
                  fill="#a6b583"
                  fillOpacity=".8"
                  stroke="#59794f"
                  strokeWidth=".7"
                />
                <Path
                  d="M0 0-3-18 M-1-7-6-10 M-2-11 2-14"
                  fill="none"
                  stroke="#577447"
                  strokeWidth=".65"
                />
              </G>
            ))}
          </>
        ) : (
          <>
            <Path
              d="M26 64 Q33 48 41 48 M102 49 Q113 60 122 51 M181 43 Q187 56 200 52"
              fill="none"
              stroke="#627747"
              strokeWidth="1"
              strokeDasharray="80 80"
              strokeDashoffset={80 * (1 - progress)}
            />
            {[
              [42, 43, 0.35],
              [103, 50, 0.53],
              [192, 18, 0.68],
              [230, 72, 0.8],
            ].map(([x, y, start], index) => (
              <G
                key={index}
                testID="title-vine-flower"
                opacity={unfurl(progress, start)}
                transform={`translate(${x} ${y}) scale(${unfurl(progress, start)})`}
              >
                {Array.from({ length: 5 }, (_, petal) => (
                  <Ellipse
                    key={petal}
                    cx="0"
                    cy="-3.7"
                    rx="2.8"
                    ry="4.3"
                    transform={`rotate(${petal * 72})`}
                    fill={index % 2 ? '#d7a2a0' : '#f5e6b9'}
                    stroke="#a58560"
                    strokeWidth=".5"
                  />
                ))}
                <Circle r="1.8" fill="#b2934f" />
                <Circle cx="-.4" cy="-.5" r=".5" fill="#fff3c6" />
              </G>
            ))}
          </>
        )}
      </Svg>
    </View>
  );
}
