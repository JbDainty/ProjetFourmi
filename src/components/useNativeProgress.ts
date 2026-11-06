import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform } from 'react-native';
import { nativeSequence } from '../animation/nativeSequence';

/** One native timeline, with only a completion delivered to React.
 * All drawings stay immutable while their cached views move on the UI thread. */
export function useNativeProgress(
  duration: number,
  motion: boolean,
  onDone?: () => void,
  staticDuration = 0,
) {
  const value = useRef(new Animated.Value(motion ? 0 : 1)).current;
  const done = useRef(onDone);
  done.current = onDone;
  const [settled, setSettled] = useState(!motion);
  useEffect(() => {
    value.setValue(motion ? 0 : 1);
    setSettled(!motion);
    if (!motion) {
      if (!staticDuration) return;
      const timer = setTimeout(() => done.current?.(), staticDuration);
      return () => clearTimeout(timer);
    }
    const sequence = nativeSequence(
      [
        {
          duration,
          play(remaining, complete) {
            const animation = Animated.timing(value, {
              toValue: 1,
              duration: remaining,
              easing: Easing.linear,
              useNativeDriver: Platform.OS !== 'web',
              isInteraction: false,
            });
            animation.start(({ finished }) => {
              if (finished) complete();
            });
            return {
              stop(read) {
                animation.stop();
                value.stopAnimation(read);
              },
            };
          },
        },
      ],
      () => {
        setSettled(true);
        done.current?.();
      },
    );
    sequence.setActive(
      AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
    );
    const subscription = AppState.addEventListener('change', (state) =>
      sequence.setActive(state === 'active'),
    );
    return () => {
      subscription.remove();
      sequence.dispose();
    };
  }, [duration, motion, staticDuration, value]);
  return { value, settled };
}
