import React from 'react';
import { Animated, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { Paper } from './Paper';
import { SvgBackdrop } from './SvgBackdrop';
import { CarnetIllustration, type CarnetEmblem } from './CarnetIllustration';
import { F } from './fonts';
import { T, C } from './ui';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

export type CarnetPath = '/' | '/herbier' | '/carte' | '/boutique' | '/parametres' | '/aide';
const destinations = [
  {
    path: '/herbier',
    name: 'Le Grand Herbier',
    detail: 'Vos merveilles retrouvées',
    emblem: 'herbier',
  },
  { path: '/carte', name: 'Écosystèmes', detail: 'Au fil du vivant', emblem: 'ecosystemes' },
  { path: '/boutique', name: 'La Boutique', emblem: 'boutique' },
  { path: '/parametres', name: 'Paramètres', emblem: 'parametres' },
] as const;

function SprigRule() {
  return (
    <Svg width={142} height={13} viewBox="0 0 142 13" accessible={false}>
      <G fill="none" stroke="#ae9157" strokeWidth="0.65" strokeLinecap="round">
        <Path d="M5 8 Q28 11 63 6 M137 8 Q114 11 79 6 M35 9 Q25 7 28 2 Q36 3 35 9 M107 9 Q117 7 114 2 Q106 3 107 9" />
        <Path
          d="M71 3 Q75-1 78 4 Q78 8 71 11 Q64 8 64 4 Q67-1 71 3Z"
          fill="#ae9157"
          fillOpacity="0.18"
        />
        <Circle cx="71" cy="6" r="1.1" fill="#ae9157" />
      </G>
    </Svg>
  );
}
function TileFrame({ selected = false, ribbon = false }: { selected?: boolean; ribbon?: boolean }) {
  return (
    <SvgBackdrop viewBox="0 0 180 130" preserveAspectRatio="none">
      <Path
        d="M17 6 Q45 10 90 5 Q135 10 163 6 Q170 10 173 22 Q168 66 174 109 Q173 120 162 123 Q130 119 90 125 Q49 120 17 124 Q8 121 7 109 Q12 65 7 22 Q7 11 17 6Z"
        fill={ribbon ? '#345644' : selected ? '#d7dfc28c' : '#f8eed74d'}
        stroke={ribbon ? '#bba36d' : '#baa16c'}
        strokeWidth="0.75"
        strokeOpacity={ribbon ? 0.9 : 0.62}
      />
      <Path
        d="M20 12 Q48 16 90 11 Q134 16 160 12 M20 118 Q51 113 90 119 Q131 113 160 117"
        fill="none"
        stroke={ribbon ? '#d5c58c' : '#c0a875'}
        strokeWidth="0.45"
        opacity="0.55"
      />
      {[false, true].map((mirror) => (
        <G
          key={String(mirror)}
          transform={mirror ? 'translate(180 130) rotate(180)' : undefined}
          fill="none"
          stroke={ribbon ? '#d5c58c' : '#8a9a71'}
          strokeWidth="0.7"
        >
          <Path d="M10 32 Q24 29 18 14 M18 23 Q25 20 23 15 Q15 16 18 23" />
          <Circle cx="15" cy="12" r="0.9" fill={ribbon ? '#d5c58c' : '#bba16a'} />
        </G>
      ))}
    </SvgBackdrop>
  );
}

/** A centered frontispiece with finite, native-driven motion; no idle animation loop. */
export function CarnetMenu({
  nickname,
  page,
  path,
  motion,
  onClose,
  onResume,
  onNavigate,
}: {
  nickname: string;
  page: number;
  path: string;
  motion: boolean;
  onClose: () => void;
  onResume: () => void;
  onNavigate: (path: CarnetPath) => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = height < 740 || width < 360;
  const { value, settled } = useNativeProgress(1850, motion);
  usePrimaryAnimation(!settled);
  const entrance = (start: number, end: number) => ({
    opacity: value.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: 'clamp' as const,
    }),
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [start, end],
          outputRange: [8, 0],
          extrapolate: 'clamp' as const,
        }),
      },
    ],
  });
  return (
    <SafeAreaView testID="carnet-menu-backdrop" style={{ flex: 1, backgroundColor: '#1a3028e0' }}>
      <ScrollView
        testID="carnet-menu-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: width < 360 ? 12 : 20,
          paddingVertical: 14,
        }}
      >
        <Animated.View
          testID="carnet-menu-entrance"
          style={[{ width: '100%', maxWidth: 460 }, entrance(0, 0.2)]}
        >
          <Paper
            testID="game-carnet-menu"
            vitality={1}
            style={{
              backgroundColor: '#f3e7cc',
              borderRadius: 30,
              paddingHorizontal: compact ? 20 : 26,
              paddingTop: compact ? 21 : 26,
              paddingBottom: compact ? 14 : 18,
              alignItems: 'center',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer le carnet"
              onPress={onClose}
              style={({ pressed }) => ({
                position: 'absolute',
                zIndex: 3,
                right: 7,
                top: 7,
                width: 46,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.55 : 1,
              })}
            >
              <Svg width={30} height={30} viewBox="0 0 36 36" accessible={false}>
                <G fill="none" stroke="#59775a" strokeWidth="1" strokeLinecap="round">
                  <Circle
                    cx="18"
                    cy="18"
                    r="14.5"
                    stroke="#b09a66"
                    strokeWidth="0.6"
                    opacity="0.7"
                  />
                  <Path d="M11 25 Q20 19 25 10 M11 11 Q18 18 25 25 M13 23 Q8 22 10 18 Q15 18 13 23 M23 13 Q21 8 25 8 Q28 13 23 13" />
                  <Circle cx="18" cy="18" r="1.4" fill="#b09a66" stroke="none" />
                </G>
              </Svg>
            </Pressable>
            <View style={{ width: '100%', paddingHorizontal: 25, alignItems: 'center' }}>
              <T
                testID="carnet-owner"
                style={{
                  fontFamily: F.scientific,
                  fontSize: compact ? 15 : 17,
                  lineHeight: 22,
                  color: '#7f6b45',
                  textAlign: 'center',
                }}
              >
                {nickname ? `Le carnet de ${nickname}` : 'Votre carnet botanique'}
              </T>
            </View>
            <View
              testID="carnet-frontispiece"
              style={{ alignItems: 'center', marginTop: compact ? 0 : 3 }}
            >
              <View
                style={{
                  height: compact ? 51 : 66,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CarnetIllustration name="herbier" size={compact ? 60 : 76} />
                {motion &&
                  !settled &&
                  [-1, 1].map((side, i) => (
                    <Animated.View
                      key={side}
                      testID="carnet-pollen"
                      pointerEvents="none"
                      renderToHardwareTextureAndroid
                      shouldRasterizeIOS
                      style={{
                        position: 'absolute',
                        left: side < 0 ? -9 : undefined,
                        right: side > 0 ? -8 : undefined,
                        top: 13 + i * 18,
                        opacity: value.interpolate({
                          inputRange: [0, 0.22, 0.5, 0.84, 1],
                          outputRange: [0, 0, 0.7, 0, 0],
                        }),
                        transform: [
                          {
                            translateY: value.interpolate({
                              inputRange: [0, 1],
                              outputRange: [9, -16],
                            }),
                          },
                          {
                            translateX: value.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, side * 9],
                            }),
                          },
                        ],
                      }}
                    >
                      <Svg width={14} height={14} viewBox="0 0 14 14" accessible={false}>
                        <Path d="M7 1 Q8 6 13 7 Q8 8 7 13 Q6 8 1 7 Q6 6 7 1Z" fill="#b59959" />
                        <Circle cx="2" cy="2" r="0.7" fill="#8e9e6c" />
                      </Svg>
                    </Animated.View>
                  ))}
              </View>
              <T
                accessibilityRole="header"
                accessibilityLabel="Herbier des couleurs"
                style={{
                  fontFamily: F.displayBold,
                  fontSize: compact ? 34 : 40,
                  lineHeight: compact ? 38 : 45,
                  color: '#294d3d',
                  letterSpacing: 0.4,
                }}
              >
                Herbier
              </T>
              <T
                style={{
                  fontFamily: F.display,
                  fontSize: compact ? 10 : 12,
                  lineHeight: 16,
                  letterSpacing: 3.5,
                  color: '#8f7544',
                }}
              >
                DES COULEURS
              </T>
              <SprigRule />
            </View>
            <Animated.View
              style={[{ width: '100%', marginTop: compact ? 8 : 14 }, entrance(0.08, 0.3)]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reprendre la partie"
                onPress={onResume}
                style={({ pressed }) => ({
                  minHeight: compact ? 65 : 74,
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <TileFrame ribbon />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: compact ? 3 : 8,
                  }}
                >
                  <CarnetIllustration name="resume" size={compact ? 41 : 48} light />
                  <View style={{ alignItems: 'center', flexShrink: 1 }}>
                    <T
                      style={{
                        fontFamily: F.display,
                        fontSize: compact ? 20 : 24,
                        lineHeight: compact ? 25 : 28,
                        color: '#f6e9c6',
                        textAlign: 'center',
                      }}
                    >
                      Reprendre la partie
                    </T>
                    <T
                      style={{
                        fontFamily: F.scientific,
                        fontSize: 12,
                        lineHeight: 17,
                        color: '#d2c697',
                        textAlign: 'center',
                      }}
                    >
                      Votre marque-page · Page {String(page).padStart(2, '0')}
                    </T>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                width: '100%',
                columnGap: 8,
                rowGap: compact ? 4 : 7,
                marginTop: compact ? 9 : 13,
              }}
            >
              {destinations.map((entry, i) => {
                const primary = i < 2;
                const selected = path === entry.path;
                return (
                  <Animated.View
                    key={entry.path}
                    testID={`carnet-destination-${entry.emblem}`}
                    style={[
                      { width: '48%', flexGrow: 1 },
                      entrance(0.14 + i * 0.035, 0.34 + i * 0.035),
                    ]}
                  >
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={entry.name}
                      accessibilityState={{ selected }}
                      onPress={() => onNavigate(entry.path)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minHeight: primary ? (compact ? 109 : 126) : compact ? 88 : 103,
                        paddingHorizontal: 5,
                        paddingVertical: compact ? 6 : 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.72 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      })}
                    >
                      <TileFrame selected={selected} />
                      <CarnetIllustration
                        name={entry.emblem as CarnetEmblem}
                        size={primary ? (compact ? 53 : 61) : compact ? 42 : 50}
                      />
                      <T
                        style={{
                          fontFamily: F.display,
                          fontSize: compact ? 17 : 20,
                          lineHeight: compact ? 21 : 24,
                          color: C.green,
                          textAlign: 'center',
                          marginTop: 1,
                        }}
                      >
                        {entry.name}
                      </T>
                      {'detail' in entry && (
                        <T
                          style={{
                            fontFamily: F.scientific,
                            fontSize: compact ? 10 : 11,
                            lineHeight: 15,
                            color: '#81704c',
                            textAlign: 'center',
                          }}
                        >
                          {entry.detail}
                        </T>
                      )}
                      {selected && (
                        <View
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: 2,
                            backgroundColor: '#a38449',
                            marginTop: 2,
                          }}
                        />
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
            <Animated.View
              style={[
                {
                  alignItems: 'center',
                  marginTop: compact ? 4 : 7,
                  width: '100%',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                },
                entrance(0.26, 0.5),
              ]}
            >
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="L’Atelier"
                accessibilityState={{ selected: path === '/' }}
                onPress={() => onNavigate('/')}
                style={({ pressed }) => ({
                  minHeight: 44,
                  flexDirection: 'row',
                  gap: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  flex: 1,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <CarnetIllustration name="atelier" size={33} />
                <T
                  style={{ fontFamily: F.scientific, fontSize: 16, lineHeight: 22, color: C.green }}
                >
                  L’Atelier
                </T>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Aide"
                accessibilityState={{ selected: path === '/aide' }}
                onPress={() => onNavigate('/aide')}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 48,
                  flexDirection: 'row',
                  gap: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <CarnetIllustration name="aide" size={37} />
                <T
                  style={{ fontFamily: F.scientific, fontSize: 17, lineHeight: 23, color: C.green }}
                >
                  Aide
                </T>
              </Pressable>
            </Animated.View>
            <View
              testID={settled ? 'carnet-menu-settled' : 'carnet-menu-unfolding'}
              pointerEvents="none"
            />
          </Paper>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
