import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { BotanicalStamp } from './BotanicalStamp';
import { chapters, species } from '../data/botany';
import { T, C } from './ui';
import { F } from './fonts';

export function ChapterVignette({
  plant,
  chapter,
  stage,
  compact,
  narrow,
  busy,
  onOpen,
}: {
  plant: number;
  chapter: number;
  stage: number;
  compact: boolean;
  narrow: boolean;
  busy: boolean;
  onOpen: () => void;
}) {
  return (
    <View
      testID="chapter-vignette"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: compact ? 12 : 0,
        paddingHorizontal: compact ? 7 : 12,
        paddingTop: 3,
        paddingBottom: 4,
      }}
    >
      <Svg
        pointerEvents="none"
        accessible={false}
        width="100%"
        height="100%"
        viewBox="0 0 340 150"
        preserveAspectRatio="none"
        style={{ position: 'absolute' }}
      >
        <G fill="none" stroke="#8c9463" strokeWidth=".65" opacity=".25">
          <Path d="M12 136 C36 146 27 60 87 42 Q163 16 291 30 M40 89 Q23 81 24 68 Q39 70 40 89 M55 63 Q52 47 64 42 Q67 56 55 63 M90 42 Q102 28 117 32 Q107 43 90 42" />
          <Path d="M304 31 Q321 34 325 22 Q318 20 312 26 M291 30 314 27" />
        </G>
      </Svg>
      {compact && (
        <View style={{ paddingTop: 12 }}>
          <BotanicalStamp index={plant} stage={stage} disabled={busy} onPress={onOpen} />
        </View>
      )}
      <View style={{ flex: 1, paddingLeft: compact ? 0 : 10 }}>
        <T
          style={{
            alignSelf: 'flex-end',
            marginRight: 6,
            transform: [{ rotate: '3deg' }],
            fontFamily: F.handwriting,
            fontSize: compact ? 18 : 22,
            lineHeight: 23,
            color: '#8b754d',
          }}
        >
          Chapitre {['I', 'II', 'III', 'IV', 'V'][chapter]}
        </T>
        <T
          style={{
            fontFamily: F.scientific,
            fontSize: compact ? 15 : 19,
            lineHeight: compact ? 20 : 24,
            color: '#746c53',
            marginTop: 1,
          }}
        >
          {chapters[chapter].name}
        </T>
        <T
          testID="current-species-heading"
          serif
          style={{
            fontSize: compact ? (narrow ? 25 : 30) : 38,
            lineHeight: compact ? 33 : 43,
            marginTop: 3,
            color: C.ink,
            transform: [{ rotate: '-1deg' }],
          }}
        >
          {species[plant].name}
        </T>
        <View
          accessible
          accessibilityLabel={`${stage} pigments sur 5 restaurés`}
          style={{
            alignSelf: 'flex-end',
            alignItems: 'center',
            marginTop: 3,
            marginRight: 5,
            transform: [{ rotate: '-2deg' }],
          }}
        >
          <Svg pointerEvents="none" accessible={false} width="118" height="20" viewBox="0 0 118 20">
            <Path d="M4 17 Q47 20 113 8" fill="none" stroke="#8e9b70" strokeWidth=".8" />
            {Array.from({ length: 5 }, (_, i) => (
              <G
                key={i}
                transform={`translate(${15 + i * 21} ${16 - i * 1.6}) rotate(${i % 2 ? 28 : -20})`}
              >
                <Path
                  d="M0 0 Q-8-4-2-12 Q5-9 0 0Z"
                  fill={i < stage ? '#829e68' : '#e9dcc0'}
                  stroke={i < stage ? '#536f49' : '#b2a37d'}
                  strokeWidth=".7"
                />
                <Path
                  d="M0 0-2-10"
                  fill="none"
                  stroke={i < stage ? '#536f49' : '#b2a37d'}
                  strokeWidth=".55"
                />
                {i < stage && <Circle cx="-.8" cy="-5" r=".55" fill="#f7ecc9" />}
              </G>
            ))}
          </Svg>
          <T
            style={{
              fontFamily: F.handwriting,
              fontSize: compact ? 16 : 19,
              lineHeight: 21,
              color: C.green,
            }}
          >
            {stage === 5
              ? 'Planche épanouie'
              : stage === 0
                ? 'À faire renaître'
                : `${stage} nuance${stage > 1 ? 's' : ''} retrouvée${stage > 1 ? 's' : ''}`}
          </T>
        </View>
      </View>
    </View>
  );
}
