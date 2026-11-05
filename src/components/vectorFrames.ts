import { type Animated } from 'react-native';

/** SVG changes allocate a fresh native bitmap. Keep decorative effects finite
 * and limit their React updates; opacity/transform effects still use the GPU. */
export function listenVector(value: Animated.Value, update: (progress: number) => void) {
  let nextPaint = 0;
  return value.addListener(({ value: progress }) => {
    const now = performance.now();
    if (progress <= 0 || progress >= 1 || now + 0.5 >= nextPaint) {
      const step = 1000 / 60;
      nextPaint = nextPaint
        ? nextPaint + (Math.floor(Math.max(0, now - nextPaint) / step) + 1) * step
        : now + step;
      update(progress);
    }
  });
}
