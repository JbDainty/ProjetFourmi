import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { HerbariumBookButton } from './HerbariumBookButton';
import { HerbariumTitle } from './HerbariumTitle';
import { SeedPouch } from './SeedPouch';
import { BotanicalStamp } from './BotanicalStamp';
import { PageFolio } from './PageFolio';
import { T, C } from './ui';
import { F } from './fonts';
import { chapters, species } from '../data/botany';
import { restorationDescription } from '../animation/restoration';
import type { workshopLayout } from '../layout/workshop';

type Props = {
  layout: ReturnType<typeof workshopLayout>;
  plant: number;
  stage: number;
  page: number;
  seeds: number;
  motion: boolean;
  busy: boolean;
  onOpen: () => void;
};
export function WorkshopHud({ layout, plant, stage, page, seeds, motion, busy, onOpen }: Props) {
  const small = layout.tiny || layout.landscape;
  return (
    <View
      testID="game-hud"
      style={{
        height: layout.hudHeight,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
      }}
    >
      <HerbariumBookButton compact motion={motion} onHome={() => router.dismissTo('/')} />
      {small ? (
        <>
          {layout.landscape && <PageFolio compact page={page} />}
          <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
            {!layout.landscape && <PageFolio compact page={page} />}
            <T
              testID="current-species-heading"
              serif
              maxFontSizeMultiplier={1}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{
                fontSize: layout.landscape ? 19 : 17,
                lineHeight: layout.landscape ? 21 : 18,
                textAlign: 'center',
                width: '100%',
              }}
            >
              {species[plant].name}
            </T>
          </View>
          <BotanicalStamp index={plant} stage={stage} size={30} onPress={onOpen} disabled={busy} />
        </>
      ) : (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <HerbariumTitle hud compact motion={motion} />
        </View>
      )}
      <SeedPouch compact count={seeds} motion={motion} />
    </View>
  );
}
export function WorkshopCaption({ layout, plant, stage, page, busy, onOpen }: Props) {
  if (!layout.captionHeight) return null;
  const chapter = Math.floor(plant / 4);
  return (
    <View
      testID="chapter-vignette"
      accessibilityLabel={`${chapters[chapter].name}, chapitre ${chapter + 1}. ${restorationDescription(stage)}`}
      style={{
        height: layout.captionHeight,
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        paddingHorizontal: 4,
      }}
    >
      <BotanicalStamp
        index={plant}
        stage={stage}
        size={layout.compact ? 40 : 48}
        onPress={onOpen}
        disabled={busy}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          <T
            testID="chapter-landscape-caption"
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
            style={{
              fontFamily: F.scientific,
              fontSize: layout.compact ? 11 : 12,
              lineHeight: 16,
              color: C.muted,
              flex: 1,
            }}
          >
            {chapters[chapter].name}, chapitre {chapter + 1}
          </T>
          <PageFolio compact page={page} />
        </View>
        <T
          testID="current-species-heading"
          serif
          numberOfLines={2}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.15}
          minimumFontScale={0.8}
          style={{
            fontSize: layout.compact ? 21 : 25,
            lineHeight: layout.compact ? 23 : 28,
            color: C.ink,
          }}
        >
          {species[plant].name}
        </T>
      </View>
    </View>
  );
}
