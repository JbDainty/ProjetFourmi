import React from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import type { Save } from '../state/model';
import { species } from '../data/botany';
import type { HerbariumLayout } from '../layout/herbarium';
import { BotanicalSeal } from './BotanicalSeal';
import { Button, C, T } from './ui';
import { F } from './fonts';

export function HerbariumPigments({
  save,
  layout,
  anchor,
  onPage,
}: {
  save: Save;
  layout: HerbariumLayout;
  anchor: number;
  onPage: (index: number) => void;
}) {
  const count = layout.pigmentsPerPage,
    first = Math.floor(anchor / count) * count;
  const height = layout.pigmentHeight,
    compact = height < 135;
  const art = Math.max(20, Math.min(50, height * 0.28));
  return (
    <View testID="herbarium-pigments" style={{ flex: 1, minHeight: 0, width: '100%' }}>
      <View style={{ flex: 1, minHeight: 0, justifyContent: 'center' }}>
        {save.pigments.length === 0 ? (
          <T style={{ fontFamily: F.scientific, color: C.muted, textAlign: 'center' }}>
            Votre premier pigment vous attend à l’atelier.
          </T>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: layout.gap }}>
            {save.pigments.slice(first, first + count).map((p) => (
              <View
                key={p.id}
                testID="herbarium-pigment-card"
                style={{
                  width: layout.pigmentWidth,
                  height,
                  padding: compact ? 7 : 10,
                  borderRadius: 8,
                  borderWidth: 0.7,
                  borderColor: '#bba16b',
                  backgroundColor: '#f2e6c988',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: compact ? 1 : 3,
                }}
              >
                {height >= 105 &&
                  (p.id % 5 === 0 ? (
                    <BotanicalSeal size={art} />
                  ) : (
                    <Svg width={art} height={art} viewBox="0 0 50 50" accessible={false}>
                      <Ellipse cx="25" cy="45" rx="16" ry="2" fill="#9b8055" opacity=".18" />
                      <Path
                        d="M18 8H32V18Q42 24 41 35Q41 45 25 45Q9 45 9 35Q8 24 18 18Z"
                        fill="#dfdfc4"
                        stroke="#7b8d74"
                        strokeWidth="1"
                      />
                      <Path
                        d="M12 30Q25 34 38 30V35Q38 42 25 42Q12 42 12 35Z"
                        fill={p.shade}
                        opacity=".9"
                      />
                      <Path d="M16 7H34V13H16Z" fill="#c2a66d" stroke="#8f7446" />
                      <Path
                        d="M15 25 15 35M21 6 24 2 28 6"
                        stroke="#fff5ce"
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                  ))}
                <T
                  serif
                  numberOfLines={height < 105 ? 1 : 2}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.2}
                  style={{
                    fontSize: compact ? 15 : 19,
                    lineHeight: compact ? 17 : 22,
                    textAlign: 'center',
                  }}
                >
                  {p.id % 5 === 0 ? 'Sceau du botaniste' : p.name}
                </T>
                <T
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.15}
                  style={{
                    fontSize: compact ? 10 : 12,
                    lineHeight: compact ? 12 : 15,
                    color: C.muted,
                    textAlign: 'center',
                  }}
                >
                  {species[p.species].name}
                </T>
                {!compact && (
                  <T
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.15}
                    style={{
                      fontFamily: F.scientific,
                      fontSize: 12,
                      lineHeight: 15,
                      color: C.muted,
                    }}
                  >
                    {species[p.species].latin}
                  </T>
                )}
                <T
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                  style={{ fontSize: 9, lineHeight: 12, color: C.muted }}
                >
                  {p.id % 5 === 0 ? 'Apposé' : 'Découvert'} le{' '}
                  {new Date(p.discovered).toLocaleDateString('fr-FR')}
                </T>
              </View>
            ))}
          </View>
        )}
      </View>
      <View
        style={{
          height: layout.pagerHeight,
          marginTop: layout.gap,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Button
          secondary
          disabled={first === 0}
          onPress={() => onPage(Math.max(0, first - count))}
          style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 10 }}
        >
          Précédents
        </Button>
        <T style={{ fontFamily: F.scientific, color: C.muted, fontSize: 12 }}>
          {Math.floor(first / count) + 1} / {Math.max(1, Math.ceil(save.pigments.length / count))}
        </T>
        <Button
          secondary
          disabled={first + count >= save.pigments.length}
          onPress={() => onPage(first + count)}
          style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 10 }}
        >
          Suivants
        </Button>
      </View>
    </View>
  );
}
