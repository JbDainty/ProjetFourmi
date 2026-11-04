import React from 'react';
import { View, Pressable, ScrollView, Modal, useWindowDimensions, Platform } from 'react-native';
import { Slot, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { botanicalFonts } from '../src/components/fonts';
import { GameProvider, useGame } from '../src/state/store';
import { T, Label, Icon, Button, C, ui } from '../src/components/ui';
import { Paper, PaperTexture } from '../src/components/Paper';
import { GreenhouseBackdrop } from '../src/components/Greenhouse';
import { SceneVeil } from '../src/components/SceneVeil';
import { SceneSizeContext } from '../src/components/SceneSize';
import { PageTurn, PageTurnContext, type TurningPage } from '../src/components/PageTurn';
import { restoration } from '../src/state/model';
import { HerbariumTitle } from '../src/components/HerbariumTitle';
import { HerbariumBookButton } from '../src/components/HerbariumBookButton';
import { basePath } from '../src/config/paths';
const nav = [
  { path: '/', name: 'L’Atelier', icon: 'flask-outline' },
  { path: '/herbier', name: 'Le Grand Herbier', icon: 'book-outline' },
  { path: '/carte', name: 'Écosystèmes', icon: 'map-outline' },
  { path: '/boutique', name: 'La Boutique', icon: 'bag-handle-outline' },
  { path: '/parametres', name: 'Paramètres', icon: 'options-outline' },
] as const;
function Shell() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions(),
    mobile = width < 800,
    path = usePathname(),
    playing = path === '/';
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [sceneHeight, setSceneHeight] = React.useState(0);
  const { save, ready, error, retry } = useGame();
  const [turn, setTurn] = React.useState<TurningPage | null>(null);
  const pendingTurn = React.useRef<(() => void) | null>(null);
  const turning = React.useRef(false);
  const turnPage = (target: number, commit: () => void) => {
    if (turning.current) return;
    if (!save.settings.motion) {
      commit();
      return;
    }
    turning.current = true;
    pendingTurn.current = commit;
    const plant = Math.floor((save.current - 1) / 5);
    setTurn({
      id: Date.now(),
      from: save.started ? save.current : 0,
      to: target,
      plant,
      stage: restoration(save, plant),
    });
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
  const navigate = (destination: (typeof nav)[number]['path']) => {
    setMenuOpen(false);
    router.push(destination);
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper, zIndex: 0 }}>
      <PaperTexture background />
      {playing && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}
        >
          <View
            testID="greenhouse-world-background"
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: sceneHeight ? sceneHeight + insets.top : '100%',
            }}
          >
            <GreenhouseBackdrop />
            <SceneVeil
              ground={C.paper}
              tint={
                save.theme === 'sauge' ? '#ecf0e4' : save.theme === 'rose' ? '#f5eae3' : undefined
              }
            />
          </View>
        </View>
      )}
      <StatusBar style="dark" />
      <View
        pointerEvents="box-none"
        testID="game-hud"
        style={{
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingTop: 6,
          paddingHorizontal: mobile ? 16 : 28,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <HerbariumBookButton
          open={menuOpen}
          motion={save.settings.motion}
          onOpen={() => setMenuOpen(true)}
        />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <HerbariumTitle compact={mobile} motion={save.settings.motion} />
        </View>
        <View
          accessible
          accessibilityLabel={`Graines dorées : ${save.seeds}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            minHeight: 42,
            minWidth: 58,
            paddingHorizontal: 9,
            borderRadius: 22,
            backgroundColor: '#f4ead6e8',
          }}
        >
          <Icon name="seed-outline" color={C.gold} size={22} />
          <T style={{ fontSize: 16 }}>{save.seeds}</T>
        </View>
      </View>
      <View style={{ flex: 1, paddingTop: playing ? 0 : 100 }}>
        {error && (
          <Pressable
            onPress={retry}
            style={{
              padding: 12,
              marginTop: playing ? 100 : 0,
              backgroundColor: '#f0dfcf',
              zIndex: 21,
            }}
          >
            <T accessibilityRole="alert">{error}</T>
          </Pressable>
        )}
        {ready ? (
          <SceneSizeContext.Provider value={setSceneHeight}>
            <PageTurnContext.Provider value={turnPage}>
              <Slot />
            </PageTurnContext.Provider>
          </SceneSizeContext.Provider>
        ) : (
          <View style={{ padding: 40, marginTop: 88 }}>
            <T>Ouverture du carnet…</T>
          </View>
        )}
      </View>
      <Modal
        visible={menuOpen}
        transparent
        animationType={save.settings.motion ? 'fade' : 'none'}
        onRequestClose={() => setMenuOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#1e342bd4',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <ScrollView style={{ width: '100%', maxWidth: 430, maxHeight: '94%' }}>
            <Paper testID="game-carnet-menu" style={[ui.card, { padding: 26 }]}>
              <View style={[ui.row, { justifyContent: 'space-between' }]}>
                <Label>VOTRE CARNET</Label>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fermer le carnet"
                  onPress={() => setMenuOpen(false)}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="close-outline" size={24} />
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <HerbariumTitle compact={mobile} motion={save.settings.motion} />
              </View>
              <Button
                icon="flask-outline"
                onPress={() => (playing ? setMenuOpen(false) : navigate('/'))}
              >
                Reprendre la partie
              </Button>
              <View style={{ gap: 7, marginTop: 18 }}>
                {nav.map((n) => (
                  <Pressable
                    key={n.path}
                    accessibilityRole="link"
                    accessibilityLabel={n.name}
                    onPress={() => navigate(n.path)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      gap: 14,
                      alignItems: 'center',
                      minHeight: 48,
                      paddingHorizontal: 12,
                      borderRadius: 20,
                      backgroundColor:
                        path === n.path ? '#dde4cf' : pressed ? '#e8ddc5' : 'transparent',
                    })}
                  >
                    <Icon name={n.icon} size={25} color={C.green} />
                    <T style={{ fontSize: 16 }}>{n.name}</T>
                  </Pressable>
                ))}
              </View>
            </Paper>
          </ScrollView>
        </View>
      </Modal>
      {turn && (
        <PageTurn
          key={turn.id}
          page={turn}
          onCovered={commitTurn}
          onFinished={() => {
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
