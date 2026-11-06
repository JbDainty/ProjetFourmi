import { expect, it } from 'vitest';
import { mediaRange } from '../scripts/media-ranges.mjs';
it('serves explicit, open-ended and suffix video ranges without reading outside the file', () => {
  expect(mediaRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 });
  expect(mediaRange('bytes=900-', 1000)).toEqual({ start: 900, end: 999 });
  expect(mediaRange('bytes=-80', 1000)).toEqual({ start: 920, end: 999 });
  expect(mediaRange('bytes=980-2000', 1000)).toEqual({ start: 980, end: 999 });
  expect(mediaRange('bytes=-2000', 1000)).toEqual({ start: 0, end: 999 });
  for (const value of [
    'bytes=1000-',
    'bytes=30-2',
    'bytes=-0',
    'bytes=-',
    'items=0-1',
    'bytes=0-1,4-5',
    'bytes=999999999999999999-',
  ])
    expect(mediaRange(value, 1000)).toBeNull();
});
