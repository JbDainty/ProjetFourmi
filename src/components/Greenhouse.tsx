import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  Defs,
  LinearGradient,
  Pattern,
  Stop,
  Path,
  G,
  Ellipse,
  Circle,
  Line,
  Rect,
} from 'react-native-svg';

function GreenhouseBackdropDrawing({ onReady }: { onReady?: () => void }) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
    >
      <Image
        source={require('../../assets/illustrations/serre.png')}
        fadeDuration={0}
        onLoadEnd={onReady}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f8f3dc', opacity: 0.08 }]} />
    </View>
  );
}
function RackDefinitionsDrawing({ prefix }: { prefix: string }) {
  return (
    <Defs>
      <LinearGradient id={`${prefix}-wood-top`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#e1c491" />
        <Stop offset="0.4" stopColor="#c49a61" />
        <Stop offset="1" stopColor="#a67843" />
      </LinearGradient>
      <LinearGradient id={`${prefix}-wood-front`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#b18550" />
        <Stop offset="0.25" stopColor="#a0713f" />
        <Stop offset="1" stopColor="#78502e" />
      </LinearGradient>
      <LinearGradient id={`${prefix}-wood-post`}>
        <Stop offset="0" stopColor="#775234" />
        <Stop offset="0.45" stopColor="#b0834e" />
        <Stop offset="1" stopColor="#79502e" />
      </LinearGradient>
      <Pattern id={`${prefix}-grain`} patternUnits="userSpaceOnUse" width="140" height="16">
        <Path
          d="M0 2 Q34-1 74 3 T140 2 M-10 7 Q34 4 83 8 T150 7 M0 12 Q20 9 70 13 T140 12"
          fill="none"
          stroke="#563a25"
          strokeOpacity="0.22"
          strokeWidth="0.55"
        />
        <Path
          d="M5 5 Q29 7 58 5 M88 11 Q110 9 135 11"
          fill="none"
          stroke="#f5dba5"
          strokeOpacity="0.22"
          strokeWidth="0.6"
        />
      </Pattern>
    </Defs>
  );
}
type RackProps = {
  centers: number[];
  y: number;
  scale: number;
  width: number;
  prefix: string;
  front?: boolean;
};
function TubeRackDrawing({ centers, y, scale, width, prefix, front = false }: RackProps) {
  const left = Math.max(4, centers[0] - 35 * scale),
    right = Math.min(width - 4, centers.at(-1)! + 35 * scale),
    guide = y + 76 * scale,
    base = y + 168 * scale;
  const topPath = (at: number) =>
    `M${left + 5 * scale} ${at - 8 * scale} L${right - 5 * scale} ${at - 8 * scale} L${right} ${at} L${left} ${at}Z`;
  const holes = centers
    .map(
      (x) =>
        `M${x - 23 * scale} ${guide}H${x + 23 * scale}V${guide + 8 * scale}H${x - 23 * scale}Z`,
    )
    .join('');
  if (front)
    return (
      <G id={`tube-rack-front-${Math.round(y)}`} pointerEvents="none">
        <Path
          d={`M${left} ${guide}H${right}V${guide + 8 * scale}H${left}Z ${holes}`}
          fill={`url(#${prefix}-wood-front)`}
          fillRule="evenodd"
        />
        {centers.map((x, i) => (
          <Path
            key={i}
            d={`M${x - 25 * scale} ${guide - 3 * scale} A${25 * scale} ${4.6 * scale} 0 0 0 ${x + 25 * scale} ${guide - 3 * scale}`}
            fill="none"
            stroke="#ccaa76"
            strokeWidth={1.6 * scale}
          />
        ))}
        <Rect
          x={left}
          y={base}
          width={right - left}
          height={10 * scale}
          rx={1.5 * scale}
          fill={`url(#${prefix}-wood-front)`}
        />
        <Rect
          x={left + 1}
          y={base + 1}
          width={right - left - 2}
          height={8 * scale}
          fill={`url(#${prefix}-grain)`}
        />
        <Line
          x1={left + 2}
          x2={right - 2}
          y1={base + 1}
          y2={base + 1}
          stroke="#ebc995"
          strokeWidth={0.9 * scale}
          opacity="0.7"
        />
        {[left + 8 * scale, right - 8 * scale].map((x, i) => (
          <G key={i}>
            <Circle
              cx={x}
              cy={base + 5 * scale}
              r={2 * scale}
              fill="#c7aa71"
              stroke="#695033"
              strokeWidth="0.5"
            />
            <Line
              x1={x - scale}
              x2={x + scale}
              y1={base + 5 * scale}
              y2={base + 5 * scale}
              stroke="#78603b"
              strokeWidth="0.6"
            />
          </G>
        ))}
      </G>
    );
  return (
    <G id={`tube-rack-${Math.round(y)}`} pointerEvents="none">
      <Ellipse
        cx={(left + right) / 2}
        cy={base + 14 * scale}
        rx={(right - left) / 2 + 4}
        ry={4 * scale}
        fill="#24392b"
        opacity="0.17"
      />
      {[left + 4 * scale, right - 12 * scale].map((x, i) => (
        <G key={i}>
          <Rect
            x={x}
            y={guide - 7 * scale}
            width={8 * scale}
            height={base - guide + 9 * scale}
            rx={1.2 * scale}
            fill={`url(#${prefix}-wood-post)`}
          />
          <Line
            x1={x + 2 * scale}
            x2={x + 2 * scale}
            y1={guide + 3 * scale}
            y2={base - 4 * scale}
            stroke="#d4b17a"
            strokeWidth="0.55"
            opacity="0.6"
          />
        </G>
      ))}
      <Path
        d={topPath(base)}
        fill={`url(#${prefix}-wood-top)`}
        stroke="#815b34"
        strokeWidth="0.7"
      />
      <Path d={topPath(base)} fill={`url(#${prefix}-grain)`} />
      <Path
        d={topPath(guide)}
        fill={`url(#${prefix}-wood-top)`}
        stroke="#8e673c"
        strokeWidth="0.7"
      />
      <Path d={topPath(guide)} fill={`url(#${prefix}-grain)`} />
      {centers.map((x, i) => (
        <G key={i}>
          <Ellipse
            cx={x}
            cy={guide - 3 * scale}
            rx={25.5 * scale}
            ry={4.6 * scale}
            fill="#503d2a"
            stroke="#e3c795"
            strokeWidth={0.8 * scale}
          />
          <Ellipse
            cx={x}
            cy={base - 5 * scale}
            rx={20 * scale}
            ry={2.2 * scale}
            fill="#6c4a2e"
            opacity="0.48"
          />
        </G>
      ))}
    </G>
  );
}

export const GreenhouseBackdrop = React.memo(GreenhouseBackdropDrawing);
export const RackDefinitions = React.memo(RackDefinitionsDrawing);
export const TubeRack = React.memo(TubeRackDrawing);

/** Side rails make multiple holders a single grounded, two-tier bench stand. */
function RackStandDrawing({
  racks,
  width,
  scale,
  prefix,
}: {
  racks: { y: number }[];
  width: number;
  scale: number;
  prefix: string;
}) {
  if (racks.length < 2) return null;
  const top = racks[0].y + 68 * scale,
    bottom = racks.at(-1)!.y + 180 * scale;
  return (
    <G id="greenhouse-tier-stand" pointerEvents="none">
      {[5, width - 12 * scale].map((x, i) => (
        <G key={i}>
          <Rect
            x={x}
            y={top}
            width={7 * scale}
            height={bottom - top}
            rx={1.5 * scale}
            fill="#66735b"
          />
          <Line
            x1={x + scale}
            x2={x + scale}
            y1={top + 4}
            y2={bottom - 2}
            stroke="#c0ba86"
            strokeWidth="0.8"
            opacity="0.65"
          />
        </G>
      ))}
      {racks.slice(0, -1).map((r, i) => (
        <G key={i}>
          <Path
            d={`M${11 * scale} ${r.y + 179 * scale} l${18 * scale} ${20 * scale} M${width - 11 * scale} ${r.y + 179 * scale} l${-18 * scale} ${20 * scale}`}
            fill="none"
            stroke="#66735b"
            strokeWidth={3 * scale}
          />
        </G>
      ))}
      <Rect
        x="4"
        y={bottom - 4 * scale}
        width={width - 8}
        height={7 * scale}
        rx={1.5 * scale}
        fill={`url(#${prefix}-wood-front)`}
      />
    </G>
  );
}
export const RackStand = React.memo(RackStandDrawing);
