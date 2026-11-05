import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { type SvgProps } from 'react-native-svg';

/** Native SVG percentage heights are ambiguous inside an auto-sized control.
 * Measure an absolute View instead, so the artwork cannot change text layout. */
export function SvgBackdrop({
  children,
  viewBox,
  ...props
}: Omit<SvgProps, 'width' | 'height' | 'style'>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
      onLayout={({ nativeEvent: { layout } }) => {
        setSize((previous) =>
          previous.width === layout.width && previous.height === layout.height
            ? previous
            : { width: layout.width, height: layout.height },
        );
      }}
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
