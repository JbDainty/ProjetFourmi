/** Small, deterministic 2-D free-surface model for sealed pigment layers.
 * Cross-section area is conserved; gravity stays vertical when glass rotates.
 * This is an illustration model, not a general-purpose fluid solver.
 */
export type Point = { x: number; y: number };
export type Layer = { color: number; units: number; hidden?: boolean };
export const GLASS_HEIGHT = 160;
export const MOUTH_Y = 10;
export const INNER_HALF_WIDTH = 20;
export const CAPACITY = 4;
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const rotate = (p: Point, angle: number): Point => ({
  x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
  y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
});
export const INNER: Point[] = [
  { x: -20, y: 12 },
  { x: 20, y: 12 },
  ...Array.from({ length: 9 }, (_, i) => {
    const a = (i * Math.PI) / 16;
    return { x: 2 + 18 * Math.cos(a), y: 136 + 18 * Math.sin(a) };
  }),
  ...Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 16;
    return { x: -2 + 18 * Math.cos(a), y: 136 + 18 * Math.sin(a) };
  }),
];
export function area(poly: Point[]): number {
  return (
    Math.abs(
      poly.reduce((s, p, i) => {
        const q = poly[(i + 1) % poly.length];
        return s + p.x * q.y - q.x * p.y;
      }, 0),
    ) / 2
  );
}
export const INNER_AREA = area(INNER);
export const UNIT_AREA = (INNER_AREA * 0.865) / CAPACITY;
export function clip(poly: Point[], angle: number, plane: number, below = true): Point[] {
  const sin = Math.sin(angle),
    cos = Math.cos(angle);
  const result: Point[] = [],
    normal = (p: Point) => p.x * sin + p.y * cos - plane;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i],
      q = poly[(i + 1) % poly.length],
      dp = normal(p),
      dq = normal(q),
      insideP = below ? dp >= -1e-8 : dp <= 1e-8,
      insideQ = below ? dq >= -1e-8 : dq <= 1e-8;
    if (insideP) result.push(p);
    if (insideP !== insideQ) {
      const t = dp / (dp - dq);
      result.push({ x: mix(p.x, q.x, t), y: mix(p.y, q.y, t) });
    }
  }
  return result;
}
/** Area under a projected free surface, without allocating a clipped polygon
 * for each step of the volume search. The final visible contour still uses clip(). */
function submergedArea(heights: number[], plane: number) {
  let sum = 0,
    count = 0,
    firstX = 0,
    firstY = 0,
    lastX = 0,
    lastY = 0;
  for (let i = 0; i < INNER.length; i++) {
    const next = (i + 1) % INNER.length;
    const p = INNER[i],
      q = INNER[next];
    const dp = heights[i] - plane,
      dq = heights[next] - plane;
    const insideP = dp >= -1e-8,
      insideQ = dq >= -1e-8;
    if (insideP) {
      if (count++) sum += lastX * p.y - p.x * lastY;
      else {
        firstX = p.x;
        firstY = p.y;
      }
      lastX = p.x;
      lastY = p.y;
    }
    if (insideP !== insideQ) {
      const t = dp / (dp - dq),
        x = mix(p.x, q.x, t),
        y = mix(p.y, q.y, t);
      if (count++) sum += lastX * y - x * lastY;
      else {
        firstX = x;
        firstY = y;
      }
      lastX = x;
      lastY = y;
    }
  }
  return Math.abs(sum + lastX * firstY - firstX * lastY) / 2;
}
export function surfacePlane(units: number, angle: number): number {
  const sin = Math.sin(angle),
    cos = Math.cos(angle);
  const heights = INNER.map((p) => p.x * sin + p.y * cos);
  let low = Math.min(...heights),
    high = Math.max(...heights);
  const target = clamp(units, 0, 4) * UNIT_AREA;
  for (let i = 0; i < 26; i++) {
    const mid = (low + high) / 2;
    if (submergedArea(heights, mid) > target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
export function band(lower: number, upper: number, angle = 0): Point[] {
  if (upper - lower < 0.0001) return [];
  return clip(
    clip(INNER, angle, surfacePlane(upper, angle)),
    angle,
    surfacePlane(lower, angle),
    false,
  );
}
export function contactAngle(units: number): number {
  let low = 0,
    high = Math.PI / 2;
  for (let i = 0; i < 24; i++) {
    const angle = (low + high) / 2,
      lip = rotate({ x: INNER_HALF_WIDTH, y: 12 }, angle);
    const capacity = area(clip(INNER, angle, lip.y));
    if (capacity > Math.max(0, units) * UNIT_AREA) low = angle;
    else high = angle;
  }
  return (low + high) / 2;
}
export const polygonPath = (points: Point[]) =>
  points.length
    ? 'M' + points.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('L') + 'Z'
    : '';
export function layers(tube: number[], known?: boolean[]): Layer[] {
  const result: Layer[] = [];
  for (const [index, color] of tube.entries()) {
    const hidden = known?.[index] === false;
    const top = result.at(-1);
    if (top?.color === color && !!top.hidden === hidden) top.units++;
    else result.push({ color, units: 1, ...(hidden ? { hidden: true } : {}) });
  }
  return result;
}
export function drain(tube: Layer[], units: number): Layer[] {
  let remaining = units;
  return tube
    .map((layer) => ({ ...layer }))
    .reverse()
    .map((layer) => {
      const take = Math.min(layer.units, remaining);
      remaining -= take;
      return { ...layer, units: layer.units - take };
    })
    .reverse()
    .filter((layer) => layer.units > 0.0001);
}
export function receive(tube: Layer[], color: number, units: number): Layer[] {
  const result = tube.map((layer) => ({ ...layer }));
  if (units > 0.0001) {
    const top = result.at(-1);
    if (top?.color === color) top.units += units;
    else result.push({ color, units });
  }
  return result;
}
export function timeline(count: number) {
  const lift = 450,
    extraction = 180,
    flow = 700 + count * 150,
    flight = 140,
    settle = 180,
    returnTime = 420;
  return {
    lift,
    extraction,
    flow,
    flight,
    settle,
    returnTime,
    flowEnd: lift + flow,
    returnStart: lift + flow + settle,
    duration: lift + flow + settle + returnTime,
  };
}
export function samplePour(elapsed: number, count: number) {
  const t = timeline(count);
  return {
    extraction: smooth(elapsed / t.extraction),
    approach: smooth((elapsed - t.extraction) / (t.lift - t.extraction)),
    returnTravel: smooth((elapsed - t.returnStart) / (t.returnTime * 0.56)),
    insertion: smooth((elapsed - t.returnStart - t.returnTime * 0.56) / (t.returnTime * 0.44)),
    sent: smooth((elapsed - t.lift) / t.flow),
    arrived: smooth((elapsed - t.lift - t.flight) / t.flow),
    head: clamp((elapsed - t.lift) / t.flight),
    tail: clamp((elapsed - t.flowEnd) / t.flight),
    returning: smooth((elapsed - t.returnStart) / t.returnTime),
    flow: clamp((elapsed - t.lift) / t.flow),
    settling: clamp((elapsed - t.flowEnd) / t.settle),
    done: elapsed >= t.duration,
  };
}
export function colorMix(hex: string, other: string, weight: number) {
  const parse = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  return (
    '#' +
    [0, 1, 2]
      .map((i) =>
        Math.round(mix(parse(hex, i), parse(other, i), weight))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
