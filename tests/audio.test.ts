import { expect, it } from 'vitest';
import { duckMusic, musicAttenuation } from '../src/services/audioFocus';
import { completedByPour } from '../src/animation/tubeReward';
import { initial, restore } from '../src/state/model';

it('keeps the strongest active reduction when effects finish in either order', () => {
  const pour = duckMusic(0.35),
    melody = duckMusic(0.16);
  expect(musicAttenuation()).toBe(0.16);
  pour();
  pour();
  expect(musicAttenuation()).toBe(0.16);
  melody();
  expect(musicAttenuation()).toBe(1);
  const wind = duckMusic(0.55),
    page = duckMusic(0.32);
  page();
  expect(musicAttenuation()).toBe(0.55);
  wind();
  expect(musicAttenuation()).toBe(1);
});

it('preserves mute for old saves and independent new music preferences', () => {
  for (const sound of [true, false]) {
    const old = initial();
    const { music, ...settings } = old.settings;
    expect(
      restore(JSON.stringify({ ...old, settings: { ...settings, sound } })).settings.music,
    ).toBe(sound);
  }
  const save = initial();
  save.settings.sound = false;
  save.settings.music = true;
  expect(restore(JSON.stringify(save)).settings).toEqual(save.settings);
});

it('celebrates newly consolidated full colours but not partial or relocated full vials', () => {
  expect(
    completedByPour(
      [
        [0, 0],
        [0, 0],
      ],
      [[], [0, 0, 0, 0]],
      1,
    ),
  ).toBe(true);
  expect(completedByPour([[0], [0]], [[], [0, 0]], 1)).toBe(false);
  expect(completedByPour([[0, 0, 0, 0], []], [[], [0, 0, 0, 0]], 1)).toBe(false);
  expect(completedByPour([[0], [1, 1, 1]], [[], [1, 1, 1, 0]], 1)).toBe(false);
});
