/** `minimum` is certified offline; allow a small, explicit three-star margin. */
export function starLimits(minimum: number) {
  const three = minimum + Math.max(1, Math.ceil(minimum / 10));
  const two = Math.max(three + 1, Math.floor(minimum * 1.5));
  return { three, two };
}

export function pageStars(moves: number, minimum: number): 1 | 2 | 3 {
  const limits = starLimits(minimum);
  return moves <= limits.three ? 3 : moves <= limits.two ? 2 : 1;
}
