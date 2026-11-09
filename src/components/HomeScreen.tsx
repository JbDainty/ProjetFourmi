import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useGame } from '../state/store';
import { homeProgress } from '../state/home';
import { species } from '../data/botany';
import { BookActionsContext } from './BookActions';
import { BookChromeContext } from './BookScrollView';
import { SeedPouch } from './SeedPouch';
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
  compact,
  tight,
  brief,
}: {
  name: 'day' | 'mystery';
  title: string;
  subtitle: string;
  compact: boolean;
  tight: boolean;
  brief: boolean;
}) {
  return (
    <View
      testID={`home-future-${name}`}
      accessible
      accessibilityLabel={`${title}, mode à venir. ${subtitle}`}
      style={{
        width: '100%',
        minHeight: brief ? 44 : tight ? 50 : compact ? 64 : 80,
        paddingHorizontal: compact ? 13 : 17,
        paddingVertical: brief ? 4 : tight ? 6 : compact ? 8 : 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: compact ? 8 : 11,
      }}
    >
      <CabinetFrame />
      <HomeEmblem name={name} size={tight ? 28 : compact ? 34 : 40} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <T
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={{
              flex: 1,
              fontFamily: F.display,
              fontSize: tight ? 19 : compact ? 20 : 22,
              lineHeight: tight ? 22 : 26,
              color: name === 'mystery' ? '#75677c' : '#5c7051',
            }}
          >
            {title}
          </T>
          <T
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              width: 48,
              textAlign: 'right',
              fontFamily: F.scientific,
              fontSize: 12,
              lineHeight: 17,
              color: '#917b4e',
            }}
          >
            À venir
          </T>
        </View>
        {!brief && (
          <T
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{
              fontFamily: F.scientific,
              fontSize: tight ? 12 : 13,
              lineHeight: tight ? 16 : 18,
              color: '#8a7c5c',
              marginTop: tight ? 0 : 2,
            }}
          >
            {subtitle}
          </T>
        )}
      </View>
    </View>
  );
}

