import { useLayoutEffect, useRef, useState } from 'react';
import { Platform, useWindowDimensions, type LayoutChangeEvent, type View } from 'react-native';

type Size = { width: number; height: number };
/** Read the committed layout before paint; onLayout still handles later native resizes. */
export function useMeasuredSize(
  onChange?: (size: Size) => void,
  round = false,
  layoutKey?: string,
) {
  const { width: windowWidth, height: windowHeight, fontScale } = useWindowDimensions();
  const ref = useRef<View>(null);
  const current = useRef<Size>({ width: 0, height: 0 });
  const [size, setSize] = useState(current.current);
  const changed = useRef(onChange);
  changed.current = onChange;
  const generation = useRef(0);
  const accept = (width: number, height: number) => {
    const next = {
      width: round ? Math.round(width) : width,
      height: round ? Math.round(height) : height,
    };
    if (
      next.width <= 0 ||
      next.height <= 0 ||
      (current.current.width === next.width && current.current.height === next.height)
    )
      return;
    current.current = next;
    setSize(next);
    changed.current?.(next);
  };
  const readWeb = () => {
    const element = ref.current as unknown as HTMLElement | null;
    if (!element) return;
    const style = getComputedStyle(element);
    const width = parseFloat(style.width),
      height = parseFloat(style.height);
    accept(
      Number.isFinite(width) ? width : element.offsetWidth,
      Number.isFinite(height) ? height : element.offsetHeight,
    );
  };
  useLayoutEffect(() => {
    const token = ++generation.current;
    const node = ref.current;
    if (Platform.OS === 'web') {
      // CSS layout dimensions ignore animated transforms and preserve fractions.
      readWeb();
    } else
      node?.measure((_x, _y, width, height) => {
        if (token === generation.current) accept(width, height);
      });
    return () => {
      generation.current++;
    };
  }, [windowWidth, windowHeight, fontScale, round, layoutKey]);
  return {
    ref,
    size,
    onLayout: (event: LayoutChangeEvent) => {
      if (Platform.OS === 'web') readWeb();
      else accept(event.nativeEvent.layout.width, event.nativeEvent.layout.height);
    },
  };
}
