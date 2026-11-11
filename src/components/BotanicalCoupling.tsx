import React, { memo } from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';

/** A shared botanical clasp anchored to the rack, never a string across the board.
 * Its spring releases while either vial is being lifted for an ordinary pour. */
export const BotanicalCoupling = memo(function BotanicalCoupling({
  a,
  b,
  scale,
  focused = false,
  lifted = false,
  ready = true,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  scale: number;
  focused?: boolean;
  lifted?: boolean;
  ready?: boolean;
}) {
  if (Math.abs(a.y - b.y) > 1) return null;
  const left = Math.min(a.x, b.x),
    right = Math.max(a.x, b.x),
    middle = (left + right) / 2;
  const y = a.y + 147 * scale,
    span = (right - left) / scale;
  const half = Math.max(2, span / 2 - 18);
  const gold = focused ? '#c3a04e' : '#a38a50';
  return (
    <G
      testID="botanical-coupling"
      transform={`translate(${middle} ${y}) scale(${scale})`}
      pointerEvents="none"
    >
      {focused && <Ellipse cy="1" rx={half + 16} ry="16" fill="#f3db87" opacity=".25" />}
      <Path
        d={`M${-half} 0Q0 8 ${half} 0L${half} 7Q0 16 ${-half} 7Z`}
        fill="#577451"
        stroke={gold}
        strokeWidth="1.4"
      />
      <Path
        d={`M${-half} 2Q0 11 ${half} 2M${-half} 6Q0 14 ${half} 6`}
        fill="none"
        stroke="#dfcd91"
        strokeWidth=".8"
      />
      {[-1, 1].map((side) => (
        <G key={side} transform={`translate(${side * half} 0) scale(${side} 1)`}>
          <Path
            d={lifted ? 'M0 7Q-9 5-8-4L-5-9' : 'M0 7Q-10 5-9-5L-4-6Q-5 1 1 2Z'}
            fill="#bfa56d"
            stroke="#6d744a"
            strokeWidth="1"
          />
          <Path
            d="M-2 4Q-17 2-15-9Q-3-11-2 4ZM-2 4Q-10 2-12-6"
            fill="#849861"
            stroke="#d8cb91"
            strokeWidth=".8"
          />
          <Circle cx="-5" cy="7" r="1.3" fill="#e8d79e" />
        </G>
      ))}
      <Path d="M0-6 10 1 7 10 0 15-7 10-10 1Z" fill="#f0e1b5" stroke={gold} strokeWidth="1.1" />
      <Path
        d="M-6 5C-6-2 3 1 0 5C-3 9 6 12 6 5C6-2-3 1 0 5"
        fill="none"
        stroke={ready ? '#4d7656' : '#8e7754'}
        strokeWidth="1.6"
      />
      {focused && <Path d="M0-12 1-9 4-8 1-7 0-4-1-7-4-8-1-9Z" fill="#d3ad5c" />}
    </G>
  );
});
