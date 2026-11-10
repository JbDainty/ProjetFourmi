import { expandedIllustrationAtlases } from '../data/expandedIllustrations';
import React, { useId } from 'react';
import Svg, {
  Image as SvgImage,
  Defs,
  Filter,
  FeColorMatrix,
  G,
  ClipPath,
  Rect,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { F } from './fonts';
import { species } from '../data/botany';
import { illustrationAtlases } from '../data/illustrations';
import {
  restorationDescription,
  restorationState,
  restorationWash,
  sealPosition,
} from '../animation/restoration';
import { SealMark } from './BotanicalSeal';

type Props = { index: number; stage: number; size?: number; labels?: boolean };
// Four independently painted species per atlas. One uniform wash preserves their natural edges.
function BotanicalDrawing({ index, stage, size = 330, labels = true }: Props) {
  const token = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const uid = (name: string) => `botanical-${token}-${name}`;
  const s = species[index],
    local = index < 20 ? index % 4 : (index - 20) % 9,
    chapter = Math.floor(index / 4),
    restored = restorationState(stage);
  const wash = restorationWash(stage);
  const atlas =
    index < 20
      ? illustrationAtlases[chapter]
      : expandedIllustrationAtlases[Math.floor((index - 20) / 9)];
  const bounds = atlas.bounds[local];
  const margin = index < 20 ? 6 : 0;
  const left = Math.max(0, bounds[0] - margin),
    top = Math.max(0, bounds[1] - margin);
  const right = Math.min(atlas.width, bounds[2] + margin),
    bottom = Math.min(atlas.height, bounds[3] + margin);
  const factor = Math.min(308 / (right - left), 462 / (bottom - top));
  const frame = {
    x: 26 + (308 - (right - left) * factor) / 2,
    y: 4 + (462 - (bottom - top) * factor) / 2,
    width: (right - left) * factor,
    height: (bottom - top) * factor,
  };
  const geometry = {
    x: frame.x - left * factor,
    y: frame.y - top * factor,
    width: atlas.width * factor,
    height: atlas.height * factor,
  };
  const art = (extra: React.ComponentProps<typeof SvgImage> = {}) => (
    <SvgImage href={atlas.source} {...geometry} preserveAspectRatio="none" {...extra} />
  );
  return (
    <Svg
      width={size}
      height={size * 1.36}
      viewBox="0 0 360 490"
      accessibilityLabel={`Planche de ${s.name}, ${restorationDescription(stage)}`}
    >
      <Defs>
        <ClipPath id={uid('cell')}>
          <Rect {...frame} />
        </ClipPath>
        <Filter id={uid('wash')} x="0%" y="0%" width="100%" height="100%">
          <FeColorMatrix type="matrix" values={wash.matrix.join(' ')} />
        </Filter>
      </Defs>
      <G clipPath={`url(#${uid('cell')})`}>
        {art({
          filter: restored.colors < 4 ? `url(#${uid('wash')})` : undefined,
          opacity: wash.opacity,
        })}
      </G>
      {restored.sealed && (
        <G
          testID="botanical-restoration-seal"
          transform={`translate(${sealPosition.x} ${sealPosition.y}) rotate(${sealPosition.angle}) scale(${sealPosition.diameter / 76})`}
        >
          <SealMark />
        </G>
      )}
      {labels && (
        <>
          <Line
            x1="31"
            y1="472"
            x2="329"
            y2="472"
            stroke="#9a7d54"
            strokeWidth="0.45"
            opacity="0.55"
          />
          <SvgText
            x="32"
            y="486"
            fontSize="8"
            fontFamily={F.medium}
            fill="#806c4d"
            letterSpacing="1.6"
          >
            PL. {String(index + 1).padStart(2, '0')}
          </SvgText>
          <SvgText
            x="329"
            y="486"
            textAnchor="end"
            fontSize="8"
            fill="#806c4d"
            fontFamily={F.scientific}
          >
            Flore d’Europe · {s.family}
          </SvgText>
        </>
      )}
    </Svg>
  );
}
export const Botanical = React.memo(BotanicalDrawing);
