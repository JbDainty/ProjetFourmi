import React, { useId } from 'react';
import Svg, {
  Image as SvgImage,
  Defs,
  Filter,
  FeColorMatrix,
  G,
  ClipPath,
  Rect,
  Path,
  Mask,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { F } from './fonts';
import { species } from '../data/botany';
import { illustrationAtlases } from '../data/illustrations';

type Props = { index: number; stage: number; size?: number; labels?: boolean };
// Four independently painted species per atlas, in reading order. The PNGs stay
// unmodified: desaturation and anatomical reveals are rendered by native SVG.
function BotanicalDrawing({ index, stage, size = 330, labels = true }: Props) {
  const token = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const uid = (name: string) => `botanical-${token}-${name}`;
  const s = species[index],
    local = index % 4,
    chapter = Math.floor(index / 4),
    restored = Math.max(0, Math.min(5, stage));
  const atlas = illustrationAtlases[chapter];
  const bounds = atlas.bounds[local];
  const left = Math.max(0, bounds[0] - 6),
    top = Math.max(0, bounds[1] - 6);
  const right = Math.min(atlas.width, bounds[2] + 6),
    bottom = Math.min(atlas.height, bounds[3] + 6);
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
      accessibilityLabel={`Planche de ${s.name}, ${restored} couleurs sur cinq restaurées`}
    >
      <Defs>
        <ClipPath id={uid('cell')}>
          <Rect {...frame} />
        </ClipPath>
        <ClipPath id={uid('stem')}>
          <Path
            d="M180 460 Q165 342 184 227 Q190 175 180 106 M178 354 Q125 300 95 250 M181 308 Q235 260 253 178"
            fill="none"
            stroke="white"
            strokeWidth="10"
          />
        </ClipPath>
        <ClipPath id={uid('flowers')}>
          <Rect
            x="26"
            y="4"
            width="308"
            height={index === 5 || index === 10 || index === 16 ? 310 : 235}
          />
        </ClipPath>
        <Filter id={uid('ink')} x="0%" y="0%" width="100%" height="100%">
          <FeColorMatrix
            type="matrix"
            values="0.23 0.64 0.10 0 0.06 0.21 0.58 0.09 0 0.04 0.16 0.46 0.07 0 0.02 0 0 0 1 0"
          />
        </Filter>
        <Filter id={uid('green-channel')} x="0%" y="0%" width="100%" height="100%">
          <FeColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -6 10 -4 0 -0.6" />
        </Filter>
        <Mask
          id={uid('foliage')}
          x="26"
          y="4"
          width="308"
          height="462"
          maskUnits="userSpaceOnUse"
          maskType="alpha"
        >
          {art({ filter: `url(#${uid('green-channel')})` })}
        </Mask>
      </Defs>
      <G clipPath={`url(#${uid('cell')})`}>
        {restored < 5 &&
          art({ filter: `url(#${uid('ink')})`, opacity: restored === 0 ? 0.76 : 0.9 })}
        {restored === 1 && (
          <G clipPath={`url(#${uid('stem')})`} mask={`url(#${uid('foliage')})`}>
            {art()}
          </G>
        )}
        {restored >= 2 && restored < 4 && <G mask={`url(#${uid('foliage')})`}>{art()}</G>}
        {restored === 3 && <G clipPath={`url(#${uid('flowers')})`}>{art({ opacity: 0.88 })}</G>}
        {restored >= 4 && art({ opacity: restored === 5 ? 1 : 0.87 })}
      </G>
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
