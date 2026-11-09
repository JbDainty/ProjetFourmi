import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Paper } from './Paper';
import { Botanical } from './Botanical';
import { RestorationProgress } from './RestorationProgress';
import { useMeasuredSize } from './useMeasuredSize';
import { T, Label, C, Icon } from './ui';
import { F } from './fonts';
import { species } from '../data/botany';

export function WorkshopPlate({ plant, stage }: { plant: number; stage: number }) {
  const art = useMeasuredSize();
  const size = Math.max(0, Math.min(260, art.size.width, art.size.height / 1.36));
  return (
    <Paper
      testID="atelier-full-plate"
      vitality={stage / 5}
      style={{
        flex: 1,
        height: '100%',
        minHeight: 0,
        padding: 14,
        borderRadius: 28,
        alignItems: 'center',
        backgroundColor: '#f4ead6ed',
        gap: 4,
      }}
    >
      <Label>PLANCHE {String(plant + 1).padStart(2, '0')}</Label>
      <View
        ref={art.ref}
        collapsable={false}
        onLayout={art.onLayout}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {size > 0 && <Botanical index={plant} stage={stage} size={size} />}
      </View>
      <T
        serif
        maxFontSizeMultiplier={1.15}
        numberOfLines={2}
        adjustsFontSizeToFit
        style={{ fontSize: 26, lineHeight: 30, textAlign: 'center' }}
      >
        {species[plant].name}
      </T>
      <T
        maxFontSizeMultiplier={1.15}
        numberOfLines={2}
        adjustsFontSizeToFit
        style={{
          fontFamily: F.scientific,
          fontSize: 16,
          lineHeight: 20,
          textAlign: 'center',
          color: C.muted,
        }}
      >
        {species[plant].latin}
      </T>
      <RestorationProgress stage={stage} compact />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Observer la planche"
        onPress={() => router.push({ pathname: '/herbier', params: { plant: String(plant) } })}
        style={{
          minHeight: 44,
          flexDirection: 'row',
          gap: 6,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="eye-outline" size={18} color={C.green} />
        <T style={{ fontFamily: F.scientific, fontSize: 13, color: C.green }}>
          Observer la planche
        </T>
      </Pressable>
    </Paper>
  );
}
