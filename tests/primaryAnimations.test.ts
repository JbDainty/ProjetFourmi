import { describe, expect, it, vi } from 'vitest';
import { createPrimaryAnimations } from '../src/animation/primaryAnimations';

describe('foreground animation workload', () => {
  it('holds ambient effects until all overlapping foreground owners have finished', () => {
    const priority = createPrimaryAnimations();
    const changed = vi.fn();
    const unsubscribe = priority.subscribe(changed);
    expect(priority.active()).toBe(false);
    const pour = priority.acquire();
    const modal = priority.acquire();
    expect(changed).toHaveBeenCalledTimes(1);
    pour();
    pour();
    expect(priority.active()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    modal();
    modal();
    expect(priority.active()).toBe(false);
    expect(changed).toHaveBeenCalledTimes(2);
    unsubscribe();
    priority.acquire()();
    expect(changed).toHaveBeenCalledTimes(2);
  });
});
