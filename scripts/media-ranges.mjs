/** Resolve a single RFC 9110 byte range, including suffix requests used by Safari video. */
export function mediaRange(header, size) {
  if (!Number.isSafeInteger(size) || size < 1) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || (!match[1] && !match[2])) return null;
  let start, end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start)
      return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}
