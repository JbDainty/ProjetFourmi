import { RuleMark } from './RuleMark';
import { capacity, completeTube, blocked, crystalOpen } from '../engine/puzzle';
import type { Rules } from '../engine/mechanics';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View, Pressable } from 'react-native';
import { framePlayback } from '../animation/framePlayback';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  G,
  Ellipse,
  Circle,
  Line,
  Text as SvgText,
  ClipPath,
  Rect,
} from 'react-native-svg';
import { liquidBoardLayout } from '../layout/liquidBoard';
import { type Board, type Move, pour } from '../engine/puzzle';
import { palette, symbols, colorNames } from '../data/botany';
import { C } from './ui';
import { FoliageFrame } from './FoliageFrame';
import { F } from './fonts';
import { GreenhouseBackdrop, RackDefinitions, TubeRack, RackStand } from './Greenhouse';
import { TubeBloom } from './TubeBloom';
import type { TubeReward } from '../animation/tubeReward';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import {
  type Point,
  INNER,
  GLASS_HEIGHT,
  MOUTH_Y,
  clip,
  polygonPath,
  layers,
  drain,
  receive,
  surfacePlane,
  contactAngle,
  rotate,
  samplePour,
  timeline,
  colorMix,
  mix,
} from '../animation/liquid';

type Props = {
  board: Board;
  rules?: Rules;
  known?: boolean[][];
  selected: number | null;
  hint: Move | null;
  pouring: Move | null;
  disabled: boolean;
  motion: boolean;
  patterns: boolean;
  integrated?: boolean;
  initialWidth?: number;
  maxHeight?: number;
  onTap: (index: number) => void;
  onFinish: () => void;
  reward?: TubeReward | null;
  onRewardDone?: (id: number) => void;
};
type Pose = { x: number; y: number; angle: number; scale: number };
const emptySample = samplePour(0, 1);
function LiquidBoardDrawing({
  board,
  rules,
  known,
  selected,
  hint,
  pouring,
  disabled,
  motion,
  patterns,
  integrated = false,
  initialWidth = 0,
  maxHeight,
  onTap,
  onFinish,
  reward,
  onRewardDone,
}: Props) {
  usePrimaryAnimation(!!pouring);
  const [measuredWidth, setWidth] = useState(Math.round(initialWidth)),
    [elapsed, setElapsed] = useState(0);
  const width =
    maxHeight !== undefined && initialWidth > 0 ? Math.round(initialWidth) : measuredWidth;
  const animationMove = useRef<Move | null>(null);
  const tap = useRef(onTap);
  tap.current = onTap;
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const rewardFinished = useRef(onRewardDone);
  rewardFinished.current = onRewardDone;
  const rewardId = reward?.id;
  const finishReward = useCallback(() => {
    if (rewardId !== undefined) rewardFinished.current?.(rewardId);
  }, [rewardId]);
  const unique = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string, active = false) =>
    `liquid-${unique}-${active ? 'active' : 'still'}-${name}`;
  const fitted = useMemo(
    () => (maxHeight !== undefined ? liquidBoardLayout(width, maxHeight, board.length) : null),
    [width, maxHeight, board.length],
  );
  const compact = board.length > 7;
  const scale = fitted?.scale ?? Math.min(1, width / 290) * (compact ? 0.88 : 1);
  const columns =
    fitted?.columns ??
    Math.min(
      board.length,
      Math.max(2, Math.floor(width / (compact ? 55 : Math.max(54, 66 * scale)))),
    );
  const rowHeight = fitted?.rowHeight ?? GLASS_HEIGHT * scale + 36;
  const top = fitted?.top ?? 90 * scale;
  const rows = fitted?.rows ?? Math.ceil(board.length / columns);
  const height = fitted?.height ?? top + rows * rowHeight + 4;
  const layout = useMemo(
    () =>
      fitted?.positions ??
      board.map((_, i) => {
        const row = Math.floor(i / columns),
          col = i % columns,
          n = Math.min(columns, board.length - row * columns),
          spacing = width / columns;
        return { x: (width - n * spacing) / 2 + (col + 0.5) * spacing, y: top + row * rowHeight };
      }),
    [board.length, columns, width, top, rowHeight, maxHeight],
  );
  const racks = useMemo(
    () =>
      Array.from({ length: rows }, (_, row) => {
        const n = Math.min(columns, board.length - row * columns),
          spacing = width / columns;
        return {
          centers: Array.from(
            { length: n },
            (_, col) => (width - n * spacing) / 2 + (col + 0.5) * spacing,
          ),
          y: top + row * rowHeight,
        };
      }),
    [width, scale, rows, columns, board.length, rowHeight, top],
  );
  const baseLayers = useMemo(() => board.map((t, i) => layers(t, known?.[i])), [board, known]);
  const after = useMemo(
    () => (pouring ? pour(board, pouring.from, pouring.to, rules) : null),
    [board, pouring, rules],
  );
  const count = pouring && after ? board[pouring.from].length - after[pouring.from].length : 0;
  const color = pouring ? (board[pouring.from].at(-1) ?? 0) : 0;
  const state = pouring
    ? samplePour(animationMove.current === pouring ? elapsed : 0, count)
    : emptySample;
  useEffect(() => {
    if (!pouring || !width) return;
    animationMove.current = pouring;
    setElapsed(0);
    const playback = framePlayback({
      duration: motion ? timeline(count).duration : 0,
      fps: 60,
      now: () => performance.now(),
      request: (callback) => requestAnimationFrame(callback),
      cancel: (id) => cancelAnimationFrame(id),
      onFrame: setElapsed,
      onFinish: () => finish.current(),
    });
    playback.setActive(
      AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
    );
    const subscription = AppState.addEventListener('change', (status) =>
      playback.setActive(status === 'active'),
    );
    return () => {
      subscription.remove();
      playback.dispose();
    };
  }, [pouring, width, motion, count]);
  const time = motion && pouring ? elapsed / 1000 : 0;
  const poses: Pose[] = layout.map((p, i) => ({
    ...p,
    y:
      p.y +
      160 * scale * (1 - Math.cbrt(capacity(rules, i) / 4)) -
      (selected === i && !pouring ? 10 * scale : 0),
    scale: scale * Math.cbrt(capacity(rules, i) / 4),
    angle: 0,
  }));
  let spout: Point | null = null,
    landing: Point | null = null;
  if (pouring && width && layout[pouring.to]) {
    const source = poses[pouring.from],
      target = poses[pouring.to],
      direction = target.x >= width / 2 ? 1 : -1;
    const units = board[pouring.from].length - count * state.sent;
    const angle =
      contactAngle((units * 4) / capacity(rules, pouring.from)) *
      direction *
      (1 - state.settling * 0.09);
    const lip = rotate({ x: direction * 20 * source.scale, y: 12 * source.scale }, angle);
    const hold = { x: target.x - lip.x, y: target.y + MOUTH_Y * target.scale - 45 * scale - lip.y };
    const approach = state.approach;
    const elevated = {
      x: mix(source.x, hold.x, approach),
      y:
        mix(source.y - mix(10, 94, state.extraction) * scale, hold.y, approach) +
        Math.sin(approach * Math.PI) * 6 * scale,
    };
    poses[pouring.from] = {
      x: mix(elevated.x, source.x, state.returnTravel),
      y: mix(elevated.y, source.y - 94 * scale, state.returnTravel) + 94 * scale * state.insertion,
      angle: angle * approach * (1 - state.returnTravel),
      scale: source.scale,
    };
    const actualLip = rotate(
      { x: direction * 20 * source.scale, y: 12 * source.scale },
      poses[pouring.from].angle,
    );
    spout = { x: poses[pouring.from].x + actualLip.x, y: poses[pouring.from].y + actualLip.y };
    landing = {
      x: target.x,
      y:
        target.y +
        surfacePlane(
          ((board[pouring.to].length + count * state.arrived) * 4) / capacity(rules, pouring.to),
          0,
        ) *
          target.scale,
    };
  }
  const front = (i: number, activeLayer = false) => {
    const p = poses[i],
      scale = p.scale,
      active = selected === i,
      marked = hint?.from === i || hint?.to === i;
    return (
      <G
        key={`glass${i}`}
        transform={`translate(${p.x} ${p.y}) rotate(${(p.angle * 180) / Math.PI}) scale(${scale})`}
      >
        <Path
          d="M-24 9 L-23 137 Q-23 160 0 160 Q23 160 23 137 L24 9"
          fill="none"
          stroke={marked ? C.gold : active ? '#638c83' : '#79918d'}
          strokeWidth={Math.max(
            marked || active ? 1.5 : 0.95,
            fitted ? (marked || active ? 0.95 : 0.7) / scale : 0,
          )}
          strokeOpacity="0.9"
        />
        <Path
          d="M-18 20 L-17 132 Q-17 147-7 151"
          fill="none"
          stroke="#fffdf0"
          strokeWidth="3.6"
          strokeOpacity="0.57"
          strokeLinecap="round"
        />
        <Path d="M19 26 18 137" fill="none" stroke="#fff9e6" strokeWidth="1" strokeOpacity="0.53" />
        <Ellipse
          cx="0"
          cy="9"
          rx="25"
          ry="3.8"
          fill={`url(#${id('rim', activeLayer)})`}
          stroke="#82948a"
          strokeWidth="0.9"
        />
        <Ellipse
          cx="0"
          cy="9"
          rx="20.5"
          ry="2.2"
          fill="#f7efdb"
          fillOpacity="0.42"
          stroke="#fdf9eb"
          strokeWidth="0.7"
        />
        {Array.from({ length: capacity(rules, i) }, (_, tick) => (
          <Line
            key={tick}
            x1="17"
            x2="21"
            y1={36 + tick * (116 / capacity(rules, i))}
            y2={36 + tick * (116 / capacity(rules, i))}
            stroke="#faf8df"
            strokeOpacity="0.56"
            strokeWidth="0.8"
          />
        ))}
      </G>
    );
  };
  const renderTube = (i: number, activeLayer = false) => {
    const p = poses[i],
      scale = p.scale,
      moving = pouring?.from === i,
      target = pouring?.to === i;
    const stock = moving
      ? drain(baseLayers[i], count * state.sent)
      : target
        ? receive(baseLayers[i], color, count * state.arrived)
        : baseLayers[i];
    // Brief viscous lag during acceleration; it settles towards a horizontal plane.
    const inertia = moving
      ? Math.sin(state.approach * Math.PI) * 0.035 - Math.sin(state.returning * Math.PI) * 0.045
      : 0;
    const fluidAngle = p.angle - inertia;
    // Adjacent layers share a boundary; solve its height only once per drawing.
    const planes = new Map<number, number>();
    const plane = (units: number) => {
      let found = planes.get(units);
      if (found === undefined) {
        found = surfacePlane((units * 4) / capacity(rules, i), fluidAngle);
        planes.set(units, found);
      }
      return found;
    };
    let lower = 0;
    const total = stock.reduce((n, l) => n + l.units, 0),
      surface = plane(total);
    const pieces = stock.map((layer, j) => {
      const polygon =
        layer.units < 0.0001
          ? []
          : clip(
              clip(INNER, fluidAngle, plane(lower + layer.units)),
              fluidAngle,
              plane(lower),
              false,
            );
      lower += layer.units;
      const d = polygonPath(polygon);
      return { layer, d, polygon, j };
    });
    const receiving = target && state.arrived > 0 && state.arrived < 1;
    const wave =
      (motion ? 0.65 : 0) + (receiving ? 1.5 : target ? 1.2 * Math.exp(-state.settling * 5) : 0);
    const levelComplete = completeTube(board, i, rules) && !moving;
    return (
      <G
        key={`tube${i}`}
        id={moving ? 'pouring-vessel' : undefined}
        transform={`translate(${p.x} ${p.y}) rotate(${(p.angle * 180) / Math.PI}) scale(${scale})`}
      >
        <Path
          d="M-24 10 L-23 137 Q-23 160 0 160 Q23 160 23 137 L24 10Z"
          fill={`url(#${id('glass', activeLayer)})`}
        />
        <G clipPath={`url(#${id('inside', activeLayer)})`}>
          {pieces.map(({ layer, d, polygon, j }) => {
            const center = polygon.length
              ? {
                  x: polygon.reduce((a, b) => a + b.x, 0) / polygon.length,
                  y: polygon.reduce((a, b) => a + b.y, 0) / polygon.length,
                }
              : { x: 0, y: 0 };
            return (
              <G key={j}>
                <Path
                  d={d}
                  fill={
                    layer.hidden ? '#a397ad' : `url(#${id(`pigment${layer.color}`, activeLayer)})`
                  }
                  fillOpacity="0.96"
                />
                <Path
                  d={d}
                  fill={`url(#${id(`sheen${layer.color}`, activeLayer)})`}
                  opacity={layer.hidden ? 0 : 0.32}
                />
                {layer.units > 0.35 &&
                  [0, 1, 2].map((k) => {
                    const py =
                      center.y + Math.sin(time * 0.55 + k * 2 + i) * Math.min(9, layer.units * 7);
                    return (
                      <Circle
                        key={k}
                        cx={-11 + k * 10 + Math.sin(i + k) * 2}
                        cy={py}
                        r={k === 1 ? 0.95 : 0.55}
                        fill="#fff0b4"
                        opacity={0.12 + (0.18 * (1 + Math.sin(time * 0.8 + k + i))) / 2}
                      />
                    );
                  })}
                {(patterns || layer.hidden) && layer.units > 0.3 && (
                  <SvgText
                    x={center.x}
                    y={center.y + 4}
                    textAnchor="middle"
                    fill="#fff8e9"
                    fontSize={fitted ? Math.max(16, 8 / scale) : 16}
                    fontFamily={F.bold}
                  >
                    {layer.hidden ? '?' : symbols[layer.color]}
                  </SvgText>
                )}
              </G>
            );
          })}
          {total > 0.01 && (
            <G transform={`rotate(${(-fluidAngle * 180) / Math.PI})`}>
              <Path
                d={`M-180 ${surface} Q0 ${surface - 2 - wave * Math.sin(time * 2.3 + i)} 180 ${surface}`}
                fill="none"
                stroke={colorMix(palette[stock.at(-1)!.color], '#fff0bf', 0.6)}
                strokeWidth="1.1"
                opacity="0.82"
              />
            </G>
          )}
          {target && state.arrived > 0 && (
            <G opacity={receiving ? 0.5 : 0.45 * (1 - state.settling)}>
              <Ellipse
                cx="0"
                cy={surface + 1}
                rx={6 + (7 * (1 + Math.sin(time * 6))) / 2}
                ry="1.7"
                fill="none"
                stroke="#fff5cd"
                strokeWidth="0.8"
              />
              <Ellipse
                cx="0"
                cy={surface + 6}
                rx="2.1"
                ry="3"
                fill="none"
                stroke="#fff7d9"
                strokeOpacity="0.5"
                strokeWidth="0.65"
              />
            </G>
          )}
        </G>
        {levelComplete && (
          <G opacity="0.9" transform="translate(17 15)">
            <Circle cx="0" cy="169" r="5.4" fill="#e8e6c6" />
            <Path
              d="M-3 169-1 171 3 166"
              stroke="#507f6f"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />
          </G>
        )}
      </G>
    );
  };
  const stream = () => {
    if (!spout || !landing || state.head <= state.tail || !pouring) return null;
    const point = (t: number) => ({
      x:
        mix(spout!.x, landing!.x, t) +
        Math.sin(t * Math.PI) * Math.sin(time * 4 + t * 6) * 0.8 * scale,
      y: mix(spout!.y, landing!.y, t),
    });
    const points = Array.from({ length: 13 }, (_, i) => point(mix(state.tail, state.head, i / 12)));
    const path = 'M' + points.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('L');
    const thick = (2.3 + 1.7 * Math.sin(Math.PI * state.flow)) * scale;
    return (
      <G pointerEvents="none">
        <Path
          d={path}
          stroke={palette[color]}
          strokeWidth={thick + 5 * scale}
          strokeOpacity="0.12"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          id="pour-jet"
          d={path}
          stroke={`url(#${id(`jet${color}`, true)})`}
          strokeWidth={thick}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={path}
          transform={`translate(${-scale * 0.65} 0)`}
          stroke="#fff6ce"
          strokeOpacity="0.52"
          strokeWidth={scale * 0.7}
          fill="none"
          strokeLinecap="round"
        />
        {[0, 1, 2].map((k) => {
          const t = (time * 1.9 + k * 0.33) % 1;
          if (t < state.tail || t > state.head) return null;
          const dot = point(t);
          return (
            <Ellipse
              key={k}
              cx={dot.x}
              cy={dot.y}
              rx={1.6 * scale}
              ry={3.2 * scale}
              fill={colorMix(palette[color], '#ffe7c2', 0.25)}
              opacity="0.8"
            />
          );
        })}
        {state.head < 1 && (
          <Ellipse
            cx={points.at(-1)!.x}
            cy={points.at(-1)!.y}
            rx={thick * 0.68}
            ry={thick * 1.3}
            fill={palette[color]}
          />
        )}
      </G>
    );
  };
  const definitions = (activeLayer: boolean) => (
    <>
      <RackDefinitions prefix={id('rack', activeLayer)} />
      <Defs>
        <ClipPath id={id('inside', activeLayer)}>
          <Path d={polygonPath(INNER)} />
        </ClipPath>
        <LinearGradient id={id('glass', activeLayer)} x1="0" x2="1">
          <Stop offset="0" stopColor="#9ab9b0" stopOpacity="0.13" />
          <Stop offset="0.28" stopColor="#ffffff" stopOpacity="0.2" />
          <Stop offset="0.64" stopColor="#fff6df" stopOpacity="0.02" />
          <Stop offset="1" stopColor="#8caa9d" stopOpacity="0.18" />
        </LinearGradient>
        <LinearGradient id={id('rim', activeLayer)} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#fffcf0" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#a5b5a6" stopOpacity="0.45" />
        </LinearGradient>
        {palette.map((base, c) => (
          <React.Fragment key={c}>
            <LinearGradient id={id(`pigment${c}`, activeLayer)} x1="0" x2="1">
              <Stop offset="0" stopColor={colorMix(base, '#182d3b', 0.36)} />
              <Stop offset="0.24" stopColor={base} />
              <Stop offset="0.5" stopColor={colorMix(base, '#ffdfac', 0.16)} />
              <Stop offset="0.78" stopColor={base} />
              <Stop offset="1" stopColor={colorMix(base, '#19223d', 0.3)} />
            </LinearGradient>
            <LinearGradient id={id(`sheen${c}`, activeLayer)} x1="0" y1="0" x2="0.8" y2="1">
              <Stop offset="0" stopColor="#fff2cf" stopOpacity="0.55" />
              <Stop offset="0.35" stopColor={base} stopOpacity="0" />
              <Stop offset="0.8" stopColor={colorMix(base, '#b89ee5', 0.35)} stopOpacity="0.1" />
              <Stop offset="1" stopColor="#fff4d0" stopOpacity="0.4" />
            </LinearGradient>
            <LinearGradient id={id(`jet${c}`, activeLayer)} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colorMix(base, '#1f2440', 0.15)} />
              <Stop offset="0.5" stopColor={colorMix(base, '#fff0cd', 0.25)} />
              <Stop offset="1" stopColor={base} />
            </LinearGradient>
            <RadialGradient id={id(`glow${c}`, activeLayer)}>
              <Stop offset="0" stopColor={base} stopOpacity="0.2" />
              <Stop offset="0.65" stopColor={base} stopOpacity="0.06" />
              <Stop offset="1" stopColor={base} stopOpacity="0" />
            </RadialGradient>
          </React.Fragment>
        ))}
      </Defs>
    </>
  );
  const stillDefinitions = useMemo(() => definitions(false), [unique]);
  const activeDefinitions = useMemo(() => definitions(true), [unique]);
  const stillScene = useMemo(
    () => (
      <Svg
        id="liquid-scene"
        style={{ position: 'relative', zIndex: 1 }}
        pointerEvents="none"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {stillDefinitions}
        {layout.map((p, i) => (
          <G key={`aura${i}`}>
            {board[i].length > 0 && (
              <Ellipse
                cx={p.x}
                cy={p.y + 104 * scale}
                rx={38 * scale}
                ry={82 * scale}
                fill={`url(#${id(`glow${board[i].at(-1)}`)})`}
                opacity={0.65 + 0.2 * Math.sin(time * 0.8 + i)}
              />
            )}
          </G>
        ))}
        <RackStand racks={racks} width={width} scale={scale} prefix={id('rack')} />
        {racks.map((rack, i) => (
          <TubeRack
            key={`rack-back-${i}`}
            {...rack}
            width={width}
            scale={scale}
            prefix={id('rack')}
          />
        ))}
        {board.map((_, i) => (pouring?.from === i || pouring?.to === i ? null : renderTube(i)))}
        {board.map((_, i) => (pouring?.from === i || pouring?.to === i ? null : front(i)))}
        {racks.map((rack, i) => (
          <TubeRack
            key={`rack-front-${i}`}
            {...rack}
            width={width}
            scale={scale}
            prefix={id('rack')}
            front
          />
        ))}
        {rules?.links?.map(([a, b], i) => (
          <Path
            key={`link-${i}`}
            d={`M${layout[a].x} ${layout[a].y + 165 * scale} Q${width / 2} ${Math.max(layout[a].y, layout[b].y) + 190 * scale} ${layout[b].x} ${layout[b].y + 165 * scale}`}
            fill="none"
            stroke="#779767"
            strokeWidth="1.6"
            strokeDasharray="3 3"
          />
        ))}
        {layout.map((p, i) => (
          <G key={`label-${i}`}>
            {!!rules?.mechanics.length && (
              <G transform={`translate(${p.x} ${p.y + 150 * scale})`}>
                {rules.filters
                  ?.filter((f) => f.tube === i)
                  .map((f) => (
                    <Circle
                      key="filter"
                      cy={-132 * Math.cbrt(capacity(rules, i) / 4) * scale}
                      r={7}
                      fill={palette[f.color]}
                      stroke="#f9edca"
                      strokeWidth="1.5"
                    />
                  ))}
                <G
                  transform={`translate(0 ${-125 * Math.cbrt(capacity(rules, i) / 4) * scale}) scale(${Math.max(0.7, scale * 0.7)})`}
                >
                  <RuleMark
                    kind={
                      blocked(board, i, rules)
                        ? 'lock'
                        : rules.gates?.some((g) => g.key === i)
                          ? 'brush'
                          : rules.pipettes?.includes(i)
                            ? 'pipette'
                            : rules.collectors?.includes(i)
                              ? 'conservation'
                              : ''
                    }
                  />
                </G>
                {rules.crystals
                  ?.filter((c) => c.tube === i && !crystalOpen(board, c.color, rules))
                  .map((c) => (
                    <G key="crystal">
                      <Circle
                        cy={-20 * scale}
                        r={10}
                        fill="#e9e9df"
                        stroke={palette[c.color]}
                        strokeWidth="2"
                      />
                      <SvgText
                        y={-20 * scale + 5}
                        textAnchor="middle"
                        fontSize="15"
                        fill={palette[c.color]}
                      >
                        ◇
                      </SvgText>
                    </G>
                  ))}
                {capacity(rules, i) !== 4 && (
                  <G transform={`translate(0 ${-42 * scale})`}>
                    <Circle r="7" fill="#eee3c4" stroke="#849875" />
                    <SvgText y="4" textAnchor="middle" fontSize="11" fill="#48644a">
                      {capacity(rules, i)}
                    </SvgText>
                  </G>
                )}
              </G>
            )}
            <Rect
              x={p.x - (fitted ? 12 : 11 * scale)}
              y={fitted ? p.y + 180 * scale + 3 : p.y + 181 * scale}
              width={fitted ? 24 : 22 * scale}
              height={fitted ? 14 : 14 * scale}
              rx={2 * scale}
              fill="#f5e7c8"
              fillOpacity="0.96"
              stroke="#997d4c"
              strokeWidth="0.5"
            />
            <SvgText
              x={p.x}
              y={fitted ? p.y + 180 * scale + 13 : p.y + 191 * scale}
              fill={hint?.from === i || hint?.to === i ? '#8b5f29' : '#324b3d'}
              textAnchor="middle"
              fontSize={fitted ? 10 : 10 * scale}
              fontFamily={F.medium}
              letterSpacing="1"
            >
              {String(i + 1).padStart(2, '0')}
            </SvgText>
          </G>
        ))}
      </Svg>
    ),
    [
      width,
      height,
      scale,
      maxHeight,
      board,
      selected,
      hint,
      pouring,
      patterns,
      racks,
      layout,
      stillDefinitions,
      rules,
      known,
    ],
  );
  const touchTargets = useMemo(
    () =>
      layout.map((p, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={`Flacon ${i + 1}, ${board[i].length ? board[i].map((c, j) => (known?.[i]?.[j] === false ? 'teinte mystère' : colorNames[c].toLocaleLowerCase('fr'))).join(', ') : 'vide'}`}
          accessibilityHint={
            rules
              ? `Capacité ${capacity(rules, i)}. ${blocked(board, i, rules) ? 'Fiole verrouillée. ' : ''}${rules.collectors?.includes(i) ? 'Reçoit seulement. ' : ''}${rules.pipettes?.includes(i) ? 'Verse une mesure. ' : ''}`
              : undefined
          }
          accessibilityState={{ selected: selected === i, disabled }}
          disabled={disabled}
          onPress={() => tap.current(i)}
          style={{
            position: 'absolute',
            zIndex: 2,
            left: p.x - Math.max(44, 56 * scale) / 2,
            top: p.y - (fitted ? 6 : 12) * scale,
            width: Math.max(44, 56 * scale),
            height: fitted ? 186 * scale + 18 : 190 * scale,
            minWidth: 44,
            minHeight: 44,
          }}
        />
      )),
    [layout, board, known, rules, selected, disabled, scale, maxHeight],
  );
  return (
    <View
      testID={pouring ? 'liquid-board-pouring' : 'liquid-board-idle'}
      style={{
        width: '100%',
        height: width ? height : 260,
        overflow: 'hidden',
        borderRadius: 24,
        borderWidth: 0,
        backgroundColor: integrated ? 'transparent' : '#dbe3cf',
      }}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        if (next && next !== width) setWidth(next);
      }}
    >
      {!integrated && <GreenhouseBackdrop />}
      {!integrated && <FoliageFrame scene />}
      {!!width && (
        <>
          {stillScene}
          {pouring && (
            <Svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
              pointerEvents="none"
            >
              {activeDefinitions}
              {renderTube(pouring.to, true)}
              {front(pouring.to, true)}
              {stream()}
              {racks
                .filter((_, row) => row === Math.floor(pouring.to / columns))
                .map((rack, row) => (
                  <TubeRack
                    key={row}
                    {...rack}
                    width={width}
                    scale={scale}
                    prefix={id('rack', true)}
                    front
                  />
                ))}
              {renderTube(pouring.from, true)}
              {front(pouring.from, true)}
            </Svg>
          )}
          {reward && layout[reward.tube] && (
            <TubeBloom
              key={reward.id}
              color={reward.color}
              motion={motion}
              x={layout[reward.tube].x}
              y={layout[reward.tube].y}
              scale={scale}
              onDone={finishReward}
            />
          )}
          {touchTargets}
        </>
      )}
    </View>
  );
}
export const LiquidBoard = React.memo(LiquidBoardDrawing);
