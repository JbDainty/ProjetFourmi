import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { handwrittenLettering } from './PencilNote';

export const emptySeedHint =
  'Votre réserve est vide. Obtenez trois étoiles sur une page pour gagner une graine.';
export const missingPathHint =
  'Aucun chemin trouvé. Aucune graine dépensée. Annulez vos derniers mouvements ou recommencez.';
const paragraphs = [emptySeedHint, missingPathHint, 'Versez le flacon 12 dans le flacon 13.'];

const measurements = new Map<string, number[]>();
export const hintLayoutKey = (width: number, fontScale: number) =>
  `${Math.min(580, width)}/${fontScale}`;

/** Measure every possible paragraph before a request, including native font scaling.
 * The parchment is an overlay: neither searching nor typing can move the controls. */
export function HintSlot({
  children,
  layoutWidth,
  measureOnly = false,
  onReady,
}: {
  children?: React.ReactNode;
  layoutWidth: number;
  measureOnly?: boolean;
  onReady?: (key: string) => void;
}) {
  const { fontScale } = useWindowDimensions();
  const key = hintLayoutKey(layoutWidth, fontScale);
  const [heights, setHeights] = useState(() => measurements.get(key) ?? paragraphs.map(() => 0));
  useEffect(() => {
    if (!heights.every((height) => height > 0)) return;
    measurements.set(key, heights);
    onReady?.(key);
  }, [heights, key, onReady]);
  return (
    <View
      testID={measureOnly ? 'hint-slot-probe' : 'hint-scroll-slot'}
      style={{
        width: '100%',
        maxWidth: 580,
        alignSelf: 'center',
        height: Math.max(54 * fontScale, ...heights) + 24,
        marginBottom: 8,
      }}
    >
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        {paragraphs.map((paragraph, i) => (
          <Text
            key={paragraph}
            accessible={false}
            aria-hidden
            style={[
              handwrittenLettering,
              { position: 'absolute', top: 12, left: 20, right: 46, opacity: 0 },
            ]}
            onLayout={({ nativeEvent: { layout } }) =>
              setHeights((previous) => {
                if (previous[i] === layout.height) return previous;
                const next = [...previous];
                next[i] = layout.height;
                return next;
              })
            }
          >
            {paragraph}
          </Text>
        ))}
      </View>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}
