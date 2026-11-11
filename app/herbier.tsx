import React, { useCallback, useContext, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { species } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { restoration } from '../src/state/model';
import { HerbariumPlate } from '../src/components/HerbariumPlate';
import { HerbariumShelf } from '../src/components/HerbariumShelf';
import { HerbariumPigments } from '../src/components/HerbariumPigments';
import { HerbariumBookButton } from '../src/components/HerbariumBookButton';
import { SeedPouch } from '../src/components/SeedPouch';
import { BookChromeContext } from '../src/components/BookScrollView';
import { useMeasuredSize } from '../src/components/useMeasuredSize';
import { herbariumLayout } from '../src/layout/herbarium';
import { F } from '../src/components/fonts';
import { T, C, Icon } from '../src/components/ui';

export default function Herbier() {
  const { save } = useGame(),
    params = useLocalSearchParams<{ plant?: string }>(),
    window = useWindowDimensions();
  const chrome = useContext(BookChromeContext),
    measured = useMeasuredSize();
  const width = measured.size.width || chrome.availableWidth || window.width;
  const height = measured.size.height || chrome.availableHeight || window.height;
  const layout = herbariumLayout(width, height, window.fontScale);
  const linkedPlant = Number(params.plant);
  const initialPlant =
    params.plant !== undefined &&
    Number.isInteger(linkedPlant) &&
    linkedPlant >= 0 &&
    linkedPlant < species.length
      ? linkedPlant
      : null;
  const [selected, select] = useState<number | null>(initialPlant),
    [direct, setDirect] = useState(initialPlant !== null);
  const [pigments, setPigments] = useState(false),
    [zoom, setZoom] = useState(false),
    [pigmentStart, setPigmentStart] = useState(0),
    [opening, setOpening] = useState(false);
  const closePlate = useCallback(() => {
    // A closed deep link must return to the library after an album visit too.
    router.setParams({ plant: undefined });
    select(null);
    setDirect(false);
  }, []);
  if (direct && selected !== null)
    return (
      <HerbariumPlate
        selected={selected}
        save={save}
        width={width}
        zoom={zoom}
        onZoom={() => setZoom((value) => !value)}
        onClose={closePlate}
        direct
      />
    );
  const complete = species.filter((_, i) => restoration(save, i) === 5).length;
  return (
    <View
      ref={measured.ref}
      collapsable={false}
      onLayout={measured.onLayout}
      testID="herbarium-library-screen"
      style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
    >
      <View
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: 1160,
          alignSelf: 'center',
          padding: layout.padding,
        }}
      >
        <View
          testID="game-hud"
          style={{ height: layout.hudHeight, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <HerbariumBookButton
            compact
            motion={save.settings.motion && !opening}
            onHome={() => router.dismissTo('/')}
          />
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <T
              testID="herbarium-collection-title"
              accessibilityRole="header"
              serif
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.2}
              style={{
                fontSize: layout.short ? 23 : 31,
                lineHeight: layout.short ? 29 : 37,
                color: C.green,
                textAlign: 'center',
              }}
            >
              Le Grand Herbier
            </T>
            {!layout.short && (
              <T
                numberOfLines={1}
                maxFontSizeMultiplier={1.1}
                style={{ fontFamily: F.scientific, fontSize: 12, lineHeight: 16, color: C.muted }}
              >
                Vingt carnets, deux cents rencontres.
              </T>
            )}
          </View>
          <SeedPouch compact count={save.seeds} motion={save.settings.motion && !opening} />
        </View>
        <View style={{ height: layout.tabHeight, flexDirection: 'row', gap: 8 }}>
          {[
            {
              name: 'Les planches',
              icon: 'book-outline' as const,
              active: !pigments,
              value: false,
            },
            {
              name: 'Pigments et sceaux',
              icon: 'water-outline' as const,
              active: pigments,
              value: true,
            },
          ].map((tab) => (
            <Pressable
              key={tab.name}
              accessibilityRole="button"
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: tab.active }}
              onPress={() => setPigments(tab.value)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 44,
                borderRadius: 15,
                borderWidth: 0.8,
                borderColor: tab.active ? '#8f8151' : '#c5b58d',
                backgroundColor: tab.active ? '#365c49' : '#efe4c777',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                paddingHorizontal: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Icon
                name={tab.icon}
                size={width < 360 ? 16 : 19}
                color={tab.active ? '#eee1b8' : '#607353'}
              />
              <T
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                maxFontSizeMultiplier={1.2}
                style={{
                  fontFamily: F.scientific,
                  fontSize: width < 360 ? 13 : 16,
                  lineHeight: 20,
                  color: tab.active ? '#fff1cd' : C.green,
                }}
              >
                {tab.name}
              </T>
            </Pressable>
          ))}
        </View>
        <View
          style={{ height: layout.summaryHeight, alignItems: 'center', justifyContent: 'center' }}
        >
          <T
            testID="herbarium-collection-progress"
            numberOfLines={1}
            maxFontSizeMultiplier={1.15}
            style={{ fontSize: 10, lineHeight: 14, letterSpacing: 1, color: C.muted }}
          >
            {complete} / 200 PLANCHES ESTAMPILLÉES
          </T>
        </View>
        <View style={{ height: 12 }} />
        {pigments ? (
          <HerbariumPigments
            save={save}
            layout={layout}
            anchor={pigmentStart}
            onPage={setPigmentStart}
          />
        ) : (
          <HerbariumShelf save={save} layout={layout} onBusyChange={setOpening} />
        )}
      </View>
    </View>
  );
}
