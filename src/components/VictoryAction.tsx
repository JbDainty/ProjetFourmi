import React, { useId } from 'react';
import { Pressable, View } from 'react-native';
import { Defs, LinearGradient, Stop, Path, G, Circle } from 'react-native-svg';
import { SvgBackdrop } from './SvgBackdrop';
import { T, Icon, C } from './ui';
import { F } from './fonts';
import type { BotanicalIconName } from './BotanicalIcon';

/** An engraved botanical ribbon, sized by its text even on narrow phones. */
export function VictoryAction({
  children,
  onPress,
  secondary = false,
  icon,
}: {
  children: string;
  onPress: () => void;
  secondary?: boolean;
  icon: BotanicalIconName;
}) {
  const id = 'ribbon-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ink = secondary ? C.green : '#f4e7bf';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={children}
      onPress={onPress}
      testID={secondary ? 'victory-action-secondary' : 'victory-action-primary'}
      style={({ pressed }) => ({
        width: '100%',
        maxWidth: 350,
        marginTop: secondary ? 9 : 0,
        minHeight: 64,
        paddingHorizontal: 23,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.76 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <SvgBackdrop viewBox="0 0 350 64" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor={secondary ? '#f3e8ce' : '#42654f'} />
            <Stop offset="1" stopColor={secondary ? '#e9d9b5' : '#253f33'} />
          </LinearGradient>
        </Defs>
        <Path
          d="M20 5 Q80 8 175 3 Q270 8 330 5 C337 14 337 23 347 32 C337 40 337 51 330 59 Q250 55 175 61 Q100 55 20 59 C13 50 13 41 3 32 C13 24 13 14 20 5Z"
          fill={`url(#${id})`}
          stroke="#b49a61"
          strokeWidth=".8"
        />
        <Path
          d="M26 10 Q95 13 175 8 Q255 13 324 10 M26 54 Q100 50 175 56 Q250 50 324 54"
          fill="none"
          stroke="#c3aa71"
          strokeWidth=".6"
          opacity=".65"
        />
        {[false, true].map((mirror) => (
          <G
            key={String(mirror)}
            transform={mirror ? 'translate(350 0) scale(-1 1)' : undefined}
            fill="none"
            stroke={ink}
            strokeWidth=".75"
            opacity=".7"
          >
            <Path d="M19 44 Q28 32 21 20 M23 34 Q12 31 17 23 Q25 25 23 34 M24 30 Q34 26 30 19 Q22 22 24 30" />
            <Circle cx="22" cy="16" r="1.5" fill={ink} />
          </G>
        ))}
      </SvgBackdrop>
      <View
        style={{
          width: '100%',
          minHeight: 32,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
        }}
      >
        <Icon name={icon} size={23} color={ink} />
        <T
          style={{
            fontFamily: secondary ? F.scientific : F.display,
            fontSize: 19,
            lineHeight: 24,
            color: ink,
            textAlign: 'center',
            flexShrink: 1,
          }}
        >
          {children}
        </T>
      </View>
    </Pressable>
  );
}
