import { describe, expect, it, vi } from 'vitest';
import { framePlayback } from '../src/animation/framePlayback';

function setup(duration = 1000) {
  let time = 0;
  let id = 0;
  const frames = new Map<number, (time: number) => void>();
  const paints: number[] = [];
  const finish = vi.fn();
  const player = framePlayback({
    duration,
    fps: 30,
    now: () => time,
    request: (callback) => {
      frames.set(++id, callback);
      return id;
    },
    cancel: (id) => {
      frames.delete(id);
    },
    onFrame: (elapsed) => paints.push(elapsed),
    onFinish: finish,
  });
  const advance = (next: number) => {
    time = next;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  };
  return { player, paints, finish, frames, advance };
}

describe('finite pour playback', () => {
  it('does no idle work and caps native paints without changing pour duration', () => {
    const s = setup();
    expect(s.frames.size).toBe(0);
    s.player.setActive(true);
    for (let time = 0; time <= 1000; time += 10) s.advance(time);
    expect(s.paints.length).toBeLessThanOrEqual(32);
    expect(s.paints.length).toBeGreaterThanOrEqual(30);
    expect(s.paints.at(-1)).toBe(1000);
    expect(s.finish).toHaveBeenCalledTimes(1);
    expect(s.frames.size).toBe(0);
    s.advance(1500);
    expect(s.finish).toHaveBeenCalledTimes(1);
  });

  it('keeps liquid timing correct when frames are dropped', () => {
    const s = setup();
    s.player.setActive(true);
    [16, 54, 82, 330, 800, 1050].forEach(s.advance);
    expect(s.paints).toEqual([16, 54, 82, 330, 800, 1000]);
    expect(s.finish).toHaveBeenCalledTimes(1);
  });

  it('pauses in the background and resumes without skipping the remaining liquid', () => {
    const s = setup();
    s.player.setActive(true);
    s.advance(300);
    s.player.setActive(false);
    expect(s.frames.size).toBe(0);
    s.advance(20000);
    s.player.setActive(true);
    s.advance(20400);
    expect(s.paints.at(-1)).toBe(700);
    expect(s.finish).not.toHaveBeenCalled();
    s.advance(20700);
    expect(s.finish).toHaveBeenCalledTimes(1);
  });

  it('cannot commit a canceled pour after navigation or unmount', () => {
    const s = setup();
    s.player.setActive(true);
    s.advance(150);
    s.player.dispose();
    s.player.setActive(true);
    s.advance(2000);
    expect(s.frames.size).toBe(0);
    expect(s.finish).not.toHaveBeenCalled();
  });

  it('commits once with motion disabled', () => {
    const s = setup(0);
    s.player.setActive(true);
    s.advance(16);
    expect(s.paints).toEqual([0]);
    expect(s.finish).toHaveBeenCalledTimes(1);
    expect(s.frames.size).toBe(0);
  });
});
