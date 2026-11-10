import React, { memo, useRef, useState, useContext } from 'react';
import { Animated, Image, FlatList, View, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import type { Save } from '../state/model';
import { chapters } from '../data/botany';
import { ecosystemForPage } from '../data/ecology';
import { journeyLandscapes } from '../data/journeyLandscapes';
import { T, C, Icon } from './ui';
import { F } from './fonts';
import { JourneyFrame } from './JourneyFrame';
import { useMeasuredSize } from './useMeasuredSize';
import { useNativeProgress } from './useNativeProgress';
import { BookActionsContext } from './BookActions';
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
  const { size, ref, onLayout } = useMeasuredSize(),
    list = useRef<FlatList<number>>(null);
  const { replaying } = useContext(BookActionsContext);
  const highest = Math.floor((frontier - 1) / 3),
    rows = Array.from({ length: highest + 1 }, (_, i) => highest - i);
  const scale = size.width / 360,
    rowHeight = 152 * scale;
  const [visible, setVisible] = useState(save.current);
  const latest = useRef({ onBiome, frontier });
  latest.current = { onBiome, frontier };
  const viewable = useRef(({ viewableItems }: any) => {
    const item = viewableItems.find((x: any) => x.isViewable);
    if (item) {
      const page = Math.min(latest.current.frontier, item.item * 3 + 2);
      setVisible(page);
      latest.current.onBiome(ecosystemForPage(page));
    }
  }).current;
  const jump = () =>
    list.current?.scrollToIndex({
      index: highest - Math.floor((save.current - 1) / 3),
      animated: save.settings.motion,
      viewPosition: 0.4,
    });
  return (
    <>
      <JourneyFrame>
        <View ref={ref} onLayout={onLayout} collapsable={false} style={{ flex: 1, minHeight: 0 }}>
          {scale > 0 && (
            <FlatList
              key={`${frontier}/${save.current}/${size.width}/${size.height}`}
              ref={list}
              testID="ecosystem-map-scroll"
              data={rows}
              keyExtractor={(row) => String(row)}
              initialScrollIndex={highest - Math.floor((Math.min(save.current, frontier) - 1) / 3)}
              getItemLayout={(_, index) => ({
                index,
                length: rowHeight,
                offset: index * rowHeight,
              })}
              initialNumToRender={5}
              maxToRenderPerBatch={4}
              windowSize={5}
              removeClippedSubviews
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              onViewableItemsChanged={viewable}
              viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
              style={{ flex: 1, overscrollBehavior: 'contain' } as any}
              renderItem={({ item: row }) => {
                const page = Math.min(frontier, row * 3 + 2),
                  eco = ecosystemForPage(page),
                  reverse = row % 2 === 1;
                return (
                  <View
                    testID={`journey-row-${row}`}
                    style={{
                      height: rowHeight,
                      width: size.width,
                      overflow: 'hidden',
                      backgroundColor: chapters[eco].color,
                    }}
                  >
                    <Image
                      testID={`journey-biome-${eco}`}
                      source={journeyLandscapes[eco]}
                      resizeMode="cover"
                      fadeDuration={0}
                      style={{
                        position: 'absolute',
                        left: 0,
                        width: size.width,
                        height: rowHeight * 4,
                        top: -((4 - (row % 4)) % 4) * rowHeight,
                      }}
                    />
                    <View
                      pointerEvents="none"
                      style={[StyleSheet.absoluteFill, { backgroundColor: '#f4ead62b' }]}
                    />
                    <Svg
                      width={size.width}
                      height={rowHeight}
                      viewBox="0 0 360 152"
                      style={StyleSheet.absoluteFill}
                      accessible={false}
                    >
                      <Path
                        d={`M20 72H340M${reverse ? 30 : 330} 72Q${reverse ? 4 : 356} 72 ${reverse ? 4 : 356} 152`}
                        stroke="#ac8c53"
                        strokeWidth="12"
                        opacity=".75"
                        fill="none"
                      />
                      <Path
                        d="M20 72H340"
                        stroke="#f6e5b8"
                        strokeWidth="2"
                        strokeDasharray="2 8"
                        fill="none"
                      />
                    </Svg>
                    {[0, 1, 2].map((col) => {
                      const id = row * 3 + col + 1;
                      if (id > frontier) return null;
                      return (
                        <JourneyNode
                          key={id}
                          id={id}
                          x={(reverse ? 292 - col * 112 : 68 + col * 112) * scale}
                          y={72 * scale}
                          active={save.current === id}
                          next={frontier === id && !save.completed[id]}
                          stars={save.completed[id]?.stars ?? 0}
                          onSelect={onSelect}
                        />
                      );
                    })}
                    {row * 3 < visible &&
                      row * 3 + 3 >= visible &&
                      (save.completed[visible] || save.completed[visible - 1]) && (
                        <MapLife
                          key={`${visible}/${replaying}`}
                          x={180 * scale}
                          y={125 * scale}
                          biome={eco % 5}
                          motion={save.settings.motion}
                        />
                      )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </JourneyFrame>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Revenir à ma page"
        onPress={jump}
        style={{
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name="leaf-outline" size={20} />
        <T style={{ fontFamily: F.scientific }}>Ma page · {save.current}</T>
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
      <View
        style={{
          backgroundColor: '#f1e5c8ed',
          borderRadius: 8,
          paddingHorizontal: 6,
          paddingVertical: 1,
          marginTop: 1,
          minWidth: 54,
          alignItems: 'center',
          borderWidth: 0.5,
          borderColor: '#b29d6c',
        }}
      >
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
