import React, { useCallback, useContext, useState } from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useGame } from '../state/store';
import { homeProgress } from '../state/home';
import { species } from '../data/botany';
import { BookActionsContext } from './BookActions';
import { BookScrollView } from './BookScrollView';
import { CabinetBook, CabinetFrame, HomeEmblem } from './HomeArtwork';
import { CarnetIllustration, type CarnetEmblem } from './CarnetIllustration';
import { Paper } from './Paper';
import { VictoryAction } from './VictoryAction';
import { F } from './fonts';
import { T, Icon } from './ui';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import { unlockAmbience } from '../services/ambience';

function FutureMode({
  name,
  title,
  subtitle,
}: {
  name: 'day' | 'mystery';
  title: string;
  subtitle: string;
}) {
  return (
    <View
      testID={`home-future-${name}`}
      accessible
      accessibilityLabel={`${title}, mode à venir. ${subtitle}`}
      style={{
        width: '100%',
        minHeight: 92,
        paddingHorizontal: 17,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
      }}
    >
      <CabinetFrame />
      <HomeEmblem name={name} size={43} />
      <View style={{ flex: 1 }}>
        <T
          accessibilityRole="header"
          style={{
            fontFamily: F.display,
            fontSize: 22,
            lineHeight: 26,
            color: name === 'mystery' ? '#75677c' : '#5c7051',
          }}
        >
          {title}
        </T>
        <T
          style={{
            fontFamily: F.scientific,
            fontSize: 13,
            lineHeight: 18,
            color: '#8a7c5c',
            marginTop: 2,
          }}
        >
          {subtitle}
        </T>
      </View>
      <T
        style={{
          fontFamily: F.scientific,
          fontSize: 12,
          lineHeight: 17,
          color: '#917b4e',
          flexShrink: 0,
        }}
      >
        À venir
      </T>
    </View>
  );
}

