/** Shared, finite film timeline: native fallback and WebGL land on the same page. */
export const prologueDuration = 14800;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
export function prologueFrame(progress: number) {
  const p = clamp01(progress);
  return {
    opening: ease((p - 0.18) / 0.29),
    wind: ease((p - 0.31) / 0.22) * (1 - ease((p - 0.78) / 0.17)),
    growth: ease((p - 0.46) / 0.34),
    arrival: ease((p - 0.88) / 0.12),
    caption:
      p < 0.29
        ? 'Le livre se souvient.'
        : p < 0.71
          ? 'Un souffle réveille ses pages.'
          : 'Et le vivant retrouve son chemin.',
  };
}
