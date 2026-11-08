import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { type SvgProps } from 'react-native-svg';
import { useMeasuredSize } from './useMeasuredSize';

/** Native SVG percentage heights are ambiguous inside an auto-sized control.
 * Measure an absolute View instead, so the artwork cannot change text layout. */
export function SvgBackdrop({
  children,
  viewBox,
  ...props
}: Omit<SvgProps, 'width' | 'height' | 'style'>) {
  const { ref, size, onLayout } = useMeasuredSize();
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
      ref={ref}
      collapsable={false}
      onLayout={onLayout}
    >
      {size.width > 0 && size.height > 0 && (
        <Svg
          {...props}
          width={size.width}
          height={size.height}
          viewBox={viewBox ?? `0 0 ${size.width} ${size.height}`}
          preserveAspectRatio={props.preserveAspectRatio ?? 'none'}
          accessible={false}
          pointerEvents="none"
        >
          {children}
        </Svg>
      )}
    </View>
  );
}
