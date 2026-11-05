import { Platform, type Animated } from 'react-native';

/** SVG changes allocate a fresh native bitmap. Keep decorative effects finite
 * and limit their React updates; opacity/transform effects still use the GPU. */
export function listenVector(value: Animated.Value, update: (progress: number) => void) {
  let nextPaint = 0;
  return value.addListener(({ value: progress }) => {
    const now = performance.now();
    if (Platform.OS === 'web' || progress <= 0 || progress >= 1 || now >= nextPaint) {
      nextPaint = now + 1000 / 30;
      update(progress);
    }
  });
}
