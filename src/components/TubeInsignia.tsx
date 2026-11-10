import React, { memo } from 'react';
import { G, Path, Ellipse, Circle, Text as SvgText } from 'react-native-svg';
import type { Board } from '../engine/puzzle';
import { blocked, crystalOpen, gateOpen, capacity } from '../engine/puzzle';
import type { Rules } from '../engine/mechanics';
import { palette, colorNames } from '../data/botany';
import { RuleMark } from './RuleMark';

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
}: {
  board: Board;
  rules?: Rules;
  tube: number;
  unitScale: number;
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
  const boost = Math.min(1.25, Math.max(1, 0.8 / unitScale));
  const emblem = (kind: string, y: number, tint = metal, active = true) => (
    <G key={kind} transform={`translate(0 ${y}) scale(${boost})`} opacity={active ? 1 : 0.45}>
      <Path d={plate} fill={ivory} stroke={tint} strokeWidth="1.25" />
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
          {emblem(locked ? 'lock' : 'unlock', 49, metal, !gateOpen(board, gate.key, rules))}
        </G>
      )}
      {isKey && <G testID={`tube-brush-${tube}`}>{emblem('brush', gate ? 101 : 49, metal)}</G>}
      {pipette && (
        <G testID={`tube-pipette-${tube}`}>
          <Path
            d="M-9 11V15Q0 20 9 15V11M0 29V37"
            fill="#c9b37c"
            stroke={brass}
            strokeWidth="1.2"
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
        </G>
      )}
      {filter && (
        <G testID={`tube-filter-${tube}`}>
          <Path
            d="M-12 21 0 35 12 21Z"
            fill={palette[filter.color]}
            stroke={ivory}
            strokeWidth="1.2"
          />
          <Circle cy="25" r="3" fill="#fff6d5" />
        </G>
      )}
      {crystals.map((c, i) => (
        <G
          key={i}
          testID={`tube-crystal-${tube}`}
          opacity={crystalOpen(board, c.color, rules) ? 0.35 : 1}
        >
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
            d="M-20 144Q0 151 20 144L19 151Q0 159-19 151Z"
            fill="#91a478"
            stroke="#576b47"
            strokeWidth="1"
          />
          <Path
            d="M-13 148Q-9 139-3 147Q3 139 9 149M-3 147 0 153"
            fill="none"
            stroke={ivory}
            strokeWidth="1"
          />
        </G>
      )}
      {capacity(rules, tube) !== 4 && (
        <G testID={`tube-capacity-${tube}`}>
          <Ellipse
            cy="146"
            rx="9"
            ry="7"
            fill="#eee6cb"
            fillOpacity=".9"
            stroke="#5c7866"
            strokeWidth=".8"
          />
          <SvgText y="150" textAnchor="middle" fontSize="13" fill="#355741">
            {capacity(rules, tube)}
          </SvgText>
        </G>
      )}
    </G>
  );
});
