import React from 'react';
import { View, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Slot, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { botanicalFonts } from '../src/components/fonts';
import { GameProvider, useGame } from '../src/state/store';
import { T, C } from '../src/components/ui';
import { PaperTexture } from '../src/components/Paper';
import { GreenhouseBackdrop } from '../src/components/Greenhouse';
import { SceneVeil } from '../src/components/SceneVeil';
import { SceneSizeContext } from '../src/components/SceneSize';
import { PageTurn, PageTurnContext, type TurningPage } from '../src/components/PageTurn';
import { planBookTurn } from '../src/animation/book';
import { playPageSound } from '../src/services/pageSounds';
import { HerbariumTitle } from '../src/components/HerbariumTitle';
import { HerbariumBookButton } from '../src/components/HerbariumBookButton';
import { basePath } from '../src/config/paths';
import { BookChromeContext, bookHeaderHeight } from '../src/components/BookScrollView';
import { Soundscape } from '../src/components/Soundscape';
import { unlockAmbience } from '../src/services/ambience';
import { SeedPouch } from '../src/components/SeedPouch';
import { BookEntrance } from '../src/components/BookEntrance';
import { HintSlot, hintLayoutKey } from '../src/components/HintSlot';
import { workshopLayout } from '../src/layout/workshop';
import { BookActionsContext } from '../src/components/BookActions';
function Shell() {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions(),
    mobile = width < 800,
    path = usePathname(),
    playing = path === '/atelier',
    home = path === '/';
  const { save, setSave, ready, error, retry } = useGame();
  const [replayOpen, setReplayOpen] = React.useState(false);
  const [sceneHeight, setSceneHeight] = React.useState(0);
  const [availableWidth, setAvailableWidth] = React.useState(0);
  const [greenhouseReady, setGreenhouseReady] = React.useState(false);
  const [hintReadyKey, setHintReadyKey] = React.useState('');
  const [workshopRequest, setWorkshopRequest] = React.useState<{
    replace: boolean;
    owner: string;
  } | null>(null);
  const requested = React.useRef(false);
  const geometry = workshopLayout(width, availableWidth);
  const measureKey = hintLayoutKey(geometry.boardWidth, fontScale);
  const sceneReady = greenhouseReady && availableWidth > 0 && hintReadyKey === measureKey;
  const onGreenhouseReady = React.useCallback(() => setGreenhouseReady(true), []);
  const openWorkshop = (replace = false) => {
    if (requested.current || !save.started || replayOpen) return;
    requested.current = true;
    if (sceneReady) {
      if (replace) router.replace('/atelier');
      else router.push('/atelier');
    } else setWorkshopRequest({ replace, owner: path });
  };
  React.useEffect(() => {
    requested.current = false;
  }, [path]);
  React.useEffect(() => {
    if (!workshopRequest) return;
    if (workshopRequest.owner !== path || !save.started || replayOpen) {
      setWorkshopRequest(null);
      requested.current = false;
      return;
    }
    if (!sceneReady) return;
    setWorkshopRequest(null);
    if (workshopRequest.replace) router.replace('/atelier');
    else router.push('/atelier');
  }, [workshopRequest, path, sceneReady, save.started, replayOpen]);
  React.useEffect(() => {
    if (!save.started) {
      setReplayOpen(false);
      setGreenhouseReady(false);
      setHintReadyKey('');
    }
  }, [save.started]);
  const [turn, setTurn] = React.useState<TurningPage | null>(null);
  const pendingTurn = React.useRef<(() => void) | null>(null);
  const turning = React.useRef(false);
  const stopPageSound = React.useRef<() => void>(() => {});
  React.useEffect(() => () => stopPageSound.current(), []);
  React.useEffect(() => {
    if (!save.settings.sound) stopPageSound.current();
  }, [save.settings.sound]);
  const turnPage = (target: number, commit: () => void) => {
    if (turning.current) return;
    const planned = planBookTurn(save, target, Date.now());
    stopPageSound.current();
    stopPageSound.current = playPageSound(planned.kind, save.settings.sound, save.settings.motion);
    if (!save.settings.motion) {
      commit();
      return;
    }
    turning.current = true;
    pendingTurn.current = commit;
    setTurn(planned);
  };
  const commitTurn = () => {
    const commit = pendingTurn.current;
    pendingTurn.current = null;
    commit?.();
  };
  React.useEffect(() => {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    )
      void navigator.serviceWorker
        .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
        .catch(() => {});
  }, []);
  const header = (
    <>
      {!home && (
        <View
          pointerEvents="box-none"
          testID="game-hud"
          style={{
            minHeight: bookHeaderHeight,
            paddingTop: 6,
            paddingHorizontal: mobile ? 16 : 28,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          <HerbariumBookButton
            motion={save.settings.motion && !replayOpen}
            onHome={() => router.dismissTo('/')}
          />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <HerbariumTitle compact={mobile} motion={save.settings.motion} />
          </View>
          <SeedPouch count={save.seeds} motion={save.settings.motion && !replayOpen} />
        </View>
      )}
      {error && (
        <Pressable
          onPress={retry}
          style={{
            padding: 12,
            backgroundColor: '#f0dfcf',
            zIndex: 21,
          }}
        >
          <T accessibilityRole="alert">{error}</T>
        </Pressable>
      )}
    </>
  );
  return (
    <SafeAreaView
      onTouchStart={Platform.OS === 'web' ? undefined : unlockAmbience}
      style={{ flex: 1, backgroundColor: C.paper, zIndex: 0 }}
    >
      <Soundscape
        music={ready && save.settings.music}
        sound={save.settings.sound}
        started={ready && save.started && !replayOpen && path !== '/aide'}
        ecosystem={Math.floor((save.current - 1) / 20)}
      />
      <PaperTexture background />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          overflow: 'hidden',
          opacity: playing ? 1 : 0,
        }}
      >
        <View
          testID="greenhouse-world-background"
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: Math.max(height, sceneHeight + insets.top),
          }}
        >
          {ready && save.started && <GreenhouseBackdrop onReady={onGreenhouseReady} />}
          <SceneVeil
            ground={C.paper}
            tint={
              save.theme === 'sauge' ? '#ecf0e4' : save.theme === 'rose' ? '#f5eae3' : undefined
            }
          />
        </View>
      </View>
      {ready && save.started && availableWidth > 0 && (
        <View
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: 0, left: 0, width: geometry.boardWidth, opacity: 0 }}
        >
          <HintSlot
            key={measureKey}
            layoutWidth={geometry.boardWidth}
            measureOnly
            onReady={setHintReadyKey}
          />
        </View>
      )}
      <StatusBar style="dark" />
      <View
        style={{ flex: 1 }}
        onLayout={({ nativeEvent: { layout } }) => setAvailableWidth(layout.width)}
        aria-hidden={!save.started || replayOpen}
        accessibilityElementsHidden={!save.started || replayOpen}
        importantForAccessibility={!save.started || replayOpen ? 'no-hide-descendants' : 'auto'}
      >
        {ready ? (
          <SceneSizeContext.Provider value={setSceneHeight}>
            <PageTurnContext.Provider value={turnPage}>
              <BookChromeContext.Provider
                value={{ header, motion: save.settings.motion, availableWidth }}
              >
                <BookActionsContext.Provider
                  value={{
                    replayPrologue: () => setReplayOpen(true),
                    replaying: replayOpen,
                    openWorkshop,
                    enteringWorkshop: !!workshopRequest,
                  }}
                >
                  <Slot />
                </BookActionsContext.Provider>
              </BookChromeContext.Provider>
            </PageTurnContext.Provider>
          </SceneSizeContext.Provider>
        ) : (
          <View style={{ padding: 40, marginTop: 88 }}>
            <T>Ouverture du carnet…</T>
          </View>
        )}
      </View>
      {ready && (!save.started || replayOpen) && (
        <BookEntrance
          key={replayOpen ? 'replay' : 'signature'}
          returning={false}
          replayOnly={replayOpen}
          onReplayDone={() => setReplayOpen(false)}
          nickname={save.nickname}
          motion={save.settings.motion}
          music={save.settings.music}
          onMusicChange={(enabled) =>
            setSave((value) => ({ ...value, settings: { ...value.settings, music: enabled } }))
          }
          onEnter={(nickname) => {
            unlockAmbience();
            if (!save.started) setSave((value) => ({ ...value, nickname, started: true }));
            router.replace('/');
          }}
        />
      )}
      {turn && (
        <PageTurn
          key={turn.id}
          page={turn}
          onCovered={commitTurn}
          onFinished={() => {
            stopPageSound.current();
            turning.current = false;
            setTurn(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}
export default function Layout() {
  const [loaded, error] = useFonts(botanicalFonts);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <GameProvider>
        <Shell />
      </GameProvider>
    </SafeAreaProvider>
  );
}
