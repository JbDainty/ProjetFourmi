import React from 'react';
import { G, Path, Rect, Circle, Text as SvgText } from 'react-native-svg';
export function RuleMark({
  kind,
  color = '#5e7753',
  accent,
}: {
  kind: string;
  color?: string;
  accent?: string;
}) {
  return (
    <G fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {(kind === 'mystery' || kind === 'capacity') && (
        <SvgText y={7} textAnchor="middle" fontSize="22" stroke="none" fill={color}>
          {kind === 'mystery' ? '?' : '2/3'}
        </SvgText>
      )}
      {kind === 'locks' || kind === 'lock' || kind === 'unlock' ? (
        <>
          <Path
            d={kind === 'unlock' ? 'M-5-1V-6A5 5 0 0 1 5-6L7-7' : 'M-5-1V-6A5 5 0 0 1 5-6V-1'}
          />
          <Rect x="-8" y="-1" width="16" height="13" rx="3" fill="#ead9ae" />
          <Circle cy="4" r="1.5" />
          <Path d="M0 6V8" />
        </>
      ) : null}
      {kind === 'brush' ? (
        <>
          <Path d="M-1 3 5-11Q7-13 8-10L3 5Z" fill="#bba271" />
          <Path d="M-2 3Q-9 4-7 11Q-3 13 1 7L3 4Z" fill="#8ea877" />
        </>
      ) : null}
      {kind === 'pipette' ? (
        <>
          <Path d="M-5-9 4-12 8-5-1-2Z M-1-2-6 8 0 4 4-5" />
          <Path d="M4 6Q0 11 4 13Q8 11 4 6Z" fill="#9eb5a0" />
        </>
      ) : null}
      {kind === 'conservation' ? (
        <>
          <Path d="M0-11V6M-5 0 0 6 5 0 M-8 9H8" />
          <Path d="M-7-6-5-10M7-6 5-10" />
        </>
      ) : null}
      {kind === 'crystal' ? (
        <>
          <Path d="M0-12 8-2 4 10-4 10-8-2Z M0-12 0 10M-8-2H8" fill={accent ?? '#e1e9df'} />
        </>
      ) : null}
      {kind === 'links' ? (
        <>
          <Circle cx="-5" r="6" />
          <Circle cx="5" r="6" />
        </>
      ) : null}
      {kind === 'filter' ? (
        <>
          <Path d="M-10-9H10L3 2V10L-3 12V2Z" />
          <Circle cy="-5" r="2" fill={color} />
        </>
      ) : null}
    </G>
  );
}
