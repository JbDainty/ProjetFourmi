import { describe, expect, it, vi } from 'vitest';
import { movieClock } from '../src/animation/movieClock';
import { nativeSequence } from '../src/animation/nativeSequence';
import { prologueSurface } from '../src/scene/renderBudget';
import { scoreSession } from '../src/services/scoreSession';

describe('native movie and paper motion', () => {
  it('reads smooth 60/120 Hz progress without a React tick and excludes time in background', () => {
    let now = 0;
    const clock = movieClock(14800, () => now);
    clock.setActive(true);
    now = 16.67;
    expect(clock.progress()).toBeCloseTo(16.67 / 14800);
    now = 2000;
    clock.setActive(false);
    now = 90000;
    expect(clock.progress()).toBeCloseTo(2000 / 14800);
    clock.setActive(true);
    now += 12800;
    expect(clock.progress()).toBe(1);
    clock.setActive(false);
    clock.seek(0);
    expect(clock.progress()).toBe(0);
  });

  it('limits physical pixels on a QHD phone while preserving full-screen aspect and coverage', () => {
    for (const [w, h, density] of [
      [411, 883, 3.5],
      [393, 852, 3],
      [360, 780, 2],
      [1024, 1366, 2],
    ]) {
      const size = prologueSurface(w, h, density);
      expect(Math.max(size.width, size.height) * density).toBeLessThanOrEqual(1600.01);
      expect(size.width * size.scale).toBeCloseTo(w);
      expect(size.height * size.scale).toBeCloseTo(h);
      expect(size.width / size.height).toBeCloseTo(w / h);
      expect(size.scale).toBeGreaterThanOrEqual(1);
    }
  });

  function paper() {
    const cover = vi.fn(),
      finish = vi.fn();
    const runs: { duration: number; done: () => void; read?: (p: number) => void }[] = [];
    const play = (duration: number, done: () => void) => {
      const run = { duration, done, read: undefined as ((p: number) => void) | undefined };
      runs.push(run);
      return {
        stop: (read: (p: number) => void) => {
          run.read = read;
        },
      };
    };
    const sequence = nativeSequence(
      [
        { duration: 220, play, complete: cover },
        { duration: 2080, play },
      ],
      finish,
    );
    return { cover, finish, runs, sequence };
  }
  it('commits the next species once, only when covered, then completes once', () => {
    const p = paper();
    p.sequence.setActive(true);
    expect(p.cover).not.toHaveBeenCalled();
    p.runs[0].done();
    expect(p.cover).toHaveBeenCalledTimes(1);
    p.runs[0].done();
    expect(p.cover).toHaveBeenCalledTimes(1);
    expect(p.runs[1].duration).toBe(2080);
    p.runs[1].done();
    p.runs[1].done();
    expect(p.finish).toHaveBeenCalledTimes(1);
  });
  it('waits for an asynchronous native pause read before resuming the remaining turn', () => {
    const p = paper();
    p.sequence.setActive(true);
    p.runs[0].done();
    p.sequence.setActive(false);
    p.sequence.setActive(true);
    expect(p.runs).toHaveLength(2);
    p.runs[1].done();
    expect(p.finish).not.toHaveBeenCalled();
    p.runs[1].read!(0.75);
    expect(p.runs[2].duration).toBe(520);
    p.runs[2].done();
    expect(p.finish).toHaveBeenCalledTimes(1);
    expect(p.cover).toHaveBeenCalledTimes(1);
  });
  it('cancels callbacks and a pending pause read when the page is unmounted', () => {
    const p = paper();
    p.sequence.setActive(true);
    p.sequence.setActive(false);
    p.sequence.dispose();
    p.runs[0].read!(0.5);
    p.runs[0].done();
    p.sequence.setActive(true);
    expect(p.runs).toHaveLength(1);
    expect(p.cover).not.toHaveBeenCalled();
    expect(p.finish).not.toHaveBeenCalled();
  });
});

describe('intro score', () => {
  it('cannot begin late after mute or skip during decoding/seeking', async () => {
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const audible = vi.fn(),
      status = vi.fn();
    const voice = {
      play: async (_: number, valid: () => boolean) => {
        await wait;
        if (valid()) audible();
        return valid();
      },
      pause: vi.fn(),
      dispose: vi.fn(),
    };
    const session = scoreSession(voice, () => 0, status);
    session.setActive(true);
    session.setActive(false);
    release();
    await wait;
    await Promise.resolve();
    expect(audible).not.toHaveBeenCalled();
    expect(status).not.toHaveBeenCalledWith('playing');
    expect(voice.pause).toHaveBeenCalledTimes(1);
  });
  it('resumes at the movie position and does not duplicate playback on focus notifications', async () => {
    let position = 2;
    const voice = {
      play: vi.fn(async (_: number, valid: () => boolean) => valid()),
      pause: vi.fn(),
      dispose: vi.fn(),
    };
    const status = vi.fn(),
      session = scoreSession(voice, () => position, status);
    session.setActive(true);
    session.setActive(true);
    await Promise.resolve();
    expect(voice.play).toHaveBeenCalledTimes(1);
    expect(voice.play.mock.calls[0][0]).toBe(2);
    session.setActive(false);
    position = 6.2;
    session.setActive(true);
    await Promise.resolve();
    expect(voice.play.mock.calls[1][0]).toBe(6.2);
    expect(status).toHaveBeenCalledWith('playing');
    session.dispose();
    session.setActive(true);
    expect(voice.play).toHaveBeenCalledTimes(2);
  });
  it('retries blocked autoplay but invalidates an old attempt when disposed', async () => {
    const status = vi.fn();
    let permitted = false;
    const voice = {
      play: vi.fn(async (_: number, valid: () => boolean) => permitted && valid()),
      pause: vi.fn(),
      dispose: vi.fn(),
    };
    const session = scoreSession(voice, () => 3.4, status);
    session.setActive(true);
    await Promise.resolve();
    expect(status).toHaveBeenCalledWith('blocked');
    permitted = true;
    session.retry();
    await Promise.resolve();
    expect(status).toHaveBeenCalledWith('playing');
    session.retry();
    session.dispose();
    await Promise.resolve();
    expect(voice.dispose).toHaveBeenCalledTimes(1);
  });
});
