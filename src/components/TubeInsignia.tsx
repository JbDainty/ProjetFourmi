import React, { memo } from 'react';
import { G, Path, Ellipse, Circle, Text as SvgText } from 'react-native-svg';
import type { Board } from '../engine/puzzle';
import { blocked, crystalOpen, gateOpen, capacity } from '../engine/puzzle';
import type { Rules } from '../engine/mechanics';
import { palette, colorNames } from '../data/botany';
import { RuleMark } from './RuleMark';
import { F } from './fonts';

const brass = '#a17a3e';
const ivory = '#f6e8bd';
const ink = '#3e503e';
const plate =
  'M-17-9Q-17-13-10-13L-5-16Q0-19 5-16L10-13Q17-13 17-9V8Q16 12 8 12L0 16-8 12Q-16 12-17 8Z';
export function tubeRuleHint(board: Board, rules: Rules | undefined, tube: number) {
  if (!rules) return undefined;
  const text = [`Capacité ${capacity(rules, tube)}.`];
  const gate = rules.gates?.find((g) => g.tube === tube);
  if (gate)
    text.push(
      blocked(board, tube, rules)
        ? `Verrou fermé : complétez la fiole ${gate.key + 1} au pinceau.`
        : 'Verrou ouvert.',
    );
  const opened = rules.gates?.filter((g) => g.key === tube).map((g) => g.tube + 1);
  if (opened?.length)
    text.push(`Pinceau : terminer cette fiole ouvre les fioles ${opened.join(', ')}.`);
  if (rules.mystery?.includes(tube))
    text.push('Verre givré : teintes masquées révélées au sommet.');
  if (rules.pipettes?.includes(tube)) text.push('Compte-gouttes : verse une mesure.');
  if (rules.collectors?.includes(tube)) text.push('Conservation : reçoit seulement.');
  for (const pair of rules.links ?? [])
    if (pair.includes(tube))
      text.push(
        `Fiole sœur reliée à la fiole ${pair.find((i) => i !== tube)! + 1} : même teinte au sommet.`,
      );
  for (const f of rules.filters ?? [])
    if (f.tube === tube)
      text.push(`Filtre : reçoit uniquement ${colorNames[f.color].toLocaleLowerCase('fr')}.`);
  for (const c of rules.crystals ?? [])
    if (c.tube === tube)
      text.push(
        crystalOpen(board, c.color, rules)
          ? 'Cristal libéré.'
          : `Cristal : complétez une fiole ${colorNames[c.color].toLocaleLowerCase('fr')}.`,
      );
  return text.join(' ');
}
/** Drawn in glass coordinates: collars, engravings and fittings travel with the
 * vessel, including extraction and pouring. No free-floating scene labels. */
