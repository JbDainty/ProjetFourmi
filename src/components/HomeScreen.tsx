import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useGame } from '../state/store';
import { homeProgress } from '../state/home';
import { species } from '../data/botany';
import { BookActionsContext } from './BookActions';
import { SeedPouch } from './SeedPouch';
import { CabinetFrame, HomeEmblem } from './HomeArtwork';
import { CarnetIllustration, type CarnetEmblem } from './CarnetIllustration';
import { Paper } from './Paper';
import { VictoryAction } from './VictoryAction';
import { RestorationEmblem } from './RestorationEmblem';
import { HomeGarden } from './HomeGarden';
import { useMeasuredSize } from './useMeasuredSize';
import { F } from './fonts';
import { T, Icon } from './ui';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import { unlockAmbience } from '../services/ambience';

function FutureMode({
  name,
  title,
  subtitle,
  height,
  horizontal,
  fontScale,
}: {
  name: 'day' | 'mystery';
  title: string;
  subtitle: string;
  height: number;
  horizontal: boolean;
  fontScale: number;
}) {
  const brief = height < 100;
  const veryBrief = !horizontal && height < 82;
  const spaciousRow = horizontal && height >= 110;
  const color = name === 'day' ? '#536d4d' : '#75617b';
  const emblem = spaciousRow ? 42 : horizontal ? 26 : brief ? 22 : 34;
  return (
    <View
      testID={`home-future-${name}`}
      accessible
      accessibilityLabel={`${title}, mode à venir. ${subtitle}`}
      style={{
        height,
        width: '100%',
        paddingHorizontal: horizontal ? 10 : 12,
        paddingVertical: horizontal ? 4 : 6,
        paddingTop: veryBrief ? 20 : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: horizontal ? 'row' : 'column',
        gap: horizontal ? 7 : 2,
      }}
    >
      <CabinetFrame />
      {!veryBrief && (!brief || horizontal || fontScale <= 1.1) && (
        <HomeEmblem name={name} size={emblem} />
      )}
      <View
        style={{
          flex: horizontal ? 1 : undefined,
          width: horizontal ? undefined : '100%',
          alignItems: horizontal ? 'flex-start' : 'center',
          paddingTop: brief && !horizontal && fontScale > 1.1 ? 8 : 0,
        }}
      >
        <T
          accessibilityRole="header"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={veryBrief ? 1 : horizontal ? 1.15 : 1.3}
          style={{
            fontFamily: F.display,
            fontSize: veryBrief ? 17 : spaciousRow ? 24 : horizontal ? 18 : brief ? 19 : 22,
            lineHeight: veryBrief ? 17.5 : spaciousRow ? 28 : horizontal ? 19 : brief ? 21 : 25,
            textAlign: horizontal ? 'left' : 'center',
            color,
            width: '100%',
          }}
        >
          {title}
        </T>
        {height >= 126 && (
          <T
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: F.scientific,
              fontSize: 12,
              lineHeight: 17,
              color: '#796e5d',
              textAlign: 'center',
              marginTop: 3,
            }}
          >
            {subtitle}
          </T>
        )}
        {horizontal && (
          <T
            maxFontSizeMultiplier={1.1}
            style={{ fontFamily: F.scientific, fontSize: 11, lineHeight: 12, color: '#8e7852' }}
          >
            À venir
          </T>
        )}
      </View>
      {!horizontal && (
        <View style={{ position: 'absolute', top: 6, right: 12 }}>
          <T
            maxFontSizeMultiplier={1.15}
            style={{ fontFamily: F.scientific, fontSize: 10, lineHeight: 13, color: '#8e7852' }}
          >
            À venir
          </T>
        </View>
      )}
    </View>
  );
}

