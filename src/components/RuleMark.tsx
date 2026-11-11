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
          <Rect x="-8" y="-1" width="16" height="13" rx="3" fill="#d7bd7e" />
          <Path d="M-5 2H5M-5 9H5" stroke="#f8eac1" strokeWidth=".7" />
          <Circle cy="4" r="1.6" fill={color} />
          <Path d="M0 6V8" strokeWidth="1.9" />
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
          <Path d="M-4-6V-10Q0-15 4-10V-6ZM-5-6H5V-2H-5ZM-2-2V3L0 6 2 3V-2" fill="#b5c7aa" />
          <Path d="M0 8Q-5 13 0 15Q5 13 0 8Z" fill="#6e9a8a" />
        </>
      ) : null}
      {kind === 'conservation' ? (
        <>
          <Path d="M0-11V5M-5-1 0 5 5-1" strokeWidth="1.8" />
          <Path d="M-9 4Q-9 12 0 12Q9 12 9 4M-7 9-5 5M7 9 5 5" fill="#a5b78b" />
        </>
      ) : null}
      {kind === 'crystal' ? (
        <>
          <Path d="M0-12 8-2 4 10-4 10-8-2Z" fill={accent ?? '#e1e9df'} />
          <Path d="M0-12-3-2 0 10 4-2ZM-8-2H8" fill="#fff4d3" fillOpacity=".3" strokeWidth=".75" />
        </>
      ) : null}
      {kind === 'links' ? (
        <>
          <Path d="M0 1C-15-12-16 13-4 8L0 3 4-2C16-7 15 18 0 5Z" fill="#a1b481" />
          <Path d="M-10-4-5 1M10 10 5 5" stroke="#e4d8aa" strokeWidth=".8" />
        </>
      ) : null}
      {kind === 'filter' ? (
        <>
          <Path d="M-10-3H10L3 5V11L-3 13V5Z" fill="#b5c7aa" />
          <Path
            d="M0-4Q-12-3-9-11Q-1-13 0-4ZM0-4Q12-3 9-11Q1-13 0-4ZM0-4Q-5-13 0-15Q5-13 0-4Z"
            fill={accent ?? '#9caf7c'}
          />
          <Circle cy="-5" r="2" fill="#d4b86e" />
        </>
      ) : null}
    </G>
  );
}
