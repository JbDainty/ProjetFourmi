import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { Paper } from './Paper';
import { Button, C, Label, T, ui } from './ui';
import { F } from './fonts';
import { useAmbientMotion } from './usePrimaryAnimation';

export function SeedPouch({
  count,
  motion,
  compact = false,
}: {
  count: number;
  motion: boolean;
  compact?: boolean;
}) {
  const animate = useAmbientMotion(motion);
  const [open, setOpen] = useState(false);
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    if (!animate) return;
    let animation: Animated.CompositeAnimation | undefined;
    const stir = () => {
      animation = Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 430,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(value, {
          toValue: -0.65,
          duration: 350,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]);
      animation.start();
    };
    const interval = setInterval(stir, 10000);
    return () => {
      clearInterval(interval);
      animation?.stop();
      value.setValue(0);
    };
  }, [animate, value]);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Graines dorées : ${count}. Comprendre les graines`}
        onPress={() => setOpen(true)}
        style={{
          minWidth: compact ? 60 : 66,
          minHeight: compact ? 44 : 52,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 3,
        }}
      >
        <Animated.View
          testID="seed-pouch-art"
          style={{
            transform: [
              {
                rotate: value.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] }),
              },
              {
                translateY: value.interpolate({ inputRange: [-1, 0, 1], outputRange: [-1, 0, -3] }),
              },
            ],
          }}
        >
          <Svg
            width={compact ? 30 : 37}
            height={compact ? 38 : 46}
            viewBox="0 0 48 58"
            accessible={false}
          >
            <Path
              d="M18 17 14 9 Q23 12 30 8 L28 17 C39 26 42 43 32 49 Q23 54 13 47 C5 40 9 25 18 17Z"
              fill="#e2cfa4"
              fillOpacity="0.65"
              stroke="#927646"
              strokeWidth="1"
            />
            <Path
              d="M16 17 Q23 14 31 17 M16 19 Q25 17 31 19 M23 18 Q36 11 38 18 Q36 22 25 18 M22 18 Q10 12 9 18 Q12 23 22 18"
              fill="none"
              stroke="#816b42"
              strokeWidth="0.9"
            />
            <G transform="translate(23 34) rotate(-25)">
              <Ellipse rx="5.5" ry="9" fill="#c4a05b" stroke="#91713c" strokeWidth="0.8" />
              <Path
                d="M0-6 Q-3 1 0 7 M0 3 4 0 M0-1-3-3"
                fill="none"
                stroke="#f9ebbd"
                strokeWidth="0.8"
              />
            </G>
            <Path
              d="M32 31 Q37 25 42 24 Q42 31 35 32 M35 32 39 27"
              fill="#9eaf7b"
              stroke="#74835f"
              strokeWidth="0.7"
            />
            <Path d="M7 24 8 21 9 24 12 25 9 26 8 29 7 26 4 25Z" fill="#c8a660" />
            <Circle cx="38" cy="41" r="1.1" fill="#b79a56" />
          </Svg>
        </Animated.View>
        <T
          testID="seed-count"
          maxFontSizeMultiplier={compact ? 1.3 : undefined}
          numberOfLines={1}
          style={{ fontFamily: F.display, fontSize: compact ? 19 : 21, color: C.ink }}
        >
          {count}
        </T>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType={motion ? 'fade' : 'none'}
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#203c32c9',
            padding: 24,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Paper
            testID="seed-explanation"
            style={[ui.card, { width: '100%', maxWidth: 400, gap: 15 }]}
          >
            <Label>LA RÉSERVE DU BOTANISTE</Label>
            <T serif style={{ fontSize: 30 }}>
              De petites graines de savoir
            </T>
            <T>
              Votre carnet commence avec une graine. Chaque page achevée avec trois étoiles en fait
              éclore une nouvelle, même lorsque vous la rejouez.
            </T>
            <T>
              Un nouvel indice coûte une graine. Relire le même conseil pour la même disposition des
              fioles est gratuit.
            </T>
            <T style={{ fontFamily: F.scientific, color: C.muted }}>
              Votre réserve : {count} {count === 1 ? 'graine' : 'graines'}.
            </T>
            <Button icon="leaf-outline" onPress={() => setOpen(false)}>
              Retourner à mon herbier
            </Button>
          </Paper>
        </View>
      </Modal>
    </>
  );
}
