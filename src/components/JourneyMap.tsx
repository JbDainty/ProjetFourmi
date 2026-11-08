import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  View,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { type Save } from '../state/model';
import { MAP_WIDTH, journeyLayout } from '../journey/layout';
import { T, C, Icon } from './ui';
import { F } from './fonts';
import { JourneyFrame } from './JourneyFrame';
import { useMeasuredSize } from './useMeasuredSize';
import { useNativeProgress } from './useNativeProgress';
import { BookActionsContext } from './BookActions';

const landscapes = [
  require('../../assets/journey/prairies.png'),
  require('../../assets/journey/sous-bois.png'),
  require('../../assets/journey/marais.png'),
  require('../../assets/journey/montagnes.png'),
  require('../../assets/journey/garrigue.png'),
];
const colors = ['#d3d7ad', '#a0b29a', '#b5c9b5', '#d2d3c4', '#ddd0ae'];
export function JourneyMap({
  save,
  frontier,
  onSelect,
  onBiome,
}: {
  save: Save;
  frontier: number;
  onSelect: (id: number) => void;
  onBiome: (biome: number) => void;
}) {
  const { replaying } = useContext(BookActionsContext);
  const { ref, size, onLayout } = useMeasuredSize();
  const scroll = useRef<ScrollView>(null);
  const layout = useMemo(
    () => journeyLayout(frontier, size.width ? (size.height * MAP_WIDTH) / size.width : 0),
    [frontier, size.width, size.height],
  );
  const scale = size.width / MAP_WIDTH;
  const [visiblePage, setVisiblePage] = useState(save.current);
  const biomeRef = useRef(-1);
  const entered = useRef('');
  const anchor = layout.points[save.current - 1] ?? layout.points.at(-1)!;
  const jump = () =>
    scroll.current?.scrollTo({
      y: Math.max(0, anchor.y * scale - size.height * 0.4),
      animated: save.settings.motion,
    });
  useEffect(() => {
    const key = `${save.current}/${size.width}/${size.height}/${frontier}`;
    if (!size.height || !size.width || entered.current === key) return;
    entered.current = key;
    // A content offset is also supplied below: native content starts at the right place.
    scroll.current?.scrollTo({
      y: Math.max(0, anchor.y * scale - size.height * 0.4),
      animated: false,
    });
    setVisiblePage(save.current);
    const biome = Math.floor((save.current - 1) / 20);
    biomeRef.current = biome;
    onBiome(biome);
  }, [size.width, size.height, save.current, frontier, anchor.y, scale, onBiome]);
  const readPosition = (y: number) => {
    const logicalY = (y + size.height * 0.4) / scale;
    const closest = layout.points.reduce((a, b) =>
      Math.abs(a.y - logicalY) < Math.abs(b.y - logicalY) ? a : b,
    );
    const biome = Math.floor((closest.id - 1) / 20);
    if (biome !== biomeRef.current) {
      biomeRef.current = biome;
      onBiome(biome);
    }
    return closest.id;
  };
  const scene = layout.points[visiblePage - 1] ?? anchor;
  const hasLife = !!save.completed[scene.id] || !!save.completed[scene.id - 1];
  return (
    <>
      <JourneyFrame>
        <View ref={ref} collapsable={false} onLayout={onLayout} style={{ flex: 1, minHeight: 0 }}>
          {scale > 0 && (
            <ScrollView
              ref={scroll}
              testID="ecosystem-map-scroll"
              bounces={false}
              overScrollMode="never"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={100}
              style={{ flex: 1, overscrollBehavior: 'contain' } as ViewStyle}
              contentOffset={{ x: 0, y: Math.max(0, anchor.y * scale - size.height * 0.4) }}
              onScroll={(e) => readPosition(e.nativeEvent.contentOffset.y)}
              onScrollEndDrag={(e) => setVisiblePage(readPosition(e.nativeEvent.contentOffset.y))}
              onMomentumScrollEnd={(e) =>
                setVisiblePage(readPosition(e.nativeEvent.contentOffset.y))
              }
            >
              <View
                testID="journey-landscape"
                style={{
                  width: size.width,
                  height: Math.max(size.height, layout.height * scale),
                  backgroundColor: colors[Math.floor((frontier - 1) / 20)],
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: MAP_WIDTH,
                    height: layout.height,
                    transformOrigin: 'top left',
                    transform: [{ scale }],
                  }}
                >
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {landscapes.slice(0, Math.floor((frontier - 1) / 20) + 1).map((source, i) => (
                      <Image
                        key={i}
                        testID={`journey-biome-${i}`}
                        source={source}
                        fadeDuration={0}
                        resizeMode="stretch"
                        style={{
                          position: 'absolute',
                          left: 0,
                          width: 360,
                          height: 1000,
                          top: layout.height - (i + 1) * 880 - 60,
                        }}
                      />
                    ))}
                    <Svg
                      style={{ position: 'absolute', top: 0, left: 0 }}
                      width={360}
                      height={layout.height}
                      viewBox={`0 0 360 ${layout.height}`}
                      accessible={false}
                    >
                      <Defs>
                        <LinearGradient id="journey-road" x1="0" y1="0" x2="1" y2="0">
                          <Stop stopColor="#b4a17b" />
                          <Stop offset="0.5" stopColor="#ece1bd" />
                          <Stop offset="1" stopColor="#c3ae85" />
                        </LinearGradient>
                      </Defs>
                      <Path
                        d={layout.path}
                        fill="none"
                        stroke="#5a6852"
                        strokeOpacity="0.18"
                        strokeWidth="29"
                        strokeLinecap="round"
                      />
                      <Path
                        d={layout.path}
                        fill="none"
                        stroke="#e6dbb5"
                        strokeWidth="24"
                        strokeLinecap="round"
                      />
                      <Path
                        d={layout.path}
                        fill="none"
                        stroke="url(#journey-road)"
                        strokeWidth="19"
                        strokeLinecap="round"
                      />
                      <Path
                        d={layout.path}
                        fill="none"
                        stroke="#f7edd2"
                        strokeWidth="1.4"
                        strokeDasharray="2 8"
                        strokeLinecap="round"
                      />
                      {layout.points
                        .filter((p) => !!save.completed[p.id])
                        .map((p) => (
                          <G
                            key={p.id}
                            transform={`translate(${p.x + (p.x > 180 ? -43 : 42)} ${p.y + 25})`}
                          >
                            <Path
                              d="M0 9Q-5-1 1-13M0 1Q-12 2-11-8Q-2-7 0 1M0 4Q12 1 10-7Q1-5 0 4"
                              fill="#7b9568"
                              stroke="#5e7959"
                              strokeWidth="0.65"
                            />
                            {p.id % 5 === 0 && (
                              <G>
                                <Circle
                                  cx="0"
                                  cy="-14"
                                  r="8"
                                  fill={
                                    p.id <= 20
                                      ? '#c58b7b'
                                      : p.id <= 40
                                        ? '#ded9c4'
                                        : p.id <= 60
                                          ? '#b29eb9'
                                          : '#c4b8d2'
                                  }
                                />
                                <Path d="M-6-16 6-12M-3-20 3-8" stroke="#efe6c6" strokeWidth="3" />
                                <Circle cy="-14" r="2" fill="#a39051" />
                              </G>
                            )}
                          </G>
                        ))}
                    </Svg>
                  </View>
                  {layout.points.map((p) => (
                    <JourneyNode
                      key={p.id}
                      id={p.id}
                      x={p.x}
                      y={p.y}
                      active={save.current === p.id}
                      next={frontier === p.id && !save.completed[p.id]}
                      stars={save.completed[p.id]?.stars ?? 0}
                      onSelect={onSelect}
                    />
                  ))}
                  {hasLife && (
                    <MapLife
                      key={`${scene.id}/${replaying}`}
                      x={scene.x}
                      y={scene.y}
                      biome={Math.floor((scene.id - 1) / 20)}
                      motion={save.settings.motion && !replaying}
                    />
                  )}
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 13,
                      alignItems: 'center',
                    }}
                  >
                    <T style={{ fontFamily: F.scientific, fontSize: 12, color: '#52694e' }}>
                      Ici commence votre herbier
                    </T>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 16, left: 25, right: 25, alignItems: 'center' }}
        >
          <View
            style={{
              backgroundColor: '#f4e8ccd9',
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#b5a575',
            }}
          >
            <T
              maxFontSizeMultiplier={1.3}
              style={{ fontFamily: F.scientific, fontSize: 12, color: C.green }}
            >
              {frontier === 100 && save.completed[100]
                ? 'Tous les paysages ont repris vie'
                : 'Le chemin s’ouvre à chaque page'}
            </T>
          </View>
        </View>
      </JourneyFrame>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Revenir à ma page sur le chemin"
        onPress={jump}
        style={({ pressed }) => ({
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 7,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Icon name="leaf-outline" size={20} />
        <T maxFontSizeMultiplier={1.3} style={{ fontFamily: F.scientific, fontSize: 14 }}>
          Ma page · {String(save.current).padStart(2, '0')}
        </T>
      </Pressable>
    </>
  );
}
const JourneyNode = memo(function JourneyNode({
  id,
  x,
  y,
  active,
  next,
  stars,
  onSelect,
}: {
  id: number;
  x: number;
  y: number;
  active: boolean;
  next: boolean;
  stars: number;
  onSelect: (id: number) => void;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x - 37,
        top: y - 37,
        width: 74,
        height: 96,
        alignItems: 'center',
      }}
    >
      <Pressable
        testID={`journey-page-${id}`}
        accessibilityRole="button"
        accessibilityLabel={`Page ${id}`}
        accessibilityHint={`${active ? 'Votre page. ' : ''}${stars ? `${stars} étoiles sur 3. Rejouer cette page.` : 'Page à explorer.'}`}
        onPress={() => onSelect(id)}
        style={({ pressed }) => ({
          width: 68,
          height: 68,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Svg
          width="68"
          height="68"
          viewBox="0 0 72 72"
          style={StyleSheet.absoluteFill}
          accessible={false}
        >
          <Circle cx="36" cy="39" r="30" fill="#5a6848" opacity="0.23" />
          <Path
            d="M36 2Q43 9 52 7Q55 17 65 20Q63 30 70 36Q63 44 65 53Q55 55 52 65Q42 63 36 70Q29 63 20 65Q17 55 7 52Q9 43 2 36Q9 29 7 20Q17 17 20 7Q29 9 36 2Z"
            fill={active ? '#365c49' : '#d4bc87'}
            stroke="#92784d"
            strokeWidth="0.7"
          />
          <Circle
            cx="36"
            cy="36"
            r="27"
            fill={active ? '#365c49' : '#f1e7c9'}
            stroke={active ? '#e2c77f' : '#ab945e'}
            strokeWidth="1"
          />
          <Path
            d="M16 40Q11 27 23 17M49 17Q62 28 56 41M19 47Q36 58 53 47"
            fill="none"
            stroke={active ? '#d9c28c' : '#8a9c70'}
            strokeWidth="0.7"
          />
          <Path
            d="M18 36Q7 32 14 25Q21 29 18 36M54 28Q66 25 59 18Q52 21 54 28"
            fill={active ? '#a7b382' : '#9eaf7e'}
            stroke="#7e9063"
            strokeWidth="0.5"
          />
          {id % 5 === 0 && (
            <Path
              d="m36 52 3 3 5-1-1 4 3 3-5 1-2 4-3-4-4 1 1-5-3-3 5-1Z"
              fill="#ae6957"
              stroke="#825541"
              strokeWidth="0.5"
            />
          )}
        </Svg>
        <T
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: F.display,
            fontSize: 25,
            lineHeight: 30,
            color: active ? '#f5e8bf' : C.green,
            marginTop: -3,
          }}
        >
          {String(id).padStart(2, '0')}
        </T>
      </Pressable>
      <T
        testID={`journey-stars-${id}`}
        accessibilityLabel={stars ? `${stars} étoiles sur 3` : 'Aucune étoile pour le moment'}
        style={{
          fontSize: 14,
          lineHeight: 18,
          letterSpacing: 1,
          color: stars ? '#956d2d' : '#536e54',
          fontFamily: stars ? F.body : F.scientific,
        }}
      >
        {stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : next ? 'À vous' : 'En cours'}
      </T>
    </View>
  );
});
function MapLife({
  x,
  y,
  biome,
  motion,
}: {
  x: number;
  y: number;
  biome: number;
  motion: boolean;
}) {
  const { value, settled } = useNativeProgress(2600, motion);
  if (settled) return null;
  return (
    <Animated.View
      pointerEvents="none"
      testID="journey-life-animating"
      style={{
        position: 'absolute',
        left: x - 80,
        top: y - 85,
        width: 160,
        height: 85,
        opacity: value.interpolate({
          inputRange: [0, 0.2, 0.75, 1],
          outputRange: [0, 0.9, 0.7, 0],
        }),
        transform: [
          { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [-25, 35] }) },
          { translateY: value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [24, 0, -18] }) },
        ],
      }}
    >
      <Svg width="160" height="85" viewBox="0 0 160 85" accessible={false}>
        <G fill={biome === 1 ? '#ede2a0' : '#f6e9c1'}>
          <Circle cx="20" cy="39" r="1.8" />
          <Circle cx="62" cy="58" r="1.3" />
          <Circle cx="108" cy="26" r="2" />
          <Path d="m134 10 2 6 5 2-5 2-2 6-2-6-5-2 5-2Z" />
        </G>
        <G transform="translate(70 30) rotate(-18)" stroke="#78845b" strokeWidth="0.7">
          <Path
            d="M0 0Q-27-24-22-2Q-13 8 0 0Q23-22 25-3Q15 9 0 0M0 0Q-15 19-3 16Q0 9 0 0Q20 11 9 17Q2 11 0 0"
            fill={biome === 4 ? '#b7a4bf' : '#dfc893'}
          />
          <Path d="M0-5V10M0-4-4-9M0-4 4-9" fill="none" />
        </G>
      </Svg>
    </Animated.View>
  );
}
