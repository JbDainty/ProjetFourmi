import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { T } from './ui';
import { F } from './fonts';
import { useAmbientMotion } from './usePrimaryAnimation';

export function StampPrompt({
  onPress,
  disabled,
  motion,
}: {
  onPress: () => void;
  disabled: boolean;
  motion: boolean;
}) {
  const animate = useAmbientMotion(motion);
  const shimmer = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (!animate) {
      shimmer.setValue(0.5);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.95,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0.3,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.delay(2800),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animate, shimmer]);
  return (
    <Pressable
      testID="stamp-observation-prompt"
      accessibilityRole="button"
      accessibilityLabel="Observer la planche"
      accessibilityHint="Agrandir le timbre botanique"
      disabled={disabled}
      onPress={onPress}
      hitSlop={14}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
        marginLeft: 10,
        opacity: disabled ? 0.45 : pressed ? 0.65 : 1,
      })}
    >
      <Animated.View pointerEvents="none" style={{ opacity: shimmer }}>
        <Svg width="8" height="12" viewBox="0 0 12 16" accessible={false}>
          <Path d="M6 1 Q6.5 6 11 8 Q6.5 9 6 15 Q5.5 9 1 8 Q5.5 6 6 1Z" fill="#b49b60" />
        </Svg>
      </Animated.View>
      <T style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 17, color: '#756b4f' }}>
        Voir la planche
      </T>
      <Animated.View pointerEvents="none" style={{ opacity: shimmer }}>
        <Svg width="5" height="9" viewBox="0 0 12 16" accessible={false}>
          <Path d="M6 2 Q7 7 11 8 Q7 9 6 14 Q5 9 1 8 Q5 7 6 2Z" fill="#b49b60" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}
