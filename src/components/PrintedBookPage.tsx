import React, { memo } from 'react';
import { View } from 'react-native';
import { Botanical } from './Botanical';
import { T, C } from './ui';
import { F } from './fonts';
import { species } from '../data/botany';

export const PrintedPage = memo(function PrintedPage({
  width,
  height,
  plant,
  stage,
  folio,
  destination = false,
}: {
  width: number;
  height: number;
  plant: number;
  stage: number;
  folio: number;
  destination?: boolean;
}) {
  const specimen = species[plant];
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <T
        style={{
          fontFamily: F.scientific,
          fontSize: 18,
          color: '#87734d',
          textAlign: 'center',
          paddingHorizontal: 20,
        }}
      >
        {destination
          ? stage === 0
            ? 'Une nouvelle espèce s’éveille…'
            : 'Une planche à retrouver…'
          : 'Le carnet des merveilles vivantes'}
      </T>
      <T serif style={{ fontSize: Math.min(41, width / 10), color: C.green }}>
        Herbier des couleurs
      </T>
      <T
        testID={destination ? 'book-destination-species' : 'book-source-species'}
        serif
        style={{
          fontSize: Math.min(34, width / 10.5),
          color: C.green,
          textAlign: 'center',
          paddingHorizontal: 20,
        }}
      >
        {specimen.name}
      </T>
      <T style={{ fontFamily: F.scientific, fontSize: 17, color: '#87734d', textAlign: 'center' }}>
        {specimen.latin}
      </T>
      <View
        testID={destination ? 'book-destination-plate' : 'book-source-plate'}
        style={{
          opacity: destination ? 0.85 : 0.52,
          transform: [{ rotate: '-4deg' }],
          marginVertical: 8,
        }}
      >
        <Botanical index={plant} stage={stage} size={Math.min(width * 0.68, height * 0.38, 360)} />
      </View>
      <T style={{ fontFamily: F.scientific, fontSize: 19, color: '#87734d' }}>
        {folio ? `Page ${String(folio).padStart(2, '0')}` : 'Le livre s’éveille…'}
      </T>
    </View>
  );
});
