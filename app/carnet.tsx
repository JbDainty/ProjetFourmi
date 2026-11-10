import React, { useState, useRef, useEffect } from 'react';
import { Animated, Platform, View, PanResponder, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { plantsForEcosystem } from '../src/data/ecology';
import { chapters } from '../src/data/botany';
import { restoration } from '../src/state/model';
import { useGame } from '../src/state/store';
import { HerbariumPlate } from './herbier';
import { Button, T, C } from '../src/components/ui';
import { preparePageArtwork } from '../src/services/pageArtwork';
export default function Carnet() {
  const { ecosystem } = useLocalSearchParams<{ ecosystem: string }>(),
    eco = Number(ecosystem);
  const { save } = useGame(),
    { width } = useWindowDimensions();
  const plants = plantsForEcosystem(Number.isInteger(eco) && eco >= 0 && eco < 20 ? eco : 0);
  const [page, setPage] = useState(0),
    [zoom, setZoom] = useState(false),
    [busy, setBusy] = useState(false);
  const alpha = useRef(new Animated.Value(1)).current,
    run = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => () => run.current?.stop(), []);
  useEffect(() => {
    for (const i of [page - 1, page + 1])
      if (plants[i] !== undefined) preparePageArtwork(plants[i], restoration(save, plants[i]));
  }, [page, eco]);
  const flip = (delta: number) => {
    const next = page + delta;
    if (busy || next < 0 || next >= plants.length) return;
    if (!save.settings.motion) {
      setPage(next);
      setZoom(false);
      return;
    }
    setBusy(true);
    run.current = Animated.timing(alpha, {
      toValue: 0,
      duration: 140,
      useNativeDriver: Platform.OS !== 'web',
    });
    run.current.start(({ finished }) => {
      if (!finished) return;
      setPage(next);
      setZoom(false);
      run.current = Animated.timing(alpha, {
        toValue: 1,
        duration: 240,
        useNativeDriver: Platform.OS !== 'web',
      });
      run.current.start(({ finished }) => {
        if (finished) setBusy(false);
      });
    });
  };
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 30 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 55) flip(g.dx < 0 ? 1 : -1);
    },
  });
  return (
    <View testID="ecosystem-album" style={{ flex: 1, minHeight: 0, backgroundColor: C.paper }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Button secondary icon="book-outline" onPress={() => router.back()}>
          Carnets
        </Button>
        <T serif style={{ fontSize: 21, flex: 1, textAlign: 'center' }}>
          {chapters[Number.isInteger(eco) && eco >= 0 && eco < 20 ? eco : 0].name}
        </T>
      </View>
      <Animated.View {...swipe.panHandlers} style={{ flex: 1, minHeight: 0, opacity: alpha }}>
        <HerbariumPlate
          selected={plants[page]}
          save={save}
          width={width}
          zoom={zoom}
          onZoom={() => setZoom((v) => !v)}
          onClose={() => router.back()}
        />
      </Animated.View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 10,
          gap: 6,
        }}
      >
        <Button
          secondary
          disabled={page === 0 || busy}
          icon="arrow-undo-outline"
          onPress={() => flip(-1)}
        >
          Précédente
        </Button>
        <T>
          {page + 1} / {plants.length}
        </T>
        <Button
          secondary
          style={{ flex: 1, paddingHorizontal: 8 }}
          disabled={page === plants.length - 1 || busy}
          onPress={() => flip(1)}
        >
          Suivante
        </Button>
      </View>
    </View>
  );
}
