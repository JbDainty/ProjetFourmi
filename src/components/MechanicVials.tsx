import React from 'react';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { Mechanic, Rules } from '../engine/mechanics';
import { TubeInsignia } from './TubeInsignia';

/** The lesson uses the same physical fittings as the playable glass. */
export function MechanicVials({ mechanic }: { mechanic: Mechanic }) {
  const board = [[0, 1, 1, 1], []];
  const rules: Rules = {
    mechanics: [mechanic],
    ...(mechanic === 'mystery' ? { mystery: [0] } : {}),
    ...(mechanic === 'locks' ? { gates: [{ key: 0, tube: 1 }] } : {}),
    ...(mechanic === 'capacity' ? { capacities: [2, 3] } : {}),
    ...(mechanic === 'crystal' ? { crystals: [{ tube: 0, depth: 0, color: 1 }] } : {}),
    ...(mechanic === 'links' ? { links: [[0, 1] as [number, number]] } : {}),
    ...(mechanic === 'pipette' ? { pipettes: [0] } : {}),
    ...(mechanic === 'filter' ? { filters: [{ tube: 1, color: 1 }] } : {}),
    ...(mechanic === 'conservation' ? { collectors: [1] } : {}),
  };
  return (
    <Svg width={250} height={114} viewBox="0 0 250 114" accessible={false}>
      {[0, 1].map((tube) => {
        const scale = mechanic === 'capacity' ? (tube === 0 ? 0.46 : 0.52) : 0.58;
        return (
          <G
            key={tube}
            transform={`translate(${tube ? 196 : 54} ${102 - 160 * scale}) scale(${scale})`}
          >
            <Path
              d="M-24 9-23 137Q-23 160 0 160Q23 160 23 137L24 9Z"
              fill="#e9eddd"
              stroke="#758e7b"
              strokeWidth="1.4"
            />
            <Rect
              x="-18"
              y={tube ? 98 : 60}
              width="36"
              height={tube ? 45 : 83}
              rx="12"
              fill={mechanic === 'mystery' && !tube ? '#a397ad' : '#7e9f91'}
              fillOpacity=".75"
            />
            {!tube && mechanic === 'mystery' && (
              <SvgText y="112" textAnchor="middle" fontSize="24" fill="#fff6df">
                ?
              </SvgText>
            )}
            <Path d="M-24 9Q0 15 24 9M-17 20-17 132" stroke="#fff9e4" strokeWidth="2" fill="none" />
            <TubeInsignia board={board} rules={rules} tube={tube} unitScale={scale} />
          </G>
        );
      })}
      <Path
        d="M94 55Q125 32 156 55M146 44 156 55 143 60"
        fill="none"
        stroke="#8a9e6d"
        strokeWidth="1.8"
      />
    </Svg>
  );
}
