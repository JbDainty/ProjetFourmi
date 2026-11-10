import React, { memo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { chapters } from '../data/botany';
import { plantsForEcosystem } from '../data/ecology';
import { restoration, type Save } from '../state/model';
import { F } from './fonts';
import { Button, C, T } from './ui';

const BOOKS_PER_SHELF = 4;
/** Small engraved cover, with no measured SVG frame, texture or decoded plant image. */
const BookEngraving = memo(function BookEngraving() {
  return (
    <Svg width={52} height={48} viewBox="0 0 70 64" accessible={false}>
      <G fill="none" stroke="#e6d29a" strokeLinecap="round" strokeLinejoin="round">
        <Path
          d="M35 57Q40 31 32 10M36 44Q15 42 18 26Q37 29 36 44M36 34Q56 32 52 18Q36 21 36 34M32 19Q20 12 29 5Q39 10 32 19"
          strokeWidth="1.3"
        />
        <Path
          d="M20 55Q11 42 14 30M48 55Q58 44 58 32M24 53Q35 49 46 53"
          strokeWidth=".65"
          opacity=".65"
        />
        <Circle cx="35" cy="59" r="1.5" fill="#e6d29a" />
      </G>
    </Svg>
  );
});

export function HerbariumShelf({ save }: { save: Save }) {
  const params = useLocalSearchParams<{ shelf?: string }>();
  const remembered = Number(params.shelf);
  const [shelf, setShelf] = useState(
    Number.isInteger(remembered) && remembered >= 0 && remembered < 5 ? remembered : 0,
  );
  const { width, fontScale } = useWindowDimensions();
  const count = Math.ceil(chapters.length / BOOKS_PER_SHELF);
  const first = shelf * BOOKS_PER_SHELF;
  const turnShelf = (next: number) => {
    setShelf(next);
    router.setParams({ shelf: String(next) });
  };
  const coverHeight =
    Math.max(182, Math.min(232, (width - 70) * 0.57)) +
    Math.max(0, Math.min(fontScale, 1.8) - 1) * 70;
  return (
    <View testID="herbarium-shelf" style={{ width: '100%', maxWidth: 740, alignSelf: 'center' }}>
      <T
        style={{ color: C.muted, marginBottom: 14, fontFamily: F.scientific, textAlign: 'center' }}
      >
        Choisissez un livre, puis feuilletez ses dix planches.
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {chapters.slice(first, first + BOOKS_PER_SHELF).map((eco, offset) => {
          const index = first + offset;
          const plants = plantsForEcosystem(index);
          const done = plants.filter((p) => restoration(save, p) === 5).length;
          return (
            <Pressable
              key={index}
              testID={`herbarium-book-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir le carnet ${eco.name}`}
              accessibilityHint={`${done} planches estampillées sur ${plants.length}`}
              onPress={() => router.push(`/carnet?ecosystem=${index}` as Href)}
              style={({ pressed }) => ({
                width: '47%',
                flexGrow: 1,
                flexBasis: '45%',
                height: coverHeight,
                backgroundColor:
                  '#' +
                  eco.color
                    .slice(1)
                    .match(/../g)!
                    .map((v) =>
                      Math.round(parseInt(v, 16) * 0.67)
                        .toString(16)
                        .padStart(2, '0'),
                    )
                    .join(''),
                borderColor: '#a98e58',
                borderWidth: 1,
                borderRadius: 9,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
                padding: 13,
                paddingLeft: 21,
                opacity: pressed ? 0.8 : 1,
                overflow: 'hidden',
              })}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 0,
                  bottom: 0,
                  width: 5,
                  backgroundColor: '#263d3333',
                  borderRightWidth: 1,
                  borderRightColor: '#e2cb8d66',
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 14,
                  right: 7,
                  top: 7,
                  bottom: 7,
                  borderWidth: 0.7,
                  borderRadius: 8,
                  borderColor: '#efe1af8c',
                }}
              />
              <T
                maxFontSizeMultiplier={1.3}
                style={{
                  fontSize: 9,
                  lineHeight: 14,
                  color: '#fff3cf',
                  letterSpacing: 1.5,
                  textAlign: 'center',
                }}
              >
                CARNET {String(index + 1).padStart(2, '0')}
              </T>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <BookEngraving />
                <T
                  serif
                  maxFontSizeMultiplier={1.3}
                  style={{
                    fontSize: width < 360 ? 19 : 22,
                    lineHeight: width < 360 ? 22 : 25,
                    textAlign: 'center',
                    color: '#fff5d8',
                  }}
                >
                  {eco.name}
                </T>
              </View>
              <T
                maxFontSizeMultiplier={1.3}
                style={{
                  fontFamily: F.scientific,
                  fontSize: 12,
                  lineHeight: 17,
                  color: '#fff3cf',
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                {done} / {plants.length} estampillées
              </T>
            </Pressable>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          secondary
          icon="arrow-undo-outline"
          disabled={shelf === 0}
          onPress={() => turnShelf(shelf - 1)}
          style={{ paddingHorizontal: 10 }}
        >
          Avant
        </Button>
        <T
          testID="herbarium-shelf-page"
          accessibilityLiveRegion="polite"
          style={{ color: C.muted, fontFamily: F.scientific }}
        >
          {shelf + 1} / {count}
        </T>
        <Button
          secondary
          icon="arrow-forward-outline"
          disabled={shelf + 1 === count}
          onPress={() => turnShelf(shelf + 1)}
          style={{ paddingHorizontal: 10 }}
        >
          Suite
        </Button>
      </View>
    </View>
  );
}
