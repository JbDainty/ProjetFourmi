import { describe, it, expect } from 'vitest';
import {
  INNER,
  INNER_AREA,
  UNIT_AREA,
  area,
  band,
  clip,
  contactAngle,
  rotate,
  layers,
  drain,
  receive,
  samplePour,
  timeline,
} from '../src/animation/liquid';
describe('viscous pigment geometry', () => {
  it('preserves volume as a vessel tilts in either direction', () => {
    for (const angle of [-1.4, -0.8, 0, 0.55, 1.4])
      for (const units of [0.1, 1, 2, 3, 4])
        expect(area(band(0, units, angle))).toBeCloseTo(units * UNIT_AREA, 2);
  });
  it('keeps distinct layers contiguous without losing their area', () => {
    for (const angle of [-1.2, 0, 1.2]) {
      let total = 0;
      for (let i = 0; i < 4; i++) total += area(band(i, i + 1, angle));
      expect(total).toBeCloseTo(4 * UNIT_AREA, 2);
      expect(total).toBeLessThan(INNER_AREA);
    }
  });
  it('tilts further as the source empties, keeping its free surface at the lip', () => {
    let previous = 0;
    for (const units of [4, 3, 2, 1, 0.1]) {
      const angle = contactAngle(units);
      expect(angle).toBeGreaterThan(previous);
      previous = angle;
      expect(area(clip(INNER, angle, rotate({ x: 20, y: 12 }, angle).y))).toBeCloseTo(
        units * UNIT_AREA,
        2,
      );
    }
  });
  it('conserves pigment between source, falling stream and receiver for the entire animation', () => {
    for (const count of [1, 2, 4])
      for (let ms = 0; ms <= timeline(count).duration; ms += 17) {
        const s = samplePour(ms, count),
          source = count * (1 - s.sent),
          flight = count * (s.sent - s.arrived),
          destination = count * s.arrived;
        expect(flight).toBeGreaterThanOrEqual(-1e-9);
        expect(source + flight + destination).toBeCloseTo(count, 8);
      }
  });
  it('does not pour before positioning, drains before arrival and finishes with no suspended pigment', () => {
    expect(samplePour(200, 1).sent).toBe(0);
    expect(samplePour(360, 1).sent).toBeGreaterThan(0);
    expect(samplePour(360, 1).arrived).toBe(0);
    const end = samplePour(timeline(1).duration, 1);
    expect(end.sent).toBe(1);
    expect(end.arrived).toBe(1);
    expect(end.done).toBe(true);
  });
  it('merges matching pigment visually while maintaining fractional amounts', () => {
    const original = layers([0, 1, 1]);
    expect(drain(original, 0.75)).toEqual([
      { color: 0, units: 1 },
      { color: 1, units: 1.25 },
    ]);
    expect(receive(layers([1]), 1, 0.75)).toEqual([{ color: 1, units: 1.75 }]);
    expect(original).toEqual([
      { color: 0, units: 1 },
      { color: 1, units: 2 },
    ]);
  });
});
