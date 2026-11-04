import React from 'react';
import Svg, {
  Path,
  G,
  Ellipse,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  Line,
} from 'react-native-svg';
import { species } from '../data/botany';
type Props = { index: number; stage: number; size?: number; labels?: boolean };
const ink = '#585f46';
function BotanicalDrawing({ index, stage, size = 330, labels = true }: Props) {
  const s = species[index],
    green = stage >= 1 ? '#667e55' : '#b9b5a6',
    leaf = stage >= 2 ? '#8b9b6c' : '#d1cdc0',
    flower = stage >= 3 ? s.color : '#d4cfc3',
    detail = stage >= 4 ? '#746646' : '#aaa797';
  const id = `petal${index}-${stage}`;
  const leafShape = (x: number, y: number, angle: number, kind = 'lance', scale = 1) => (
    <G key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <Path
        d={
          kind === 'lobed'
            ? 'M0 0 C-15-8-32-12-22-24 L-38-29-25-37-37-47-21-45-22-60-8-54 0-78 C14-62 24-46 18-32 C36-19 14-4 0 0Z'
            : kind === 'round'
              ? 'M0 0 C-46-9-46-55-18-59 C-6-61 0-48 0-48 C8-66 32-65 38-45 C49-17 18-4 0 0Z'
              : 'M0 0 C-27-20-27-54 0-86 C22-56 25-22 0 0Z'
        }
        fill={leaf}
        stroke={ink}
        strokeWidth=".7"
      />
      <Path
        d="M0 0 Q-3-29 0-69 M-1-20-16-32 M-1-36-14-48 M1-19 14-31 M1-37 13-49"
        fill="none"
        stroke={green}
        strokeWidth=".7"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <Path
          key={i}
          d={`M0 ${-12 - i * 5} Q${i % 2 ? -9 : 9} ${-18 - i * 5} ${i % 2 ? -14 : 14} ${-23 - i * 5}`}
          fill="none"
          stroke={ink}
          strokeWidth=".3"
          opacity=".4"
        />
      ))}
      {s.form === 'clover' && (
        <Path d="M-19-30-1-45 18-30" fill="none" stroke="#eff0d4" strokeWidth="4" opacity=".7" />
      )}
    </G>
  );
  const stamen = (x: number, y: number, r = 17) => (
    <G>
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i * Math.PI) / 11;
        return (
          <G key={i}>
            <Line
              x1={x}
              y1={y}
              x2={x + Math.cos(a) * r}
              y2={y + Math.sin(a) * r}
              stroke={detail}
              strokeWidth=".65"
            />
            <Ellipse
              cx={x + Math.cos(a) * r}
              cy={y + Math.sin(a) * r}
              rx="1.8"
              ry="1.2"
              fill={detail}
            />
          </G>
        );
      })}
      <Circle cx={x} cy={y} r="7" fill={detail} />
    </G>
  );
  const blossom = (x: number, y: number, type: string, scale = 1) => (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      {type === 'poppy' ? (
        <>
          <Path
            d="M-4 2 C-38 3-73-28-58-53 C-55-58-43-54-41-61 C-23-69 4-38 4-6Z"
            fill={`url(#${id})`}
            stroke={flower}
            strokeWidth="1"
          />
          <Path
            d="M0-4 C-17-39 0-72 20-65 C25-70 35-59 38-61 C65-56 57-18 9 3Z"
            fill={`url(#${id})`}
            stroke={flower}
          />
          <Path
            d="M4 0 C38-25 65-15 57 7 C66 22 42 42 21 33 L0 10Z M-2 4 C-19-20-58-21-57 4 C-63 22-35 45-14 30 L4 12Z"
            fill={`url(#${id})`}
            stroke={flower}
          />
          {Array.from({ length: 13 }, (_, i) => (
            <Path
              key={i}
              d={`M0 2 Q${-40 + i * 6} -15 ${-52 + i * 8} ${-28 - Math.sin(i) * 12}`}
              stroke={flower}
              opacity=".4"
              fill="none"
              strokeWidth=".6"
            />
          ))}
          {stamen(0, 0, 19)}
        </>
      ) : type === 'cornflower' ? (
        <>
          <Path d="M-18 10 Q-25 40 0 46 Q25 40 18 10Z" fill={leaf} stroke={ink} strokeWidth=".6" />
          {Array.from({ length: 7 }, (_, i) => (
            <Path
              key={i}
              d={`M${-16 + i * 5} 14 l-3 12 7 9-3 10`}
              stroke={ink}
              fill="none"
              strokeWidth=".5"
            />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <G key={i} rotation={(i * 360) / 14}>
              <Path
                d="M-4-5 Q-14-20-12-36 L-20-46-8-44-4-57 2-43 13-49 7-35 Q12-17 4-4Z"
                fill={`url(#${id})`}
                stroke={flower}
                strokeWidth=".8"
              />
              <Path d="M0-8 0-39" stroke={ink} opacity=".35" strokeWidth=".7" />
            </G>
          ))}
          {stamen(0, 0, 12)}
        </>
      ) : type === 'daisy' ||
        type === 'anemone' ||
        type === 'caltha' ||
        type === 'strawberry' ||
        type === 'cistus' ? (
        <>
          {Array.from({ length: type === 'daisy' ? 20 : type === 'anemone' ? 6 : 5 }, (_, i) => {
            const n = type === 'daisy' ? 20 : type === 'anemone' ? 6 : 5;
            return (
              <G key={i} rotation={(i * 360) / n}>
                <Path
                  d={
                    type === 'daisy'
                      ? 'M-4-9 Q-13-39-5-50 Q4-59 9-47 Q12-34 4-9Z'
                      : 'M-5-8 C-42-32-30-64-4-58 C20-65 36-39 5-8Z'
                  }
                  fill={`url(#${id})`}
                  stroke={ink}
                  strokeWidth=".5"
                />
                <Path d="M0-12 0-44" stroke={flower} strokeWidth=".6" />
              </G>
            );
          })}
          {stamen(0, 0, type === 'daisy' ? 16 : 13)}
        </>
      ) : type === 'clover' || type === 'mint' ? (
        <>
          {Array.from({ length: 44 }, (_, i) => {
            const a = i * 2.39996,
              r = Math.sqrt(i) * 5;
            return (
              <Path
                key={i}
                d={`M${Math.cos(a) * r} ${Math.sin(a) * r + 8} q-9-12-2-23 q10 4 2 17Z`}
                fill={`url(#${id})`}
                stroke={ink}
                strokeWidth=".4"
              />
            );
          })}
        </>
      ) : type === 'edelweiss' ? (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <Path
              key={i}
              rotation={i * 40}
              d="M-4-4 Q-17-31 0-57 Q15-25 4-4Z"
              fill={flower}
              stroke={ink}
              strokeWidth=".5"
            />
          ))}
          {[
            [-9, -7],
            [9, -7],
            [0, 10],
          ].map(([a, b], i) => (
            <G key={i}>{stamen(a, b, 9)}</G>
          ))}
        </>
      ) : type === 'iris' ? (
        <>
          {[-1, 0, 1].map((a, i) => (
            <G key={i} rotation={a * 120}>
              <Path
                d="M0 0 C-34-6-46 27-28 43 C-10 51 12 28 0 0 M0-5 C-35-24-19-61 0-57 C20-48 15-18 0-5"
                fill={`url(#${id})`}
                stroke={ink}
                strokeWidth=".6"
              />
              <Path d="M0 0 Q-18 12-22 31" stroke={detail} strokeWidth="3" />
            </G>
          ))}
        </>
      ) : type === 'gentian' ||
        type === 'bellflower' ||
        type === 'lily' ||
        type === 'foxglove' ||
        type === 'rhododendron' ||
        type === 'arbutus' ? (
        <>
          <Path
            d={
              type === 'lily' || type === 'arbutus'
                ? 'M-12-27 Q-25 1-15 14 L-8 9 0 16 8 9 15 14 Q25 1 12-27Z'
                : 'M-16-44 Q-15-10-36 12 L-21 8-12 22 0 12 12 22 21 8 35 12 Q14-10 16-44Z'
            }
            fill={`url(#${id})`}
            stroke={ink}
            strokeWidth=".7"
          />
          <Path d="M-10-35 Q-6-10-16 6 M4-34 Q2-8 8 7" fill="none" stroke={flower} />
          {type === 'foxglove' &&
            Array.from({ length: 13 }, (_, i) => (
              <Circle
                key={i}
                cx={(i % 4) * 7 - 10}
                cy={Math.floor(i / 4) * 8 - 6}
                r="1.5"
                fill={detail}
              />
            ))}
        </>
      ) : type === 'small' &&
        (s.form === 'lavender' || s.form === 'rosemary' || s.form === 'loosestrife') ? (
        <>
          {s.form === 'loosestrife' ? (
            Array.from({ length: 6 }, (_, i) => (
              <Path
                key={i}
                rotation={i * 60}
                d="M0 0 Q-16-13-5-28 Q8-33 10-17Z"
                fill={`url(#${id})`}
                stroke={ink}
                strokeWidth=".5"
              />
            ))
          ) : (
            <>
              <Path
                d="M0 0 Q-22-7-14-24 Q-7-31 0-16 Q10-31 17-21 Q25-4 3 1 Q29 10 20 22 Q12 31 0 13 Q-17 33-25 20 Q-31 7 0 0Z"
                fill={`url(#${id})`}
                stroke={ink}
                strokeWidth=".7"
              />
              <Path
                d="M0 0 Q10-16 25-13 M2 0 Q13-9 26-5"
                stroke={detail}
                fill="none"
                strokeWidth=".8"
              />
            </>
          )}
          {stamen(0, 0, 5)}
        </>
      ) : (
        <>
          {Array.from({ length: 5 }, (_, i) => (
            <Path
              key={i}
              rotation={i * 72}
              d="M0 0 C-20-6-16-28-3-23 Q10-28 11-15Z"
              fill={`url(#${id})`}
              stroke={ink}
              strokeWidth=".5"
            />
          ))}
          {stamen(0, 0, 6)}
        </>
      )}
    </G>
  );
  const spikes = ['foxglove', 'loosestrife', 'lavender'].includes(s.form);
  const woody = ['arbutus', 'rosemary', 'rhododendron', 'cistus'].includes(s.form);
  return (
    <Svg
      width={size}
      height={size * 1.36}
      viewBox="0 0 360 490"
      accessibilityLabel={`Planche de ${s.name}, ${stage} couleurs sur cinq restaurées`}
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={stage >= 5 ? '#f7eedc' : flower} />
          <Stop offset=".5" stopColor={flower} />
          <Stop offset="1" stopColor={stage >= 3 ? s.color : '#bdb9ae'} stopOpacity=".8" />
        </LinearGradient>
      </Defs>
      <G opacity={stage === 0 ? 0.58 : 1}>
        <Path
          d={
            woody
              ? 'M173 440 Q168 340 184 258 Q191 212 176 137 M181 306 Q219 260 246 202 M178 350 Q132 300 110 230'
              : 'M177 441 Q149 340 182 248 Q204 189 180 119'
          }
          fill="none"
          stroke={green}
          strokeWidth={woody ? 3 : 2}
        />
        {s.form === 'clover' || s.form === 'strawberry' ? (
          <>
            {[290, 365].map((y, i) => (
              <G key={y}>
                <Path d={`M174 ${y + 30} Q120 ${y} 104 ${y - 40}`} stroke={green} fill="none" />
                {[-54, 0, 54].map((a) => leafShape(110, y - 35, a, 'round', 0.65))}
              </G>
            ))}
          </>
        ) : ['iris', 'gentian', 'lily'].includes(s.form) ? (
          <>
            {[-32, -15, 14, 28].map((a, i) => (
              <Path
                key={i}
                d={`M177 438 Q${110 + a} 320 ${155 + a} ${s.form === 'iris' ? 163 : 260} Q${208 + a} 334 177 438Z`}
                fill={leaf}
                stroke={ink}
                strokeWidth=".6"
              />
            ))}
          </>
        ) : (
          <>
            {leafShape(
              171,
              365,
              -58,
              s.form === 'poppy' || s.form === 'anemone'
                ? 'lobed'
                : s.form === 'caltha'
                  ? 'round'
                  : 'lance',
              s.form === 'cornflower' || s.form === 'rosemary' ? 0.45 : woody ? 0.7 : 0.9,
            )}
            {leafShape(
              178,
              307,
              52,
              s.form === 'poppy' ? 'lobed' : 'lance',
              s.form === 'cornflower' || s.form === 'rosemary' ? 0.4 : 0.8,
            )}
            {leafShape(
              184,
              253,
              -49,
              s.form === 'poppy' ? 'lobed' : 'lance',
              s.form === 'cornflower' ? 0.35 : 0.6,
            )}
            {woody && (
              <>
                {leafShape(222, 245, 35, 'lance', 0.6)}
                {leafShape(122, 259, -32, 'lance', 0.7)}
              </>
            )}
          </>
        )}
        {s.form === 'poppy' ? (
          <>
            {blossom(180, 125, 'poppy', 1.1)}
            <Path
              d="M182 271 Q250 246 246 187 Q245 164 220 175"
              fill="none"
              stroke={green}
              strokeWidth="1.5"
            />
            <Ellipse cx="218" cy="183" rx="12" ry="18" rotation="-35" fill={leaf} stroke={ink} />
            <Path d="M149 360 Q102 289 105 226" fill="none" stroke={green} />
            <Path
              d="M93 201 Q86 230 105 232 Q124 230 117 201Z"
              fill={leaf}
              stroke={ink}
              strokeWidth=".7"
            />
            <Ellipse cx="105" cy="202" rx="14" ry="3" fill={detail} />
            {Array.from({ length: 22 }, (_, i) => (
              <Line
                key={i}
                x1={178 + Math.sin(i / 4) * 7}
                y1={200 + i * 9}
                x2={183 + Math.sin(i / 4) * 7}
                y2={198 + i * 9}
                stroke={green}
                strokeWidth=".6"
              />
            ))}
          </>
        ) : spikes ? (
          <>
            {Array.from({ length: s.form === 'foxglove' ? 11 : 18 }, (_, i) => {
              const y = 96 + i * 10,
                x = 180 + (i % 2 ? 17 : -14);
              return (
                <G key={i}>
                  {blossom(
                    x,
                    y,
                    s.form === 'foxglove' ? 'foxglove' : 'small',
                    s.form === 'foxglove' ? 0.43 : 0.35,
                  )}
                </G>
              );
            })}
            {s.form === 'lavender' && (
              <>
                <Path
                  d="M176 390 Q115 289 120 159 M180 350 Q238 259 243 154"
                  stroke={green}
                  fill="none"
                />
                {Array.from({ length: 10 }, (_, i) => (
                  <G key={i}>
                    {blossom(120 + (i % 2) * 8, 155 + i * 8, 'small', 0.23)}
                    {blossom(242 + (i % 2) * 8, 147 + i * 8, 'small', 0.23)}
                  </G>
                ))}
              </>
            )}
          </>
        ) : s.form === 'lily' || s.form === 'arbutus' ? (
          <>
            {Array.from({ length: 7 }, (_, i) => (
              <G key={i}>
                <Path
                  d={`M185 ${135 + i * 19} Q${224 + i * 2} ${110 + i * 19} ${228 + i * 2} ${144 + i * 19}`}
                  fill="none"
                  stroke={green}
                />
                {blossom(228 + i * 2, 154 + i * 19, s.form, 0.48)}
              </G>
            ))}
            {s.form === 'arbutus' && (
              <>
                <Circle
                  cx="112"
                  cy="252"
                  r="14"
                  fill={stage >= 4 ? '#b85842' : '#c7c2b3'}
                  stroke={ink}
                />
                {Array.from({ length: 18 }, (_, i) => (
                  <Circle
                    key={i}
                    cx={112 + Math.cos(i * 2.4) * Math.sqrt(i) * 2.7}
                    cy={252 + Math.sin(i * 2.4) * Math.sqrt(i) * 2.7}
                    r="1.2"
                    fill={detail}
                  />
                ))}
              </>
            )}
          </>
        ) : s.form === 'rhododendron' ? (
          <>
            {[-36, -12, 14, 37].map((x, i) => (
              <G key={x}>{blossom(180 + x, 130 + Math.abs(x) / 2, s.form, 0.6)}</G>
            ))}
          </>
        ) : (
          <>
            {blossom(180, 130, s.form, s.form === 'gentian' ? 1.2 : 0.9)}
            {['cornflower', 'daisy', 'bellflower', 'rosemary'].includes(s.form) && (
              <>
                <Path d="M176 310 Q106 229 108 197" stroke={green} fill="none" />
                {blossom(108, 191, s.form, 0.55)}
              </>
            )}
            {s.form === 'strawberry' && (
              <Path
                d="M230 274 Q208 294 235 316 Q262 288 245 275Z"
                fill={stage >= 4 ? '#b75b48' : '#cac5b7'}
                stroke={ink}
              />
            )}
          </>
        )}
        <G opacity=".8">
          <Circle cx="285" cy="390" r="35" stroke="#b1ad9a" strokeWidth=".5" fill="none" />
          {blossom(285, 390, s.form, 0.36)}
          <SvgText x="260" y="436" fontSize="7" fill="#8a8978" fontStyle="italic">
            détail floral
          </SvgText>
        </G>
      </G>
      {labels && (
        <>
          <Line x1="239" y1="334" x2="285" y2="320" stroke="#b1ad9a" strokeWidth=".5" />
          <SvgText x="280" y="314" fontSize="8" fill="#8a8978" fontStyle="italic">
            folium
          </SvgText>
          <SvgText x="38" y="453" fontSize="9" fill="#8a8978" letterSpacing="2">
            FIG. {String(index + 1).padStart(2, '0')}
          </SvgText>
          <SvgText x="253" y="453" fontSize="8" fill="#8a8978">
            HERBARIUM
          </SvgText>
        </>
      )}
    </Svg>
  );
}

export const Botanical = React.memo(BotanicalDrawing);
