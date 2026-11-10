import React, { useId } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useMeasuredSize } from './useMeasuredSize';
import { foliageSurfaces } from '../layout/foliage';
import Svg, { Defs, LinearGradient, Stop, Path, G, Circle } from 'react-native-svg';

type Props = { vitality?: number; scene?: boolean; compact?: boolean };
const blend = (a: string, b: string, t: number) =>
  '#' +
  [0, 1, 2]
    .map((i) =>
      Math.round(
        parseInt(a.slice(1 + i * 2, 3 + i * 2), 16) * (1 - t) +
          parseInt(b.slice(1 + i * 2, 3 + i * 2), 16) * t,
      )
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
/** Responsive marginal foliage. Decorative only: it never intercepts a touch. */
function FoliageFrameDrawing({ vitality = 0.65, scene = false, compact = false }: Props) {
  const { ref, size, onLayout } = useMeasuredSize(undefined, true);
  const token = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const { width: w, height: h } = size,
    life = Math.max(0, Math.min(1, vitality));
  const ink = blend('#9b8966', '#52704d', life),
    leaf = blend('#c1ae83', '#8ca879', life),
    light = blend('#e0cfa7', '#c1ce9b', life);
  const leafId = `folio-leaf-${token}`;
  const leaves: { x: number; y: number; angle: number; scale: number }[] = [];
  if (w && h && compact) {
    // A toolbar needs a shallow border: page-sized corner flourishes intersected
    // one another and crossed the button labels when the paper was only 60–80 high.
    const pairs = Math.max(2, Math.floor((w - 48) / 70));
    for (let i = 0; i < pairs; i++) {
      const x = 26 + ((i + 0.5) * (w - 52)) / pairs;
      leaves.push(
        { x, y: 12, angle: -25, scale: 0.55 },
        { x: w - x, y: h - 12, angle: 155, scale: 0.55 },
      );
    }
    for (const y of [20, h - 20])
      leaves.push({ x: 9, y, angle: -60, scale: 0.6 }, { x: w - 9, y, angle: 60, scale: 0.6 });
  } else if (w && h) {
    const vertical = Math.max(1, Math.floor((h - 88) / 49)),
      horizontal = Math.max(1, Math.floor((w - 88) / 58));
    for (let i = 0; i < vertical; i++) {
      const y = 49 + ((i + 0.45) * (h - 98)) / vertical;
      leaves.push(
        {
          x: 12.5 + Math.sin(i * 1.7) * 1.2,
          y,
          angle: -63 + (i % 3) * 5,
          scale: 0.73 + (i % 2) * 0.12,
        },
        {
          x: w - 12.5 - Math.sin(i * 1.5),
          y: y + 7,
          angle: 62 - (i % 3) * 5,
          scale: 0.77 + (i % 2) * 0.1,
        },
      );
      if (i % 2 === 0)
        leaves.push(
          { x: 12, y: y + 14, angle: 36, scale: 0.57 },
          { x: w - 12, y: y + 21, angle: -35, scale: 0.55 },
        );
    }
    for (let i = 0; i < horizontal; i++) {
      const x = 50 + ((i + 0.4) * (w - 100)) / horizontal;
      leaves.push(
        { x, y: 12, angle: -25 + (i % 2) * 18, scale: 0.7 },
        { x: x + 5, y: h - 12, angle: 153 + (i % 2) * 15, scale: 0.72 },
      );
    }
  }
  const cluster = (x: number, y: number, angle: number, key: string) => (
    <G key={key} transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path
        d="M-16 14 C-9 7-5-1 6-9 Q15-16 21-8 Q25-2 19 0"
        fill="none"
        stroke={ink}
        strokeWidth="0.7"
        opacity="0.75"
      />
      {[
        [-7, 5, -65, 0.83],
        [1, -3, -17, 0.88],
        [10, -10, 33, 0.72],
        [17, -10, 90, 0.6],
      ].map(([lx, ly, a, s], i) => (
        <G key={i} transform={`translate(${lx} ${ly}) rotate(${a}) scale(${s})`}>
          <Path
            d="M0 0 C-6-3-6-10-2-16 C1-12 8-6 0 0Z"
            fill={`url(#${leafId})`}
            stroke={ink}
            strokeWidth="0.5"
          />
          <Path
            d="M0-1 Q-1-8-2-14 M-1-6-4-9 M-1-8 2-11"
            fill="none"
            stroke={ink}
            strokeWidth="0.45"
            opacity="0.65"
          />
        </G>
      ))}
      <Circle cx="19" cy="0" r="1" fill="#b5a06a" opacity="0.7" />
    </G>
  );
  return (
    <View
      nativeID={`botanical-foliage-frame-${token}`}
      testID="botanical-foliage-frame"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, { zIndex: scene ? 3 : 0 }]}
      ref={ref}
      collapsable={false}
      onLayout={onLayout}
    >
      {foliageSurfaces(w, h, Platform.OS !== 'web').map((surface, surfaceIndex) => (
        <Svg
          key={surfaceIndex}
          width={surface.width}
          height={surface.height}
          viewBox={`${surface.x} ${surface.y} ${surface.width} ${surface.height}`}
          style={{ position: 'absolute', left: surface.x, top: surface.y }}
          pointerEvents="none"
          opacity={scene ? 0.78 : 1}
        >
          <Defs>
            <LinearGradient id={leafId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={light} />
              <Stop offset="0.55" stopColor={leaf} />
              <Stop offset="1" stopColor={ink} stopOpacity="0.65" />
            </LinearGradient>
          </Defs>
          <Path
            d={
              compact
                ? `M24 8 C${w * 0.3} 6 ${w * 0.35} 10 ${w * 0.5} 8 S${w * 0.75} 10 ${w - 24} 8 Q${w - 8} 7 ${w - 8} 22 L${w - 8} ${h - 22} Q${w - 7} ${h - 8} ${w - 24} ${h - 8} C${w * 0.7} ${h - 6} ${w * 0.65} ${h - 10} ${w * 0.5} ${h - 8} S${w * 0.25} ${h - 10} 24 ${h - 8} Q8 ${h - 7} 8 ${h - 22} L8 22 Q7 8 24 8Z`
                : `M42 12 C${w * 0.28} 9 ${w * 0.35} 15 ${w * 0.5} 12 S${w * 0.77} 15 ${w - 42} 12 Q${w - 11} 9 ${w - 12} 42 C${w - 15} ${h * 0.3} ${w - 9} ${h * 0.36} ${w - 12} ${h * 0.5} S${w - 10} ${h * 0.76} ${w - 12} ${h - 42} Q${w - 9} ${h - 11} ${w - 42} ${h - 12} C${w * 0.73} ${h - 15} ${w * 0.65} ${h - 9} ${w * 0.5} ${h - 12} S${w * 0.23} ${h - 10} 42 ${h - 12} Q9 ${h - 9} 12 ${h - 42} C15 ${h * 0.73} 9 ${h * 0.65} 12 ${h * 0.5} S10 ${h * 0.23} 12 42 Q9 11 42 12Z`
            }
            fill="none"
            stroke={ink}
            strokeWidth="0.85"
            opacity="0.62"
          />
          {leaves
            .filter(
              (p) =>
                p.x + 22 >= surface.x &&
                p.x - 22 <= surface.x + surface.width &&
                p.y + 22 >= surface.y &&
                p.y - 22 <= surface.y + surface.height,
            )
            .map((p, i) => (
              <G
                key={i}
                transform={`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(${p.scale})`}
              >
                <Path
                  d="M0 0 C-5-3-7-9-2-16 C2-11 7-6 0 0Z"
                  fill={`url(#${leafId})`}
                  stroke={ink}
                  strokeWidth="0.5"
                  opacity="0.91"
                />
                <Path
                  d="M0-1 Q-1-8-2-14 M-1-5-4-8 M-1-9 2-11"
                  fill="none"
                  stroke={ink}
                  strokeWidth="0.4"
                  opacity="0.58"
                />
              </G>
            ))}
          {!compact &&
            [
              { x: 24, y: 24, angle: 0, key: 'tl' },
              { x: w - 24, y: 24, angle: 90, key: 'tr' },
              { x: w - 24, y: h - 24, angle: 180, key: 'br' },
              { x: 24, y: h - 24, angle: 270, key: 'bl' },
            ]
              .filter(
                (p) =>
                  p.x + 40 >= surface.x &&
                  p.x - 40 <= surface.x + surface.width &&
                  p.y + 40 >= surface.y &&
                  p.y - 40 <= surface.y + surface.height,
              )
              .map((p) => cluster(p.x, p.y, p.angle, p.key))}
        </Svg>
      ))}
    </View>
  );
}
export const FoliageFrame = React.memo(FoliageFrameDrawing);
