import { mechanicIds, mechanicDetails } from '../engine/mechanics';
import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { CAPACITY, clone, pour, won, type Board } from '../engine/puzzle';
import { Botanical } from './Botanical';
import { SealMark } from './BotanicalSeal';
import { CarnetIllustration } from './CarnetIllustration';
import { Paper, PaperTexture } from './Paper';
import { F } from './fonts';
import { C, Icon, T } from './ui';
import { VictoryAction } from './VictoryAction';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

const trial: Board = [[0, 0, 1, 1], [1, 1, 0, 0], []];
const trialColors = ['#ae617b', '#548e83'];

function Sprig({ small = false }: { small?: boolean }) {
  return (
    <Svg width={small ? 110 : 208} height={25} viewBox="0 0 208 25" accessible={false}>
      <G fill="none" stroke="#a58b55" strokeWidth="0.8" strokeLinecap="round">
        <Path d="M8 15 Q45 21 91 12 M200 15 Q163 21 117 12 M50 17 Q37 13 42 5 Q55 7 50 17 M158 17 Q171 13 166 5 Q153 7 158 17" />
        {[0, 72, 144, 216, 288].map((a) => (
          <Ellipse
            key={a}
            transform={`translate(104 12) rotate(${a})`}
            cy={-4}
            rx={2.5}
            ry={4.5}
            fill="#b7c19a"
            fillOpacity={0.4}
          />
        ))}
        <Circle cx={104} cy={12} r={2} fill="#c4a45c" />
      </G>
    </Svg>
  );
}

