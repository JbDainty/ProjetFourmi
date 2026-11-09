import React, { useId } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle, Path } from 'react-native-svg';
import { Botanical } from './Botanical';
import { species } from '../data/botany';
import { C } from './ui';
import { restorationDescription, restorationState } from '../animation/restoration';
import { SealMark } from './BotanicalSeal';
import { G } from 'react-native-svg';
export function BotanicalStamp({
  index,
  stage,
  onPress,
  disabled = false,
  size = 78,
}: {
  index: number;
  stage: number;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}) {
  const { colors, sealed } = restorationState(stage);
  const id = 'stamp-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Pressable
      testID="current-botanical-stamp"
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir la planche de ${species[index].name}, ${restorationDescription(stage)}`}
      accessibilityHint="Agrandir la plante sans quitter le puzzle"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: Math.max(44, size),
        height: Math.max(44, (size * 104) / 78),
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.78 : 1,
        transform: [{ rotate: '-3deg' }],
      })}
    >
      <Svg
        width={size}
        height={(size * 104) / 78}
        viewBox="0 0 78 104"
        style={{ position: 'absolute' }}
        pointerEvents="none"
      >
        <Defs>
          <Mask id={id}>
            <Rect x="3" y="3" width="72" height="98" rx="5" fill="white" />
            {Array.from({ length: 11 }, (_, i) => (
              <React.Fragment key={i}>
                <Circle cx="3" cy={12 + i * 8} r="1.8" fill="black" />
                <Circle cx="75" cy={12 + i * 8} r="1.8" fill="black" />
              </React.Fragment>
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <React.Fragment key={i}>
                <Circle cx={12 + i * 9} cy="3" r="1.8" fill="black" />
                <Circle cx={12 + i * 9} cy="101" r="1.8" fill="black" />
              </React.Fragment>
            ))}
          </Mask>
        </Defs>
        <Rect
          x="3"
          y="3"
          width="72"
          height="98"
          rx="5"
          fill="#f6ecd5"
          stroke="#a58c5d"
          strokeWidth="0.8"
          mask={`url(#${id})`}
        />
        <Rect
          x="9"
          y="9"
          width="60"
          height="78"
          rx="5"
          fill="none"
          stroke="#9eaa7e"
          strokeWidth="0.55"
        />
        <Path
          d="M12 22 Q12 13 22 12 M56 84 Q65 83 65 74"
          fill="none"
          stroke="#7c9469"
          strokeWidth="0.7"
        />
        {Array.from({ length: 4 }, (_, i) => (
          <Circle key={i} cx={19 + i * 9} cy="94" r="2" fill={i < colors ? C.green : '#d4c7a8'} />
        ))}
        <G opacity={sealed ? 1 : 0.25} transform="translate(62 94) scale(0.13)">
          <SealMark />
        </G>
      </Svg>
      <View pointerEvents="none" style={{ marginTop: (-12 * size) / 78 }}>
        <Botanical index={index} stage={stage} size={(58 * size) / 78} labels={false} />
      </View>
    </Pressable>
  );
}