/** A game-first cabinet: the playable mode leads, scenery is never a duplicate destination. */
export function HomeScreen() {
  const { save } = useGame();
  const { fontScale } = useWindowDimensions();
  const measured = useMeasuredSize();
  const frame = measured.size;
  const horizontal = frame.width >= 480 && frame.width > frame.height * 1.12;
  const short = horizontal && frame.height < 430;
  const tight = frame.height < 560 || (fontScale > 1.1 && frame.height < 680);
  const padding = short ? 6 : tight ? 8 : 14;
  const gap = short ? 4 : tight ? 6 : 10;
  const pageWidth = Math.max(0, Math.min(1040, frame.width) - padding * 2);
  const headerHeight = short ? 44 : tight ? 56 : 82;
  const footerHeight = short ? 54 : tight ? 100 : 108;
  const bodyHeight = Math.max(
    0,
    frame.height - padding * 2 - headerHeight - footerHeight - gap * 2,
  );
  const headingHeight = short ? 24 : Math.ceil((tight ? 24 : 30) * Math.min(1.3, fontScale));
  const modeSpace = Math.max(0, bodyHeight - headingHeight - gap * (horizontal ? 1 : 2));
  const mainHeight = horizontal ? Math.min(290, modeSpace) : Math.min(270, modeSpace * 0.66);
  const futureHeight = horizontal ? (mainHeight - gap) / 2 : Math.min(146, modeSpace - mainHeight);
  const mainWidth = horizontal ? pageWidth * 0.61 : Math.min(510, pageWidth);
  const futureWidth = horizontal ? pageWidth - mainWidth - gap : mainWidth;
  const progress = homeProgress(save);
  const [focused, setFocused] = useState(true);
  const entering = useRef(false);
  const [departure, setDeparture] = useState<(() => void) | null>(null);
  const performed = useRef<(() => void) | null>(null);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      entering.current = false;
      setDeparture(null);
      performed.current = null;
      return () => setFocused(false);
    }, []),
  );
  const { replayPrologue, replaying, openWorkshop, enteringWorkshop } =
    useContext(BookActionsContext);
  const { value, settled } = useNativeProgress(
    2600,
    save.settings.motion && focused && !replaying && !departure,
  );
  usePrimaryAnimation(!settled && focused && !replaying && !departure);
  const leave = (go: () => void) => setDeparture(() => go);
  useEffect(() => {
    if (!departure || !settled || !focused || replaying || performed.current === departure) return;
    // Cancel the native entrance and commit its final pose before changing screens.
    // No fixed wait: one painted layout is enough, including with reduced motion.
    const frame = requestAnimationFrame(() => {
      performed.current = departure;
      departure();
    });
    return () => cancelAnimationFrame(frame);
  }, [departure, settled, focused, replaying]);
  useEffect(() => {
    if (!replaying) return;
    setDeparture(null);
    performed.current = null;
    entering.current = false;
  }, [replaying]);
  const enter = () => {
    if (entering.current) return;
    entering.current = true;
    unlockAmbience();
    leave(() => {
      if (!save.guideSeen) router.push({ pathname: '/aide', params: { premiersPas: '1' } });
      else openWorkshop();
    });
  };
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
          outputRange: [10, 0],
          extrapolate: 'clamp' as const,
        }),
      },
    ],
  });
  const links: {
    title: string;
    emblem: CarnetEmblem;
    path: '/herbier' | '/carte' | '/boutique' | '/parametres';
  }[] = [
    { title: 'Herbier', emblem: 'herbier', path: '/herbier' },
    { title: 'Écosystèmes', emblem: 'ecosystemes', path: '/carte' },
    { title: 'Boutique', emblem: 'boutique', path: '/boutique' },
    { title: 'Paramètres', emblem: 'parametres', path: '/parametres' },
  ];
  const auxiliary = (mini: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mini ? 0 : 10,
        height: 44,
      }}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Aide"
        onPress={() => leave(() => router.push('/aide'))}
        style={({ pressed }) => ({
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 4,
          paddingHorizontal: mini ? 4 : 9,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Icon name="book-outline" size={mini ? 22 : 17} color="#526a4c" />
        {!mini && (
          <T
            maxFontSizeMultiplier={1.3}
            style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18, color: '#526a4c' }}
          >
            Aide
          </T>
        )}
      </Pressable>
      {save.settings.motion && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revoir le prologue"
          onPress={() => leave(replayPrologue)}
          style={({ pressed }) => ({
            minWidth: 44,
            minHeight: 44,
            paddingHorizontal: mini ? 4 : 9,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          {mini ? (
            <Icon name="eye-outline" size={22} color="#526a4c" />
          ) : (
            <T
              maxFontSizeMultiplier={1.3}
              style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18, color: '#526a4c' }}
            >
              Revoir le prologue
            </T>
          )}
        </Pressable>
      )}
    </View>
  );
  const tinyMain = mainHeight < 155;
  const omitProgress = mainHeight < 128 || (fontScale > 1.1 && mainHeight < 145);
  const main = (
    <Animated.View style={[{ width: mainWidth, height: mainHeight }, part(0, 0.32)]}>
      <Paper
        testID="home-restoration-card"
        frame={false}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 26,
          paddingHorizontal: tight ? 16 : 22,
          paddingVertical: mainHeight < 180 ? 12 : 20,
          justifyContent: 'space-between',
          backgroundColor: '#f6ebd8',
          boxShadow: '0 5px 14px #3851301b',
        }}
      >
        <CabinetFrame />
        {mainWidth >= 340 && mainHeight >= 190 && (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', right: 12, top: 17, opacity: 0.95 }}
          >
            <RestorationEmblem size={mainHeight >= 240 ? 112 : 92} />
          </View>
        )}
        <View
          style={{
            paddingRight: mainWidth >= 340 && mainHeight >= 190 ? 105 : 0,
            gap: mainHeight < 180 ? 0 : 3,
          }}
        >
          {mainHeight >= 210 && (
            <T
              maxFontSizeMultiplier={tinyMain ? 1.15 : 1.3}
              numberOfLines={1}
              style={{ fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: '#947947' }}
            >
              AVENTURE BOTANIQUE
            </T>
          )}
          <T
            accessibilityRole="header"
            maxFontSizeMultiplier={tinyMain ? 1.15 : 1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={{
              fontFamily: F.display,
              fontSize: short ? 26 : tinyMain ? 26 : tight ? 29 : 34,
              lineHeight: short ? 29 : tinyMain ? 30 : tight ? 34 : 40,
              color: '#30523e',
            }}
          >
            La restauration
          </T>
          {mainHeight >= 210 && (
            <T
              maxFontSizeMultiplier={tinyMain ? 1.15 : 1.3}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontFamily: F.scientific, fontSize: 14, lineHeight: 20, color: '#7a7354' }}
            >
              Faites refleurir l’herbier.
            </T>
          )}
        </View>
        {!omitProgress && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginVertical: short || tinyMain ? 1 : 5,
            }}
          >
            {!short && <Icon name="leaf-outline" size={16} color="#75835a" />}
            <T
              testID="home-current-species"
              maxFontSizeMultiplier={tinyMain ? 1.15 : 1.3}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                flexShrink: 1,
                fontFamily: F.scientific,
                fontSize: short ? 13 : tinyMain ? 14 : 16,
                lineHeight: short ? 17 : tinyMain ? 18 : 22,
                color: '#63734f',
              }}
            >
              {species[progress.plant].name}
            </T>
            <T
              maxFontSizeMultiplier={tinyMain ? 1.15 : 1.3}
              style={{
                fontSize: 13,
                lineHeight: short ? 17 : tinyMain ? 18 : 22,
                color: '#a68d55',
              }}
            >
              ·
            </T>
            <T
              testID="home-current-page"
              maxFontSizeMultiplier={tinyMain ? 1.15 : 1.3}
              numberOfLines={1}
              style={{
                fontFamily: F.scientific,
                fontSize: short ? 13 : tinyMain ? 14 : 16,
                lineHeight: short ? 17 : tinyMain ? 18 : 22,
                color: '#63734f',
              }}
            >
              Page {String(progress.page).padStart(2, '0')}
            </T>
          </View>
        )}
        <View testID="home-restore-action" style={{ width: '100%', alignItems: 'center' }}>
          <VictoryAction
            icon="leaf-outline"
            onPress={enter}
            disabled={enteringWorkshop || (!!departure && entering.current)}
            compact={mainHeight < 210}
            maxFontSizeMultiplier={1.3}
          >
            {enteringWorkshop || (!!departure && entering.current)
              ? 'Préparation…'
              : progress.firstPage
                ? 'Commencer'
                : progress.collectionComplete
                  ? 'Rejouer'
                  : 'Continuer'}
          </VictoryAction>
        </View>
      </Paper>
    </Animated.View>
  );
  const future = (
    <Animated.View
      style={[
        { width: futureWidth, flexDirection: horizontal ? 'column' : 'row', gap },
        part(0.12, 0.43),
      ]}
    >
      {[
        { name: 'day' as const, title: 'Le Feuillet du jour', subtitle: 'Un puzzle par jour.' },
        {
          name: 'mystery' as const,
          title: 'Les Encres oubliées',
          subtitle: 'Les couleurs se cachent.',
        },
      ].map((mode) => (
        <View key={mode.name} style={{ width: horizontal ? '100%' : (futureWidth - gap) / 2 }}>
          <FutureMode
            {...mode}
            height={Math.max(0, futureHeight)}
            horizontal={horizontal}
            fontScale={fontScale}
          />
        </View>
      ))}
    </Animated.View>
  );
  return (
    <View testID="home-screen" style={{ flex: 1, minHeight: 0 }}>
      <HomeGarden
        width={frame.width}
        height={frame.height}
        motion={save.settings.motion && focused && !replaying && !departure && settled}
      />
      <View
        ref={measured.ref}
        collapsable={false}
        onLayout={measured.onLayout}
        testID="home-viewport"
        style={{ flex: 1, minHeight: 0, alignItems: 'center' }}
      >
        {frame.height > 0 && (
          <View
            testID="home-layout"
            style={{
              width: pageWidth + padding * 2,
              height: '100%',
              padding,
              gap,
              alignItems: 'center',
            }}
          >
            <View
              testID="home-masthead"
              style={{
                height: headerHeight,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                paddingHorizontal: short ? 6 : 10,
              }}
            >
              <View
                accessibilityRole="header"
                accessibilityLabel="Herbier des couleurs"
                style={{
                  flex: 1,
                  alignItems: short ? 'flex-start' : 'center',
                  paddingLeft: short ? 0 : 60,
                }}
              >
                <T
                  maxFontSizeMultiplier={1.3}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    fontFamily: F.displayBold,
                    fontSize: short ? 23 : tight ? 29 : 38,
                    lineHeight: short ? 28 : tight ? 33 : 43,
                    color: '#2f513c',
                    textAlign: 'center',
                  }}
                >
                  {short ? 'Herbier des couleurs' : 'Herbier'}
                </T>
                {!short && (
                  <T
                    maxFontSizeMultiplier={1.3}
                    style={{
                      fontFamily: F.display,
                      fontSize: tight ? 9 : 11,
                      lineHeight: 14,
                      letterSpacing: 3,
                      color: '#7f724b',
                    }}
                  >
                    DES COULEURS
                  </T>
                )}
              </View>
              <SeedPouch
                count={save.seeds}
                motion={save.settings.motion && focused && !replaying && !departure}
                compact
              />
              {short && auxiliary(true)}
            </View>
            <View
              style={{
                height: bodyHeight,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap,
              }}
            >
              <View
                style={{ height: headingHeight, alignItems: 'center', justifyContent: 'center' }}
              >
                <T
                  testID="home-modes-title"
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.3}
                  style={{
                    fontFamily: F.display,
                    fontSize: short ? 18 : 22,
                    lineHeight: short ? 22 : 27,
                    color: '#4c6749',
                  }}
                >
                  Modes de jeu
                </T>
              </View>
              <View
                testID="home-modes"
                style={{ flexDirection: horizontal ? 'row' : 'column', alignItems: 'center', gap }}
              >
                {main}
                {future}
              </View>
            </View>
            <Animated.View
              testID="home-footer"
              style={[
                {
                  height: footerHeight,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                part(0.2, 0.5),
              ]}
            >
              <View
                style={{
                  width: '100%',
                  maxWidth: short ? 620 : 520,
                  flexDirection: 'row',
                  paddingHorizontal: 4,
                  borderRadius: 24,
                  backgroundColor: '#f5ecd2d9',
                  borderWidth: 0.6,
                  borderColor: '#b6a67b77',
                }}
              >
                {links.map((link) => (
                  <Pressable
                    key={link.path}
                    accessibilityRole="link"
                    accessibilityLabel={link.title}
                    onPress={() => leave(() => router.push(link.path))}
                    style={({ pressed }) => ({
                      width: '25%',
                      minHeight: short ? 50 : tight ? 48 : 60,
                      paddingVertical: 3,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.65 : 1,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    })}
                  >
                    <CarnetIllustration name={link.emblem} size={short ? 25 : tight ? 27 : 34} />
                    <T
                      maxFontSizeMultiplier={1.3}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        fontFamily: F.scientific,
                        fontSize: short ? 12 : tight ? 13 : 15,
                        lineHeight: short ? 15 : tight ? 17 : 20,
                        color: '#455f44',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      {link.title}
                    </T>
                  </Pressable>
                ))}
              </View>
              {!short && auxiliary(false)}
            </Animated.View>
          </View>
        )}
        <View
          testID={settled ? 'home-stage-settled' : 'home-stage-unfolding'}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}