function GuideVial({
  tube,
  index,
  selected,
  motion,
  onPress,
}: {
  tube: number[];
  index: number;
  selected: boolean;
  motion: boolean;
  onPress: () => void;
}) {
  const id = 'guide-vial-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = Animated.timing(lift, {
      toValue: selected ? 1 : 0,
      duration: motion ? 180 : 0,
      useNativeDriver: Platform.OS !== 'web',
    });
    run.start();
    return () => run.stop();
  }, [selected, motion, lift]);
  const complete = tube.length === CAPACITY && tube.every((color) => color === tube[0]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fiole d’essai ${index + 1}, ${tube.length === 0 ? 'vide' : complete ? 'complète' : `${tube.length} mesures`}${tube.length ? `, couleur du dessus : ${tube.at(-1) === 0 ? 'rose ancien' : 'vert d’eau'}` : ''}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        maxWidth: 96,
        minHeight: 196,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <Animated.View
        style={{
          width: '100%',
          height: 177,
          transform: [
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) },
          ],
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 86 180" accessible={false}>
          <Defs>
            <ClipPath id={`${id}-inside`}>
              <Path d="M21 21V147 Q21 170 43 170 Q65 170 65 147V21Z" />
            </ClipPath>
            <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
              <Stop stopColor="#fffce8" stopOpacity={0.85} />
              <Stop offset="0.25" stopColor="#b1c4b0" stopOpacity={0.12} />
              <Stop offset="0.8" stopColor="#fffbe4" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#799b85" stopOpacity={0.4} />
            </LinearGradient>
          </Defs>
          <Ellipse cx={43} cy={172} rx={28} ry={4} fill="#8b7954" opacity={0.12} />
          <G clipPath={`url(#${id}-inside)`}>
            {tube.map((color, i) => (
              <Rect
                key={i}
                x={19}
                y={142 - i * 30}
                width={48}
                height={31}
                fill={trialColors[color]}
                opacity={0.88}
              />
            ))}
            {tube.length > 0 && (
              <Ellipse
                cx={43}
                cy={172 - tube.length * 30}
                rx={23}
                ry={3}
                fill="#f7e8b5"
                opacity={0.45}
              />
            )}
          </G>
          <Path
            d="M18 18V148 Q18 174 43 174 Q68 174 68 148V18"
            fill={`url(#${id}-glass)`}
            stroke={selected ? '#9b7438' : '#78907a'}
            strokeWidth={selected ? 1.8 : 1}
          />
          <Path
            d="M24 31V145 Q24 159 32 163 M61 28V139"
            fill="none"
            stroke="#fffbe5"
            strokeWidth={2}
            opacity={0.7}
            strokeLinecap="round"
          />
          <Ellipse
            cx={43}
            cy={18}
            rx={25}
            ry={5}
            fill="#f7efdb"
            fillOpacity={0.55}
            stroke="#78907a"
            strokeWidth={0.9}
          />
          {[0, 1, 2, 3].map((n) => (
            <Path
              key={n}
              d={`M68 ${142 - n * 30}h-6`}
              stroke="#83927a"
              strokeWidth={0.7}
              opacity={0.65}
            />
          ))}
          {complete && (
            <G transform="translate(69 9)" fill="none" stroke="#6d8157" strokeWidth={1.1}>
              <Circle r={9} fill="#eee7c6" />
              <Path d="M-4 0 0 4 5-4 M0 4Q-2-4 2-6" />
            </G>
          )}
        </Svg>
      </Animated.View>
      <T
        style={{
          fontFamily: F.scientific,
          fontSize: 15,
          lineHeight: 21,
          color: selected ? '#926c36' : C.muted,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </T>
    </Pressable>
  );
}

/** A separate, real puzzle: practice never touches the player's save or audio mixer. */
function FirstPour({ motion }: { motion: boolean }) {
  const [board, setBoard] = useState(() => clone(trial));
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState(
    'Touchez la fiole 1, puis la fiole 3 pour y verser sa couleur du dessus.',
  );
  const done = won(board);
  const tap = (index: number) => {
    if (done) return;
    if (selected === index) {
      setSelected(null);
      return;
    }
    if (selected === null) {
      if (!board[index].length) {
        setNote('Choisissez d’abord une fiole qui contient du liquide.');
        return;
      }
      setSelected(index);
      setNote(`Fiole ${index + 1} choisie. Touchez une fiole vide ou la même couleur en surface.`);
      return;
    }
    const next = pour(board, selected, index);
    setSelected(null);
    if (!next) {
      setNote('Essayez une fiole vide, ou la même teinte en surface avec de la place.');
      return;
    }
    setBoard(next);
    setNote(
      won(next)
        ? 'Vous avez le geste ! Les deux couleurs sont réunies dans des fioles complètes.'
        : 'Très bien ! Continuez : réunissez les quatre mesures de chaque couleur.',
    );
  };
  return (
    <View testID="guide-practice" style={{ alignItems: 'center', marginTop: 10 }}>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 5,
          paddingTop: 10,
        }}
      >
        {board.map((tube, i) => (
          <GuideVial
            key={i}
            tube={tube}
            index={i}
            selected={selected === i}
            motion={motion}
            onPress={() => tap(i)}
          />
        ))}
      </View>
      <View
        style={{
          width: '90%',
          height: 4,
          borderRadius: 3,
          backgroundColor: '#b49a68',
          opacity: 0.5,
          marginTop: 3,
        }}
      />
      <T
        testID="guide-practice-note"
        accessibilityLiveRegion="polite"
        style={[
          s.handwriting,
          {
            marginTop: 13,
            minHeight: 116,
            width: '100%',
            textAlign: 'center',
            color: done ? C.green : '#766344',
          },
        ]}
      >
        {note}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recommencer l’essai"
        onPress={() => {
          setBoard(clone(trial));
          setSelected(null);
          setNote('Touchez la fiole 1, puis la fiole 3 pour y verser sa couleur du dessus.');
        }}
        style={({ pressed }) => ({
          minHeight: 44,
          flexDirection: 'row',
          gap: 7,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Icon name="refresh-outline" size={20} color={C.green} />
        <T style={s.aside}>Recommencer l’essai</T>
      </Pressable>
      <T style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
        Un essai libre, sans graine dépensée.
      </T>
    </View>
  );
}

function Chapter({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ width: '100%', marginTop: 27 }}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Sprig small />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 9 }}>
        <T style={{ fontFamily: F.display, fontSize: 34, lineHeight: 42, color: '#a38a53' }}>
          {number}
        </T>
        <T
          accessibilityRole="header"
          style={{ fontFamily: F.display, fontSize: 27, lineHeight: 32, flex: 1, color: C.green }}
        >
          {title}
        </T>
      </View>
      {children}
    </View>
  );
}

