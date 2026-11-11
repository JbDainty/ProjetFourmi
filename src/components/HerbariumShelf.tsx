import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, Pressable, View } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, type Href } from 'expo-router';
import { chapters } from '../data/botany';
import { plantsForEcosystem } from '../data/ecology';
import { restoration, type Save } from '../state/model';
import type { HerbariumLayout } from '../layout/herbarium';
import { F } from './fonts';
import { Button, C, T } from './ui';
import { AntiqueHerbarium, OpeningHerbarium } from './AntiqueHerbarium';
import { useAmbientMotion } from './usePrimaryAnimation';
import { preparePageArtwork } from '../services/pageArtwork';

/** One shared native clock lights one binding at a time; no SVG frame updates. */
function useBindingLight(enabled: boolean) {
  const active = useAmbientMotion(enabled),
    value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let run: Animated.CompositeAnimation | undefined;
    const sync = (foreground: boolean) => {
      run?.stop();
      value.setValue(0);
      if (!active || !foreground) return;
      run = Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      );
      run.start();
    };
    sync(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const listener = AppState.addEventListener('change', (state) => sync(state === 'active'));
    return () => {
      listener.remove();
      run?.stop();
      value.stopAnimation();
    };
  }, [active, value]);
  return value;
}
export function HerbariumShelf({
  save,
  layout,
  onBusyChange,
}: {
  save: Save;
  layout: HerbariumLayout;
  onBusyChange: (busy: boolean) => void;
}) {
  const params = useLocalSearchParams<{ shelf?: string; volume?: string }>();
  const remembered =
    params.volume !== undefined ? Number(params.volume) : Number(params.shelf ?? 0) * 4;
  const [anchor, setAnchor] = useState(
    Number.isInteger(remembered) && remembered >= 0 && remembered < chapters.length
      ? remembered
      : 0,
  );
  const [opening, setOpening] = useState<number | null>(null),
    [focused, setFocused] = useState(true);
  const activated = useRef(false),
    alive = useRef(true);
  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      activated.current = false;
      setOpening(null);
      setFocused(true);
      onBusyChange(false);
      return () => {
        alive.current = false;
        setFocused(false);
      };
    }, [onBusyChange]),
  );
  useEffect(() => () => onBusyChange(false), [onBusyChange]);
  const previousPageSize = useRef(layout.booksPerPage);
  useEffect(() => {
    if (previousPageSize.current === layout.booksPerPage) return;
    previousPageSize.current = layout.booksPerPage;
    // A resize can move the chosen volume onto another page. Cancel its old
    // pose rather than leaving an invisible opening locked in progress.
    activated.current = false;
    setOpening(null);
    onBusyChange(false);
  }, [layout.booksPerPage, onBusyChange]);
  const light = useBindingLight(save.settings.motion && focused && opening === null);
  const perPage = layout.booksPerPage,
    first = Math.floor(anchor / perPage) * perPage;
  const page = first / perPage,
    count = Math.ceil(chapters.length / perPage);
  const turnShelf = (next: number) => {
    if (activated.current) return;
    const start = Math.max(0, Math.min(chapters.length - 1, next));
    setAnchor(start);
    router.setParams({ shelf: String(Math.floor(start / 4)), volume: String(start) });
  };
  const enter = (index: number) => {
    if (!alive.current || !activated.current) return;
    router.push(`/carnet?ecosystem=${index}` as Href);
  };
  const open = (index: number) => {
    if (activated.current || !alive.current) return;
    activated.current = true;
    const plant = plantsForEcosystem(index)[0];
    preparePageArtwork(plant, restoration(save, plant));
    if (!save.settings.motion) {
      enter(index);
      return;
    }
    onBusyChange(true);
    setOpening(index);
  };
  return (
    <View
      testID="herbarium-shelf"
      style={{ flex: 1, minHeight: 0, width: '100%', alignItems: 'center' }}
    >
      <View style={{ flex: 1, minHeight: 0, justifyContent: 'center', alignItems: 'center' }}>
        <View
          testID="herbarium-volume-grid"
          style={{
            width: layout.gridWidth,
            height: layout.gridHeight,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: layout.gap,
          }}
        >
          {chapters.slice(first, first + perPage).map((eco, offset) => {
            const index = first + offset,
              plants = plantsForEcosystem(index),
              done = plants.filter((p) => restoration(save, p) === 5).length;
            const art = (
              <AntiqueHerbarium
                index={index}
                title={eco.name}
                color={eco.color}
                done={done}
                total={plants.length}
                width={layout.bookWidth}
                height={layout.bookHeight}
                glimmer={light}
              />
            );
            return (
              <Pressable
                key={index}
                testID={`herbarium-book-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir le carnet ${eco.name}`}
                accessibilityHint={`${done} planches estampillées sur ${plants.length}`}
                accessibilityState={{ busy: opening === index, disabled: opening !== null }}
                disabled={opening !== null}
                onPress={() => open(index)}
                style={({ pressed }) => ({
                  width: layout.bookWidth,
                  height: layout.bookHeight,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                {opening === index ? (
                  <OpeningHerbarium onDone={() => enter(index)}>{art}</OpeningHerbarium>
                ) : (
                  art
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View
        style={{
          width: '100%',
          maxWidth: 500,
          height: layout.pagerHeight,
          marginTop: layout.gap,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Button
          secondary
          icon="arrow-undo-outline"
          disabled={page === 0 || opening !== null}
          onPress={() => turnShelf(first - perPage)}
          style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 10 }}
        >
          Avant
        </Button>
        <View style={{ alignItems: 'center' }}>
          <T
            maxFontSizeMultiplier={1.15}
            style={{ fontFamily: F.scientific, color: C.muted, fontSize: 11, lineHeight: 15 }}
          >
            Carnets {String(first + 1).padStart(2, '0')}–
            {String(Math.min(first + perPage, chapters.length)).padStart(2, '0')}
          </T>
          <T
            testID="herbarium-shelf-page"
            accessibilityLiveRegion="polite"
            style={{ color: C.green, fontFamily: F.scientific, fontSize: 13, lineHeight: 17 }}
          >
            {page + 1} / {count}
          </T>
        </View>
        <Button
          secondary
          icon="arrow-forward-outline"
          disabled={page + 1 === count || opening !== null}
          onPress={() => turnShelf(first + perPage)}
          style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 10 }}
        >
          Suite
        </Button>
      </View>
    </View>
  );
}
