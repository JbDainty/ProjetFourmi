import React from 'react';
import { View, Pressable, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Slot, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { botanicalFonts } from '../src/components/fonts';
import { GameProvider, useGame } from '../src/state/store';
import { T, Label, Icon, C, ui } from '../src/components/ui';
import { PaperTexture } from '../src/components/Paper';
import { basePath } from '../src/config/paths';
const nav = [
  { path: '/', name: 'L’Atelier', icon: 'flask-outline' },
  { path: '/herbier', name: 'Le Grand Herbier', icon: 'book-outline' },
  { path: '/carte', name: 'Écosystèmes', icon: 'map-outline' },
  { path: '/boutique', name: 'La Boutique', icon: 'bag-handle-outline' },
  { path: '/parametres', name: 'Paramètres', icon: 'options-outline' },
] as const;
function Shell() {
  const { width } = useWindowDimensions(),
    mobile = width < 800,
    path = usePathname();
  const { save, ready, error, retry } = useGame();
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper, zIndex: 0 }}>
      <PaperTexture background />
      <StatusBar style="dark" />
      <View
        style={{
          height: mobile ? 77 : 96,
          paddingHorizontal: mobile ? 22 : 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderColor: C.line,
        }}
      >
        <View style={ui.row}>
          <View style={{ borderWidth: 1, borderColor: C.gold, padding: 9, borderRadius: 30 }}>
            <Icon name="leaf-outline" color={C.green} size={24} />
          </View>
          <View>
            <T serif style={{ fontSize: mobile ? 23 : 29, letterSpacing: mobile ? 1.5 : 2.5 }}>
              COLOR WORLD
            </T>
            <Label>L’HERBIER DES COULEURS</Label>
          </View>
        </View>
        <View style={ui.row}>
          <Icon name="sparkles-outline" color={C.gold} />
          <T style={{ fontSize: 15 }}>{save.seeds}</T>
          {!mobile && <T style={{ color: C.muted, fontSize: 12 }}>graines dorées</T>}
        </View>
      </View>
      <View style={{ flex: 1, flexDirection: mobile ? 'column' : 'row' }}>
        {!mobile && (
          <View
            style={{
              width: 224,
              padding: 24,
              paddingTop: 37,
              borderRightWidth: 1,
              borderColor: C.line,
            }}
          >
            <Label>VOTRE CARNET</Label>
            <View style={{ gap: 9, marginTop: 22 }}>
              {nav.map((n) => (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={n.name}
                  key={n.path}
                  onPress={() => router.push(n.path)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 13,
                    padding: 13,
                    borderRadius: 5,
                    backgroundColor: path === n.path ? '#e6e9db' : 'transparent',
                  }}
                >
                  <Icon name={n.icon} size={20} color={path === n.path ? C.green : C.muted} />
                  <T style={{ fontSize: 12, color: path === n.path ? C.green : C.muted }}>
                    {n.name}
                  </T>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 'auto', paddingTop: 50 }}>
              <Icon name="flower-outline" size={30} color={C.gold} />
              <T serif style={{ fontSize: 20, marginTop: 12 }}>
                Chaque couleur est{`\n`}une découverte.
              </T>
              <T style={{ fontSize: 10, marginTop: 15, color: C.muted, letterSpacing: 1 }}>
                VOLUME I · FLORE D’EUROPE
              </T>
            </View>
          </View>
        )}
        <View style={{ flex: 1 }}>
          {error && (
            <Pressable onPress={retry} style={{ padding: 12, backgroundColor: '#f0dfcf' }}>
              <T accessibilityRole="alert">{error}</T>
            </Pressable>
          )}
          {ready ? (
            <Slot />
          ) : (
            <View style={{ padding: 40 }}>
              <T>Ouverture du carnet…</T>
            </View>
          )}
        </View>
        {mobile && (
          <View
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderColor: C.line,
              backgroundColor: C.card,
            }}
          >
            {nav.map((n) => (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={n.name}
                key={n.path}
                onPress={() => router.push(n.path)}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 13, gap: 3 }}
              >
                <Icon name={n.icon} color={path === n.path ? C.green : C.muted} />
                <T style={{ fontSize: 9, color: path === n.path ? C.green : C.muted }}>
                  {n.path === '/'
                    ? 'Atelier'
                    : n.path === '/herbier'
                      ? 'Herbier'
                      : n.path === '/carte'
                        ? 'Carte'
                        : n.path === '/boutique'
                          ? 'Boutique'
                          : 'Réglages'}
                </T>
              </Pressable>
            ))}
          </View>
        )}
      </View>
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