export function BotanicalGuide({
  nickname,
  motion,
  firstRun = false,
  onEnter,
  onClose,
}: {
  nickname: string;
  motion: boolean;
  firstRun?: boolean;
  onEnter: () => void;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const narrow = width < 380;
  const { value, settled } = useNativeProgress(900, motion);
  usePrimaryAnimation(!settled);
  const scroll = useRef<ScrollView>(null);
  return (
    <View testID="botanical-guide" style={{ flex: 1, backgroundColor: C.paper }}>
      <PaperTexture background />
      <ScrollView
        ref={scroll}
        testID="guide-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: width < 360 ? 10 : 18,
          paddingBottom: 28,
          alignItems: 'center',
        }}
      >
        <Paper
          vitality={1}
          style={{
            width: '100%',
            maxWidth: 700,
            backgroundColor: '#f3e7cc',
            borderRadius: 30,
            paddingHorizontal: narrow ? 21 : 30,
            paddingTop: 24,
            paddingBottom: 30,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <T style={{ fontSize: 10, letterSpacing: 2.1, color: '#7d6a45', flex: 1 }}>
              PRÉFACE · LE PREMIER FEUILLET
            </T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={firstRun ? 'Aller directement au jeu' : 'Fermer l’aide'}
              onPress={onClose}
              style={({ pressed }) => ({
                minWidth: 44,
                minHeight: 44,
                flexDirection: 'row',
                gap: 3,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              {firstRun && (
                <T style={{ fontFamily: F.scientific, fontSize: 14, color: C.green }}>Jouer</T>
              )}
              <Icon
                name={firstRun ? 'arrow-forward-outline' : 'close-outline'}
                size={28}
                color={C.green}
              />
            </Pressable>
          </View>
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: value,
              transform: [
                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
              ],
            }}
          >
            <T style={[s.aside, { textAlign: 'center', color: '#8d7446', marginTop: 3 }]}>
              {nickname
                ? `Bienvenue dans votre carnet, ${nickname}.`
                : 'Bienvenue dans votre carnet.'}
            </T>
            <T
              accessibilityRole="header"
              style={{
                fontFamily: F.displayBold,
                fontSize: narrow ? 34 : 41,
                lineHeight: narrow ? 39 : 46,
                textAlign: 'center',
                color: '#2e5140',
                marginTop: 10,
              }}
            >
              Rendez vie{String.fromCharCode(10)}à votre herbier
            </T>
            <View
              pointerEvents="none"
              accessible={false}
              style={{
                height: narrow ? 151 : 180,
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 0,
                marginTop: 9,
              }}
            >
              {[0, 2, 4].map((stage, i) => (
                <View
                  key={stage}
                  style={{
                    opacity: i === 0 ? 0.65 : 1,
                    transform: [{ rotate: `${(i - 1) * 8}deg` }],
                    marginHorizontal: narrow ? -2 : 1,
                  }}
                >
                  <Botanical
                    index={0}
                    stage={stage}
                    size={narrow ? 79 + i * 8 : 89 + i * 10}
                    labels={false}
                  />
                </View>
              ))}
            </View>
            <T style={[s.handwriting, { color: '#917b4c', textAlign: 'center', marginTop: 3 }]}>
              De l’encre oubliée aux fleurs retrouvées…
            </T>
            <Sprig />
          </Animated.View>
          <T style={[s.prose, { textAlign: 'center', marginTop: 15 }]}>
            Ce vieil herbier a perdu ses couleurs. Dans la serre, rassemblez les teintes pour
            réveiller ses planches, une page après l’autre.
          </T>
          <T style={[s.aside, { textAlign: 'center', marginTop: 9 }]}>
            Aucun chronomètre. Juste vous, les fioles et le murmure du jardin.
          </T>

          <Chapter number="I" title="Le premier geste">
            <T style={s.prose}>
              Touchez une fiole pour la soulever, puis une autre pour verser le liquide du dessus.
              Seule la teinte en surface se déplace, autant que la place le permet.
            </T>
            <FirstPour motion={motion} />
          </Chapter>

          <Chapter number="II" title="Des fioles pleines et unies">
            <T style={s.prose}>
              Versez dans une fiole vide, ou sur une couleur identique. Une fiole pleine ne peut
              plus recevoir de liquide.
            </T>
            <View
              style={{ flexDirection: 'row', gap: 13, marginTop: 17, alignItems: 'flex-start' }}
            >
              <CarnetIllustration name="atelier" size={narrow ? 56 : 70} />
              <View style={{ flex: 1 }}>
                <T style={[s.prose, { fontFamily: F.bold, color: C.green }]}>
                  Pour achever la page, chaque fiole occupée doit être pleine d’une seule teinte.
                  Les fioles habituelles contiennent quatre mesures ; les petites en contiennent
                  deux ou trois, selon le chiffre gravé.
                </T>
                <T style={[s.prose, { marginTop: 6 }]}>
                  Les autres fioles restent vides. Une même couleur peut remplir plusieurs petites
                  fioles : six mesures se répartissent par exemple en deux fioles de trois.
                </T>
                <T style={[s.prose, { marginTop: 6 }]}>
                  La coche indique une fiole pleine et unie, pas un verrou. Vous pouvez encore la
                  reverser pour faire de la place, sauf si un pinceau, un cristal ou la conservation
                  la retient.
                </T>
              </View>
            </View>
          </Chapter>

          <View style={{ alignItems: 'center', marginTop: 22 }}>
            <VictoryAction icon="flask-outline" onPress={onEnter}>
              {firstRun ? 'Entrer dans la serre' : 'Retourner dans la serre'}
            </VictoryAction>
            <T
              style={{
                fontFamily: F.scientific,
                fontSize: 13,
                lineHeight: 19,
                color: C.muted,
                marginTop: 8,
              }}
            >
              Ou poursuivez votre lecture ci-dessous.
            </T>
          </View>

          <Chapter number="III" title="Réveiller une planche">
            <T style={s.prose}>
              Chaque page résolue vous invite à révéler les couleurs de la plante. Quatre pages font
              renaître toute l’aquarelle. La cinquième vient l’achever d’un sceau de cire rouge.
            </T>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 20,
                gap: 3,
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <View key={n} style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      width: narrow ? 31 : 39,
                      height: narrow ? 31 : 39,
                      borderRadius: 30,
                      backgroundColor: ['#c6bfa5', '#afbd95', '#7ea280', '#4e795b'][n - 1],
                      borderWidth: 1,
                      borderColor: '#a38c5b',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="leaf-outline" size={19} color={n > 2 ? '#eee4bd' : '#50694d'} />
                  </View>
                  <T
                    style={{ fontFamily: F.scientific, fontSize: 12, lineHeight: 19, marginTop: 5 }}
                  >
                    {n}
                    {n === 1 ? 'er' : 'e'} lavis
                  </T>
                </View>
              ))}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Svg
                  width={narrow ? 39 : 47}
                  height={narrow ? 39 : 47}
                  viewBox="-42 -42 84 84"
                  accessible={false}
                >
                  <SealMark />
                </Svg>
                <T style={{ fontFamily: F.scientific, fontSize: 12, lineHeight: 19, marginTop: 5 }}>
                  Le sceau
                </T>
              </View>
            </View>
            <T style={[s.handwriting, { textAlign: 'center', marginTop: 15 }]}>
              Puis le livre vous confie une nouvelle espèce.
            </T>
            <T style={[s.prose, { marginTop: 7 }]}>
              Touchez le timbre de la plante pendant le jeu pour observer son évolution. Le Grand
              Herbier conserve toutes vos découvertes et leurs petits secrets botaniques.
            </T>
          </Chapter>

          <Chapter number="IV" title="Les trésors du jardin">
            {[
              {
                icon: 'sparkles-outline',
                title: 'Les étoiles récompensent vos gestes',
                text: 'Terminez avec peu de versements pour décrocher trois étoiles. Votre objectif apparaît à la fin de la page ; rejouez-la pour améliorer votre résultat.',
              },
              {
                icon: 'seed-outline',
                title: 'Une graine pour éclairer le chemin',
                text: 'Vous commencez avec une graine. Chaque réussite à trois étoiles en rapporte une nouvelle. Un nouvel indice coûte une graine, après confirmation. Vous pouvez cocher « Ne plus me prévenir » et réactiver cet avertissement dans les paramètres. Relire le même indice dans la même situation reste gratuit.',
              },
              {
                icon: 'arrow-undo-outline',
                title: 'Prenez le temps d’essayer',
                text: 'Annuler revient au geste précédent. Recommencer remet les fioles en place. Ces deux actions ne dépensent aucune graine : vous pouvez chercher à votre rythme.',
              },
              {
                icon: 'refresh-outline',
                title: 'Mélanger pour repartir autrement',
                text: 'Bloqué ? Mélanger utilise une graine pour proposer une nouvelle disposition résoluble pour la même page. Après confirmation, les mouvements repartent à zéro. Les étoiles et les pages déjà gagnées restent conservées. Le minimum et les objectifs des étoiles correspondent au nouveau mélange.',
              },
            ].map((item) => (
              <View
                key={item.title}
                style={{ flexDirection: 'row', gap: 13, marginTop: 15, alignItems: 'flex-start' }}
              >
                <View
                  style={{ width: 39, height: 43, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Icon
                    name={item.icon as React.ComponentProps<typeof Icon>['name']}
                    size={32}
                    color="#7e8256"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <T
                    style={{ fontFamily: F.display, fontSize: 22, lineHeight: 27, color: C.green }}
                  >
                    {item.title}
                  </T>
                  <T style={[s.prose, { marginTop: 5 }]}>{item.text}</T>
                </View>
              </View>
            ))}
          </Chapter>
          <Chapter number="V" title="Les secrets des fioles">
            {mechanicIds.map((id) => (
              <View key={id} style={{ marginTop: 16 }}>
                <T serif style={{ fontSize: 23 }}>
                  {mechanicDetails[id].name}
                </T>
                <T style={s.prose}>{mechanicDetails[id].intro}</T>
              </View>
            ))}
          </Chapter>

          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <T style={[s.aside, { textAlign: 'center', marginBottom: 15 }]}>
              Votre confort d’abord : musique, animations et symboles pour reconnaître les teintes
              se règlent dans Paramètres.
            </T>
            <CarnetIllustration name="herbier" size={84} />
            <T
              style={{
                fontFamily: F.display,
                fontSize: 29,
                lineHeight: 35,
                textAlign: 'center',
                color: C.green,
                marginTop: 5,
              }}
            >
              {firstRun ? 'Votre première fleur vous attend.' : 'Le jardin vous attend.'}
            </T>
            <T style={[s.aside, { textAlign: 'center', marginTop: 8, marginBottom: 17 }]}>
              Touchez « Menu », puis « Aide », pour retrouver ce feuillet quand vous le souhaitez.
            </T>
            <VictoryAction icon="leaf-outline" onPress={onEnter}>
              {firstRun ? 'Faire renaître mon herbier' : 'Retrouver mon atelier'}
            </VictoryAction>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Revenir au début de l’aide"
              onPress={() => scroll.current?.scrollTo({ y: 0, animated: motion })}
              style={({ pressed }) => ({
                minHeight: 48,
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name="book-outline" size={20} color={C.green} />
              <T style={s.aside}>Revenir au premier feuillet</T>
            </Pressable>
          </View>
        </Paper>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  prose: { fontFamily: F.body, fontSize: 17, lineHeight: 25, color: '#4d5945' },
  aside: { fontFamily: F.scientific, fontSize: 16, lineHeight: 23, color: '#7c704e' },
  handwriting: { fontFamily: F.handwriting, fontSize: 24, lineHeight: 29 },
});