/** The cabinet is the signed player's first screen. All mode cards read the same save. */
export function HomeScreen() {
  const { save } = useGame();
  const { fontScale } = useWindowDimensions();
  const { header } = useContext(BookChromeContext);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [bookHeight, setBookHeight] = useState(0);
  const horizontal =
    frame.width >= 880 || (frame.width >= 560 && frame.width > frame.height * 1.12);
  const compact = frame.height < (horizontal ? 520 : 740) || frame.width < 360 || fontScale > 1.1;
  const tight = frame.height < (horizontal ? 390 : 570);
  const gap = tight ? 4 : compact ? 6 : 8;
  const padding = tight ? 4 : compact ? 8 : 14;
  const pageWidth = Math.min(1040, frame.width) - padding * 2;
  const modeWidth = horizontal ? Math.min(510, pageWidth * 0.56) : Math.min(510, pageWidth);
  const bookColumnWidth = horizontal ? pageWidth - modeWidth - gap * 2 : pageWidth;
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
  const observe = () =>
    leave(() => router.push({ pathname: '/herbier', params: { plant: String(progress.plant) } }));
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
  const bookWidth = Math.max(0, Math.min(430, bookColumnWidth, (bookHeight - 7) * 1.5));
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
  const book = (
    <View
      testID="home-book-space"
      onLayout={({ nativeEvent: { layout } }) => setBookHeight(layout.height)}
      style={{
        flexBasis: (Math.min(430, bookColumnWidth) * 2) / 3 + 7,
        flexShrink: 1,
        minHeight: 0,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {bookWidth > 0 && (
        <CabinetBook
          width={bookWidth}
          plant={progress.plant}
          stage={progress.stage}
          value={value}
          settled={settled}
          onOpen={observe}
        />
      )}
    </View>
  );
  const modes = (
    <View testID="home-modes" style={{ width: modeWidth, flexShrink: 0, gap }}>
      <Animated.View
        style={[
          {
            width: '100%',
            minHeight: compact ? 44 : 52,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
          },
          part(0.2, 0.4),
        ]}
      >
        <T
          testID="home-modes-title"
          accessibilityRole="header"
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontFamily: F.display,
            fontSize: compact ? 24 : 26,
            lineHeight: 33,
            color: '#536e50',
            textAlign: 'center',
            flexShrink: 1,
          }}
        >
          Modes de jeu
        </T>
        <SeedPouch
          count={save.seeds}
          motion={save.settings.motion && focused && !replaying}
          compact={compact}
        />
      </Animated.View>
      <Animated.View style={[{ width: '100%' }, part(0.28, 0.52)]}>
        <Paper
          testID="home-restoration-card"
          frame={false}
          style={{
            width: '100%',
            borderRadius: 26,
            paddingHorizontal: compact ? 18 : 24,
            paddingTop: tight ? 7 : compact ? 11 : 17,
            paddingBottom: tight ? 7 : compact ? 9 : 12,
          }}
        >
          <CabinetFrame />
          <T
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: F.display,
              fontSize: compact ? 25 : 29,
              lineHeight: compact ? 29 : 35,
              color: '#315540',
            }}
          >
            La restauration
          </T>
          {!tight && (
            <T
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              adjustsFontSizeToFit
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
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 7,
              marginTop: tight ? 2 : compact ? 4 : 8,
            }}
          >
            <T
              testID="home-current-species"
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontFamily: F.scientific,
                fontSize: compact ? 14 : 15,
                lineHeight: compact ? 19 : 21,
                color: '#6e7854',
              }}
            >
              {species[progress.plant].name}
            </T>
            <T
              maxFontSizeMultiplier={1.3}
              style={{ fontSize: 12, lineHeight: compact ? 19 : 21, color: '#ab9669' }}
            >
              ·
            </T>
            <T
              testID="home-current-page"
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={{
                fontFamily: F.scientific,
                fontSize: compact ? 14 : 15,
                lineHeight: compact ? 19 : 21,
                color: '#6e7854',
              }}
            >
              Page {String(progress.page).padStart(2, '0')}
            </T>
          </View>
          <View
            testID="home-restore-action"
            style={{ width: '100%', alignItems: 'center', marginTop: tight ? 2 : compact ? 4 : 8 }}
          >
            <VictoryAction
              icon="leaf-outline"
              onPress={enter}
              disabled={enteringWorkshop || (!!departure && entering.current)}
              compact={compact}
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
      <Animated.View style={[{ width: '100%', gap }, part(0.42, 0.67)]}>
        <FutureMode
          compact={compact}
          tight={tight}
          brief={tight && fontScale > 1.1}
          name="day"
          title="Le Feuillet du jour"
          subtitle="Un nouveau puzzle chaque jour."
        />
        <FutureMode
          compact={compact}
          tight={tight}
          brief={tight && fontScale > 1.1}
          name="mystery"
          title="Les Encres oubliées"
          subtitle="Des énigmes aux couleurs cachées."
        />
      </Animated.View>
    </View>
  );
  const shortcutColumns = horizontal && bookColumnWidth < 320 ? 2 : 4;
  const footer = (
    <View testID="home-footer" style={{ width: '100%', flexShrink: 0, alignItems: 'center' }}>
      <Animated.View
        style={[
          {
            width: '100%',
            maxWidth: 440,
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
          },
          part(0.55, 0.78),
        ]}
      >
        {links.map((link) => (
          <Pressable
            key={link.path}
            accessibilityRole="link"
            accessibilityLabel={link.title}
            onPress={() => leave(() => router.push(link.path))}
            style={({ pressed }) => ({
              width: `${100 / shortcutColumns}%`,
              minHeight: compact ? 56 : 68,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.65 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <CarnetIllustration name={link.emblem} size={compact ? 32 : 40} />
            <T
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: F.scientific,
                fontSize: shortcutColumns === 4 && bookColumnWidth < 360 ? 12 : compact ? 14 : 15,
                lineHeight: compact ? 18 : 21,
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
          gap: 10,
        }}
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Aide"
          onPress={() => leave(() => router.push('/aide'))}
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
          <T
            maxFontSizeMultiplier={1.3}
            style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18, color: '#85744e' }}
          >
            Aide
          </T>
        </Pressable>
        {save.settings.motion && (
          <>
            <T style={{ color: '#b39d68', fontSize: 13 }}>·</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Revoir le prologue"
              onPress={() => leave(replayPrologue)}
              style={({ pressed }) => ({
                minHeight: 44,
                paddingHorizontal: 8,
                opacity: pressed ? 0.6 : 1,
                justifyContent: 'center',
              })}
            >
              <T
                maxFontSizeMultiplier={1.3}
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
    </View>
  );
  return (
    <View testID="home-screen" style={{ flex: 1 }}>
      {header}
      <View
        testID="home-viewport"
        onLayout={({ nativeEvent: { layout } }) =>
          setFrame({ width: layout.width, height: layout.height })
        }
        style={{ flex: 1, minHeight: 0, alignItems: 'center' }}
      >
        {frame.height > 0 && (
          <View
            testID="home-layout"
            style={{
              width: '100%',
              maxWidth: 1040,
              height: '100%',
              padding,
              flexDirection: horizontal ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: horizontal ? gap * 2 : gap,
            }}
          >
            {horizontal ? (
              <>
                <View
                  style={{
                    width: bookColumnWidth,
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap,
                  }}
                >
                  {book}
                  {footer}
                </View>
                {modes}
              </>
            ) : (
              <>
                {book}
                {modes}
                {footer}
              </>
            )}
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