/** The cabinet is the signed player's first screen. All mode cards read the same save. */
export function HomeScreen() {
  const { save } = useGame();
  const { width, height } = useWindowDimensions();
  const desktop = width >= 880,
    small = width < 360;
  const progress = homeProgress(save);
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const { replayPrologue, replaying } = useContext(BookActionsContext);
  const { value, settled } = useNativeProgress(2600, save.settings.motion && focused && !replaying);
  usePrimaryAnimation(!settled);
  const enter = () => {
    unlockAmbience();
    router.push('/atelier');
  };
  const observe = () =>
    router.push({ pathname: '/herbier', params: { plant: String(progress.plant) } });
  const part = (from: number, to: number) => ({
    opacity: value.interpolate({
      inputRange: [from, to],
      outputRange: [0, 1],
      extrapolate: 'clamp' as const,
    }),
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [from, to],
          outputRange: [14, 0],
          extrapolate: 'clamp' as const,
        }),
      },
    ],
  });
  const bookWidth = Math.min(desktop ? 430 : width - 22, 430);
  const links: {
    title: string;
    emblem: CarnetEmblem;
    path: '/herbier' | '/boutique' | '/parametres';
  }[] = [
    { title: 'Herbier', emblem: 'herbier', path: '/herbier' },
    { title: 'Boutique', emblem: 'boutique', path: '/boutique' },
    { title: 'Paramètres', emblem: 'parametres', path: '/parametres' },
  ];
  return (
    <BookScrollView
      testID="home-scroll"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
        paddingHorizontal: desktop ? 26 : 12,
        paddingBottom: 18,
        justifyContent: desktop && height > 740 ? 'center' : 'flex-start',
      }}
    >
      <View testID="home-screen" style={{ width: '100%', alignItems: 'center' }}>
        <View
          style={{
            width: '100%',
            flexDirection: desktop ? 'row' : 'column',
            alignItems: 'center',
            gap: desktop ? 28 : 0,
          }}
        >
          <View style={{ width: desktop ? '47%' : '100%', alignItems: 'center' }}>
            <CabinetBook
              width={bookWidth}
              plant={progress.plant}
              stage={progress.stage}
              value={value}
              settled={settled}
              onOpen={observe}
            />
          </View>

          <View style={{ width: desktop ? '50%' : '100%', maxWidth: 510 }}>
            <Animated.View style={[{ width: '100%' }, part(0.2, 0.4)]}>
              <T
                testID="home-modes-title"
                accessibilityRole="header"
                style={{
                  fontFamily: F.display,
                  fontSize: 26,
                  lineHeight: 33,
                  color: '#536e50',
                  textAlign: 'center',
                  marginTop: desktop ? 0 : 5,
                  marginBottom: 8,
                }}
              >
                Modes de jeu
              </T>
            </Animated.View>
            <Animated.View style={[{ width: '100%' }, part(0.28, 0.52)]}>
              <Paper
                testID="home-restoration-card"
                frame={false}
                style={{
                  width: '100%',
                  borderRadius: 26,
                  paddingHorizontal: small ? 19 : 24,
                  paddingTop: 17,
                  paddingBottom: 12,
                }}
              >
                <CabinetFrame />
                <T
                  accessibilityRole="header"
                  style={{
                    fontFamily: F.display,
                    fontSize: 29,
                    lineHeight: 35,
                    color: '#315540',
                  }}
                >
                  La restauration
                </T>
                <T
                  style={{
                    fontFamily: F.scientific,
                    fontSize: 14,
                    lineHeight: 20,
                    color: '#827052',
                    marginTop: 1,
                  }}
                >
                  L’aventure botanique, page après page.
                </T>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    columnGap: 7,
                    marginTop: 8,
                  }}
                >
                  <T
                    testID="home-current-species"
                    style={{
                      fontFamily: F.scientific,
                      fontSize: 15,
                      lineHeight: 21,
                      color: '#6e7854',
                    }}
                  >
                    {species[progress.plant].name}
                  </T>
                  <T style={{ fontSize: 12, color: '#ab9669' }}>·</T>
                  <T
                    testID="home-current-page"
                    style={{
                      fontFamily: F.scientific,
                      fontSize: 15,
                      lineHeight: 21,
                      color: '#6e7854',
                    }}
                  >
                    Page {String(progress.page).padStart(2, '0')}
                  </T>
                </View>
                <View
                  testID="home-restore-action"
                  style={{ width: '100%', alignItems: 'center', marginTop: 8 }}
                >
                  <VictoryAction icon="leaf-outline" onPress={enter}>
                    {progress.firstPage
                      ? 'Commencer'
                      : progress.collectionComplete
                        ? 'Rejouer'
                        : 'Continuer'}
                  </VictoryAction>
                </View>
              </Paper>
            </Animated.View>
            <Animated.View style={[{ width: '100%', gap: 8, marginTop: 8 }, part(0.42, 0.67)]}>
              <FutureMode
                name="day"
                title="Le Feuillet du jour"
                subtitle="Un nouveau puzzle chaque jour."
              />
              <FutureMode
                name="mystery"
                title="Les Encres oubliées"
                subtitle="Des énigmes aux couleurs cachées."
              />
            </Animated.View>
          </View>
        </View>

        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: desktop ? 560 : 440,
              marginTop: desktop ? 28 : 10,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            },
            part(0.55, 0.78),
          ]}
        >
          {links.map((link) => (
            <Pressable
              key={link.path}
              accessibilityRole="link"
              accessibilityLabel={link.title}
              onPress={() => router.push(link.path)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 72,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.65 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <CarnetIllustration name={link.emblem} size={43} />
              <T
                style={{
                  fontFamily: F.scientific,
                  fontSize: 15,
                  lineHeight: 21,
                  color: '#627052',
                  marginTop: -2,
                }}
              >
                {link.title}
              </T>
            </Pressable>
          ))}
        </Animated.View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 2,
            gap: 10,
          }}
        >
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Aide"
            onPress={() => router.push('/aide')}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: 9,
              flexDirection: 'row',
              gap: 4,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icon name="book-outline" size={18} color="#968152" />
            <T style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18, color: '#85744e' }}>
              Aide
            </T>
          </Pressable>
          {save.settings.motion && (
            <>
              <T style={{ color: '#b39d68', fontSize: 13 }}>·</T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Revoir le prologue"
                onPress={replayPrologue}
                style={({ pressed }) => ({
                  minHeight: 44,
                  paddingHorizontal: 8,
                  opacity: pressed ? 0.6 : 1,
                  justifyContent: 'center',
                })}
              >
                <T
                  style={{
                    fontFamily: F.scientific,
                    fontSize: 13,
                    lineHeight: 18,
                    color: '#85744e',
                  }}
                >
                  Revoir le prologue
                </T>
              </Pressable>
            </>
          )}
        </View>
        <View
          testID={settled ? 'home-stage-settled' : 'home-stage-unfolding'}
          pointerEvents="none"
        />
      </View>
    </BookScrollView>
  );
}