export const TubeInsignia = memo(function TubeInsignia({
  board,
  rules,
  tube,
  unitScale,
  selected = null,
}: {
  board: Board;
  rules?: Rules;
  tube: number;
  unitScale: number;
  selected?: number | null;
}) {
  if (!rules) return null;
  const gate = rules.gates?.find((g) => g.tube === tube);
  const isKey = rules.gates?.some((g) => g.key === tube);
  const locked = blocked(board, tube, rules);
  const key = gate?.key ?? (isKey ? tube : undefined);
  const group =
    key === undefined
      ? -1
      : [...new Set(rules.gates!.map((g) => g.key))].sort((a, b) => a - b).indexOf(key);
  const metal = group >= 0 ? ['#b38b46', '#719a91', '#ad7168'][group % 3] : brass;
  const pipette = rules.pipettes?.includes(tube);
  const collector = rules.collectors?.includes(tube);
  const filter = rules.filters?.find((f) => f.tube === tube);
  const crystals = rules.crystals?.filter((c) => c.tube === tube) ?? [];
  const mystery = rules.mystery?.includes(tube);
  const linked = rules.links?.some((pair) => pair.includes(tube));
  const focused =
    selected === tube ||
    (selected !== null &&
      (rules.links?.some((pair) => pair.includes(tube) && pair.includes(selected)) ||
        rules.gates?.some(
          (g) => (g.key === selected && g.tube === tube) || (g.key === tube && g.tube === selected),
        ) ||
        crystals.some((c) => board[selected]?.at(-1) === c.color)));
  const boost = Math.min(1.25, Math.max(1, 0.8 / unitScale));
  const emblem = (kind: string, y: number, tint = metal, active = true) => (
    <G key={kind} transform={`translate(0 ${y}) scale(${boost})`} opacity={active ? 1 : 0.45}>
      <Path
        d={plate}
        fill={focused ? '#fff0bd' : ivory}
        stroke={focused ? '#ceac55' : tint}
        strokeWidth={focused ? 1.8 : 1.25}
      />
      <Path
        d="M-13-8Q-7-11 0-13Q7-11 13-8M-12 7 0 11 12 7"
        stroke="#fff7dc"
        strokeWidth=".8"
        fill="none"
      />
      <G transform="scale(.95)">
        <RuleMark
          kind={kind}
          color={kind === 'crystal' ? '#fff0c4' : ink}
          accent={kind === 'crystal' ? tint : undefined}
        />
      </G>
      <Circle cx="-13" cy="-3" r="1.1" fill={tint} />
      <Circle cx="13" cy="-3" r="1.1" fill={tint} />
    </G>
  );
  return (
    <G testID={`tube-insignia-${tube}`}>
      {mystery && (
        <G testID={`tube-frost-${tube}`} fill="none" strokeLinecap="round">
          <Path
            d="M-20 43Q-16 65-21 86Q-16 108-19 139M20 43Q16 65 21 86Q16 108 19 139"
            stroke="#eae2ef"
            strokeWidth="2.1"
            strokeOpacity=".8"
          />
          <Path
            d="M-21 38Q0 44 21 38L20 45Q0 52-20 45Z"
            fill="#dedce7"
            fillOpacity=".42"
            stroke="#f2eee5"
            strokeWidth=".9"
          />
          <Path
            d="M-18 69-14 73-18 77-22 73ZM18 96 22 100 18 104 14 100Z"
            fill="#f2eee5"
            stroke="#a297b2"
            strokeWidth=".6"
          />
          <Path
            d="M-19 61-13 54M-20 86-14 80M-18 112-12 105M19 61 13 54M20 86 14 80M18 112 12 105"
            stroke="#776c8b"
            strokeOpacity=".7"
            strokeWidth="1"
          />
        </G>
      )}
      {(gate || isKey || pipette || collector || filter) && (
        <G testID={`tube-collar-${tube}`}>
          <Path
            d="M-24 18Q0 24 24 18L24 28Q0 35-24 28Z"
            fill={gate || isKey ? metal : filter ? palette[filter.color] : metal}
            stroke="#6c6748"
            strokeWidth=".8"
          />
          <Ellipse cy="18" rx="24" ry="4" fill="none" stroke="#f5df9a" strokeWidth="1.1" />
          <Path
            d="M-20 27Q0 33 20 27M-19 21-15 23M19 21 15 23"
            stroke="#fff0c4"
            strokeWidth=".8"
            fill="none"
          />
          {key !== undefined && (
            <G fill="#fff0c4">
              {Array.from({ length: group + 1 }, (_, i) => (
                <Circle key={i} cx={(i - group / 2) * 5} cy="25" r="1.4" />
              ))}
            </G>
          )}
        </G>
      )}
      {gate && (
        <G testID={`tube-lock-${tube}`}>
          <Path
            d="M0 30V42M-22 31-20 132Q-20 146-11 150M22 31 20 132Q20 146 11 150"
            stroke={metal}
            strokeWidth={locked ? 1.3 : 0.65}
            strokeOpacity={locked ? 0.8 : 0.4}
            fill="none"
          />
          {locked && (
            <Path
              testID={`tube-sealed-mouth-${tube}`}
              d="M-23 9Q0 0 23 9L22 16Q0 23-22 16Z M-18 7Q0-1 18 7"
              fill="#536952"
              stroke={metal}
              strokeWidth="1.1"
            />
          )}
          {locked && (
            <Path
              d="M-20 36Q-27 53-21 68M20 36Q27 53 21 68M-21 59Q-14 56-16 50M21 59Q14 56 16 50"
              fill="none"
              stroke="#77906a"
              strokeWidth="1.8"
            />
          )}
          {emblem(locked ? 'lock' : 'unlock', 49, metal, !gateOpen(board, gate.key, rules))}
          {!locked && (
            <Path
              testID={`tube-open-mouth-${tube}`}
              d="M-24 12Q-31 2-23-6L-17-7M20 15Q28 15 27 7"
              fill="none"
              stroke={metal}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </G>
      )}
      {isKey && (
        <G testID={`tube-brush-${tube}`}>
          <Path
            d="M13 15 18-14Q20-18 22-14L18 16Z"
            fill="#ae8753"
            stroke="#ead395"
            strokeWidth=".8"
          />
          <Path
            d="M13 13 18 14 17 20Q16 28 11 29Q9 22 13 13Z"
            fill="#5d8661"
            stroke="#e9d5a2"
            strokeWidth=".8"
          />
          <Path d="M14 11 19 12M13 14 18 15" stroke="#eee0ac" strokeWidth="1.2" />
          {emblem('brush', gate ? 101 : 49, metal)}
        </G>
      )}
      {pipette && (
        <G testID={`tube-pipette-${tube}`}>
          <Path
            d="M-9 6V-4Q-9-18 0-18Q9-18 9-4V6Z"
            fill="#466d59"
            stroke="#293f35"
            strokeWidth="1.2"
          />
          <Path d="M-5-4V-8Q-5-13-1-13" fill="none" stroke="#91aa83" strokeWidth="1.5" />
          <Path
            d="M-12 6Q0 1 12 6L11 14Q0 19-11 14Z"
            fill="#c9b37c"
            stroke={brass}
            strokeWidth="1.2"
          />
          <Path
            d="M-3 17V34L0 39 3 34V17M0 42Q-5 48 0 51Q5 48 0 42Z"
            fill="#c1d6c4"
            stroke="#678779"
            strokeWidth=".9"
          />
          {emblem('pipette', gate || isKey ? 101 : 49)}
        </G>
      )}
      {collector && (
        <G testID={`tube-conservation-${tube}`}>
          {emblem('conservation', gate || isKey || pipette ? 101 : 49)}
          <Path
            d="M-16 149Q0 158 16 149M-12 150-8 145M12 150 8 145"
            stroke={brass}
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M-21 140Q-28 151-17 157Q0 166 17 157Q28 151 21 140L17 151Q0 160-17 151Z"
            fill="#9caa77"
            stroke={brass}
            strokeWidth="1.2"
          />
          <Path
            d="M-14 153-10 145M-4 157-3 149M5 157 5 149M14 153 10 145M-5 22 0 27 5 22"
            fill="none"
            stroke="#e9d99f"
            strokeWidth="1.1"
          />
        </G>
      )}
      {filter && (
        <G testID={`tube-filter-${tube}`}>
          <Path
            d="M-14 16 0 35 14 16Z"
            fill={palette[filter.color]}
            stroke={ivory}
            strokeWidth="1.2"
          />
          <Path
            d="M0 15Q-15 17-14 5Q-3 3 0 15ZM0 15Q15 17 14 5Q3 3 0 15ZM0 15Q-8 4 0-2Q8 4 0 15Z"
            fill={palette[filter.color]}
            stroke="#f3e7be"
            strokeWidth="1.1"
          />
          <Circle cy="15" r="3.5" fill="#f3da8d" stroke={brass} strokeWidth=".7" />
          <Path d="M-9 20 0 31 9 20" fill="none" stroke="#fff4d0" strokeWidth=".9" />
        </G>
      )}
      {crystals.map((c, i) => (
        <G
          key={i}
          testID={`tube-crystal-${tube}`}
          opacity={crystalOpen(board, c.color, rules) ? 0.35 : 1}
        >
          {!crystalOpen(board, c.color, rules) && (
            <G
              testID={`tube-frozen-layer-${tube}`}
              transform={`translate(0 ${151 - ((c.depth + 0.5) * 116) / capacity(rules, tube)})`}
            >
              <Path
                d="M-22-8-10-12-4-7 4-12 12-8 22-10V9L11 13 4 8-4 12-12 8-22 11Z"
                fill="#e5edf0"
                fillOpacity=".32"
                stroke="#e6f1e9"
                strokeWidth=".9"
              />
              <Path
                d="M-17-10-12 0-18 9M17-10 12 0 18 9M-12 0-5-3M12 0 5 3M-1-7 2-2-1 3-4-2Z"
                fill="none"
                stroke="#fcf7e3"
                strokeWidth="1.3"
              />
            </G>
          )}
          <Path
            d="M-19 116-14 122-20 127M19 116 14 122 20 127M-15 142-8 138M15 142 8 138"
            stroke="#ecf4e9"
            strokeWidth="1.5"
            fill="none"
          />
          {emblem(
            'crystal',
            capacity(rules, tube) < 4 ? 116 : 133,
            palette[c.color],
            !crystalOpen(board, c.color, rules),
          )}
        </G>
      ))}
      {linked && (
        <G testID={`tube-coupling-${tube}`}>
          <Path
            d="M-23 139Q0 147 23 139L22 150Q0 160-22 150Z"
            fill={focused ? '#83975d' : '#5d7d54'}
            stroke="#af965a"
            strokeWidth="1.3"
          />
          <Path
            d="M-21 142Q0 150 21 142M-16 148Q-14 138-5 145M16 148Q14 138 5 145M-5 150C-10 143 1 143 0 148C-1 153 10 153 5 146"
            fill="none"
            stroke={ivory}
            strokeWidth="1"
          />
        </G>
      )}
      {capacity(rules, tube) !== 4 && (
        <G testID={`tube-capacity-${tube}`} transform={`translate(0 ${linked ? -23 : 0})`}>
          <Ellipse cy="146" rx="11" ry="9" fill="#f3e7bd" stroke="#9c804a" strokeWidth="1.2" />
          <SvgText y="151" textAnchor="middle" fontFamily={F.bold} fontSize="15" fill="#355741">
            {capacity(rules, tube)}
          </SvgText>
        </G>
      )}
    </G>
  );
});
