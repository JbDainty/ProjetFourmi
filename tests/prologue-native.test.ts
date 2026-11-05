import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { textureFromPNG } from '../src/scene/pngTexture';
import { createProloguePlayer } from '../src/scene/prologuePlayer';

it('decodes all bundled mobile textures to finite RGBA8 without browser images', () => {
  let bytes = 0;
  for (const name of readdirSync('assets/prologue')) {
    const texture = textureFromPNG(readFileSync('assets/prologue/' + name));
    expect(texture.isDataTexture).toBe(true);
    expect(texture.image.width).toBeLessThanOrEqual(1024);
    expect(texture.image.data).toHaveLength(texture.image.width * texture.image.height * 4);
    bytes += texture.image.data!.byteLength;
    texture.dispose();
  }
  expect(bytes).toBeLessThan(16 * 1024 * 1024);
});
it('stops scheduling in background, caps frames and redraws the held progress on resume', () => {
  let callback: ((time: number) => void) | undefined,
    p = 0.2,
    next = 0;
  const drawn: number[] = [];
  const player = createProloguePlayer({
    request: (fn) => {
      callback = fn;
      return ++next;
    },
    cancel: () => {
      callback = undefined;
    },
    progress: () => p,
    draw: (p) => drawn.push(p),
    failed: () => {
      throw Error('Unexpected render failure');
    },
  });
  player.setActive(true);
  callback!(0);
  p = 0.3;
  callback!(16);
  expect(drawn).toEqual([0.2]);
  callback!(34);
  expect(drawn).toEqual([0.2, 0.3]);
  player.setActive(false);
  expect(callback).toBeUndefined();
  p = 0.4;
  player.setActive(true);
  callback!(40);
  expect(drawn).toEqual([0.2, 0.3, 0.4]);
  player.dispose();
  player.dispose();
  expect(callback).toBeUndefined();
  player.setActive(true);
  expect(callback).toBeUndefined();
});
it('a rendering failure cancels the native loop once and cannot leak a pending frame', () => {
  let callback: ((time: number) => void) | undefined,
    errors = 0;
  const player = createProloguePlayer({
    request: (fn) => {
      callback = fn;
      return 1;
    },
    cancel: () => {
      callback = undefined;
    },
    progress: () => 0,
    draw: () => {
      throw Error('lost surface');
    },
    failed: () => errors++,
  });
  player.setActive(true);
  const tick = callback!;
  callback = undefined;
  tick(0);
  expect(errors).toBe(1);
  expect(callback).toBeUndefined();
  player.dispose();
});
