import React, { useCallback, useContext, useState } from 'react';
import { Animated, Image, Pressable, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useGame } from '../state/store';
import { homeProgress } from '../state/home';
import { chapters, species } from '../data/botany';
import { restorationCaption } from '../animation/restoration';
import { BookActionsContext } from './BookActions';
import { BookScrollView } from './BookScrollView';
import { HerbariumTitle } from './HerbariumTitle';
import { CabinetBook, CabinetFrame, HomeEmblem } from './HomeArtwork';
import { CarnetIllustration, type CarnetEmblem } from './CarnetIllustration';
import { Paper } from './Paper';
import { Botanical } from './Botanical';
import { VictoryAction } from './VictoryAction';
import { F } from './fonts';
import { C, T, Icon } from './ui';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import { unlockAmbience } from '../services/ambience';

const landscapes = [
  require('../../assets/illustrations/prairies.png'),
  require('../../assets/illustrations/sous-bois.png'),
  require('../../assets/illustrations/zones-humides.png'),
  require('../../assets/illustrations/montagnes.png'),
  require('../../assets/illustrations/mediterranee.png'),
];

function ProgressSprig({ stage }: { stage: number }) {
  return (
    <Svg width="108" height="23" viewBox="0 0 108 23" accessible={false}>
      <Path d="M5 20Q52 22 102 8" fill="none" stroke="#9f986d" strokeWidth="0.75" />
      {[0, 1, 2, 3, 4].map((index) => (
        <G
          key={index}
          transform={`translate(${14 + index * 19} ${18 - index * 1.8}) rotate(${index % 2 ? 20 : -22})`}
          fill={index < stage ? '#7e9a64' : '#daccaa'}
          stroke={index < stage ? '#5e7a4d' : '#ad9d76'}
          strokeWidth=".65"
        >
          <Path d="M0 0Q-9-4-3-14Q5-11 0 0Z" />
          <Path d="M0 0-3-11" fill="none" />
          <Circle cx="-2" cy="-7" r=".6" fill="#f0e8c9" stroke="none" />
        </G>
      ))}
    </Svg>
  );
}

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
        flex: 1,
        minWidth: 120,
        minHeight: 116,
        paddingHorizontal: 13,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CabinetFrame />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <HomeEmblem name={name} size={32} />
        <T style={{ fontFamily: F.scientific, fontSize: 11, lineHeight: 16, color: '#917b4e' }}>
          À venir
        </T>
        <Icon name="lock-closed-outline" size={12} color="#9e8c65" />
      </View>
      <T
        style={{
          fontFamily: F.display,
          fontSize: 18,
          lineHeight: 21,
          alignSelf: 'stretch',
          color: name === 'mystery' ? '#75677c' : '#5c7051',
          textAlign: 'center',
        }}
      >
        {title}
      </T>
      <T
        style={{
          fontFamily: F.scientific,
          fontSize: 11,
          lineHeight: 15,
          alignSelf: 'stretch',
          color: '#8a7c5c',
          marginTop: 3,
          textAlign: 'center',
        }}
      >
        {subtitle}
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
            <Animated.View
              style={[{ alignItems: 'center', paddingTop: desktop ? 0 : 1 }, part(0, 0.15)]}
            >
              <HerbariumTitle compact={false} motion={save.settings.motion && settled} />
            </Animated.View>
            <View style={{ width: '100%', marginTop: desktop ? 15 : -2 }}>
              <CabinetBook
                width={bookWidth}
                plant={progress.plant}
                stage={progress.stage}
                value={value}
                settled={settled}
                onOpen={observe}
              />
            </View>
            <Animated.View
              style={[
                {
                  alignItems: 'center',
                  width: '100%',
                  marginTop: -4,
                  marginBottom: desktop ? 10 : 9,
                },
                part(0.24, 0.48),
              ]}
            >
              <T
                testID="home-collection-caption"
                style={{
                  fontFamily: F.handwriting,
                  fontSize: small ? 20 : 23,
                  lineHeight: 27,
                  color: '#766b47',
                  textAlign: 'center',
                }}
              >
                {progress.collectionComplete
                  ? 'Votre herbier est plein de vie.'
                  : progress.sealedPlants
                    ? `${progress.sealedPlants} planche${progress.sealedPlants > 1 ? 's' : ''} estampillée${progress.sealedPlants > 1 ? 's' : ''}`
                    : 'La première fleur vous attend…'}
              </T>
            </Animated.View>
          </View>

          <View style={{ width: desktop ? '50%' : '100%', maxWidth: 510 }}>
            <Animated.View style={[{ width: '100%' }, part(0.28, 0.52)]}>
              <Paper
                testID="home-restoration-card"
                frame={false}
                style={{
                  width: '100%',
                  borderRadius: 26,
                  paddingHorizontal: small ? 18 : 23,
                  paddingTop: 18,
                  paddingBottom: 15,
                }}
              >
                <CabinetFrame />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 12,
                    bottom: 13,
                    left: 14,
                    right: 14,
                    borderRadius: 21,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={landscapes[progress.chapter]}
                    resizeMode="cover"
                    accessible={false}
                    fadeDuration={0}
                    style={{ width: '100%', height: '100%', opacity: 0.13 }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <T
                    style={{
                      fontSize: 9,
                      lineHeight: 14,
                      letterSpacing: 2,
                      color: '#8b7651',
                      flexShrink: 1,
                    }}
                  >
                    LE VOYAGE DES NUANCES
                  </T>
                  <T
                    testID="home-current-page"
                    style={{
                      fontFamily: F.display,
                      fontSize: 17,
                      lineHeight: 22,
                      color: '#536e50',
                    }}
                  >
                    Page {String(progress.page).padStart(2, '0')}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <T
                      accessibilityRole="header"
                      style={{
                        fontFamily: F.display,
                        fontSize: small ? 27 : 31,
                        lineHeight: 36,
                        color: '#315540',
                      }}
                    >
                      La restauration
                    </T>
                    <T
                      style={{
                        fontFamily: F.scientific,
                        fontSize: 13,
                        lineHeight: 18,
                        color: '#827052',
                        marginTop: 2,
                      }}
                    >
                      {chapters[progress.chapter].name}
                    </T>
                    <T
                      testID="home-current-species"
                      style={{
                        fontFamily: F.display,
                        fontSize: 22,
                        lineHeight: 26,
                        color: '#4d684e',
                        marginTop: 5,
                      }}
                    >
                      {species[progress.plant].name}
                    </T>
                    <T
                      style={{
                        fontFamily: F.scientific,
                        fontSize: 12,
                        lineHeight: 17,
                        color: '#867650',
                      }}
                    >
                      {restorationCaption(progress.stage)}
                    </T>
                  </View>
                  <View
                    pointerEvents="none"
                    style={{
                      width: 67,
                      height: 95,
                      transform: [{ rotate: '5deg' }],
                      opacity: 0.88,
                    }}
                  >
                    <Botanical
                      index={progress.plant}
                      stage={progress.stage}
                      size={67}
                      labels={false}
                    />
                  </View>
                </View>
                <View
                  testID="home-restore-action"
                  style={{ width: '100%', alignItems: 'center', marginTop: 10 }}
                >
                  <VictoryAction icon="leaf-outline" onPress={enter}>
                    {progress.firstPage
                      ? 'Commencer la restauration'
                      : progress.collectionComplete
                        ? 'Retrouver ma page'
                        : 'Continuer la restauration'}
                  </VictoryAction>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 2,
                    gap: 5,
                  }}
                >
                  <ProgressSprig stage={progress.stage} />
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Explorer les écosystèmes"
                    onPress={() => router.push('/carte')}
                    style={({ pressed }) => ({
                      minHeight: 40,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <T
                      style={{
                        fontFamily: F.scientific,
                        fontSize: 13,
                        lineHeight: 18,
                        color: '#6e7854',
                      }}
                    >
                      Écosystèmes
                    </T>
                    <Icon name="arrow-forward-outline" size={17} color="#7c8057" />
                  </Pressable>
                </View>
              </Paper>
            </Animated.View>
            <Animated.View
              style={[
                { flexDirection: 'row', width: '100%', gap: 7, marginTop: 8 },
                part(0.42, 0.67),
              ]}
            >
              <FutureMode
                name="day"
                title="Le Feuillet du jour"
                subtitle="Un rendez-vous avec le jardin"
              />
              <FutureMode
                name="mystery"
                title="Les Encres oubliées"
                subtitle="Les nuances gardent leurs secrets"
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
              Les premiers gestes
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
