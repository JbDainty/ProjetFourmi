import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { planBookTurn } from '../src/animation/book';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';

it('plans every species boundary with the destination specimen and its actual restoration', () => {
  let save = { ...initial(), started: true },
    boundaries = 0;
  for (const level of levels) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
    const replay = planBookTurn(save, level.id, 1);
    expect(replay.kind).toBe('single');
    if (level.id === 100) continue;
    const turn = planBookTurn(save, level.id + 1, 2);
    if (level.id % 5 === 0) {
      boundaries++;
      expect(turn.kind).toBe('species');
      expect(turn.plant).toBe(level.id / 5 - 1);
      expect(turn.stage).toBe(5);
      expect(turn.targetPlant).toBe(level.id / 5);
      expect(turn.targetStage).toBe(0);
    } else {
      expect(turn.kind).toBe('single');
      expect(turn.targetPlant).toBe(turn.plant);
      expect(turn.targetStage).toBe(turn.stage);
    }
  }
  expect(boundaries).toBe(19);
  const backwards = planBookTurn(save, 2, 3);
  expect(backwards.kind).toBe('species');
  expect(backwards.targetPlant).toBe(0);
  expect(backwards.targetStage).toBe(5);
  expect(() => planBookTurn(save, 101, 4)).toThrow(RangeError);
  expect(() => planBookTurn(save, 0, 4)).toThrow(RangeError);
});

it('snapshots both pages before the save changes and treats the first opening as one leaf', () => {
  const opening = planBookTurn(initial(), 1, 5);
  expect(opening).toMatchObject({ from: 0, to: 1, plant: 0, targetPlant: 0, kind: 'single' });
  let save = { ...initial(), started: true };
  for (const level of levels.slice(0, 5)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  const turn = planBookTurn(save, 6, 6);
  save = loadLevel(save, 6);
  for (const m of levels[5].solution) save = move(save, m.from, m.to);
  expect(turn).toMatchObject({
    from: 5,
    to: 6,
    plant: 0,
    stage: 5,
    targetPlant: 1,
    targetStage: 0,
  });
});

it.each([
  ['page-turn.wav', 1.15],
  ['pages-riffle.wav', 1.85],
] as const)('%s is audible original mono PCM without clipping', (name, duration) => {
  const wav = readFileSync(`assets/${name}`);
  expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
  expect(wav.readUInt16LE(22)).toBe(1);
  expect(wav.readUInt32LE(24)).toBe(22050);
  expect(wav.readUInt16LE(34)).toBe(16);
  expect((wav.length - 44) / 2 / 22050).toBeCloseTo(duration, 3);
  let energy = 0,
    peak = 0;
  for (let i = 44; i < wav.length; i += 2) {
    const sample = wav.readInt16LE(i) / 32768;
    energy += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  expect(peak).toBeLessThan(0.43);
  expect(Math.sqrt(energy / ((wav.length - 44) / 2))).toBeGreaterThan(0.025);
});
