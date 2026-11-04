import { Paper } from '../src/components/Paper';
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Modal, Animated, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../src/state/store';
import { loadLevel, move, undo, restoration } from '../src/state/model';
import { won, solve, pour, Move } from '../src/engine/puzzle';
import levels from '../src/data/levels.json';
import { species, chapters } from '../src/data/botany';
import { LiquidBoard } from '../src/components/LiquidBoard';
import { Botanical } from '../src/components/Botanical';
import { T, Label, Icon, Button, Progress, C, ui } from '../src/components/ui';
import { feedback } from '../src/services/feedback';
export default function Atelier() {
  const { save, setSave } = useGame(),
    { width } = useWindowDimensions(),
    wide = width > 1100;
  const [replay, setReplay] = useState(!!save.completed[save.current]);
  const [selected, setSelected] = useState<number | null>(null),
    [message, setMessage] = useState(''),
    [hint, setHint] = useState<Move | null>(null),
    [busy, setBusy] = useState(false),
    [pouring, setPouring] = useState<Move | null>(null),
    [reveal, setReveal] = useState(false),
    [dismissed, setDismissed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current,
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plant = Math.floor((save.current - 1) / 5),
    s = species[plant],
    chapter = Math.floor((save.current - 1) / 20),
    stage = restoration(save, plant),
    victory = won(save.board);
  useEffect(() => {
    setReplay(!!save.completed[save.current]);
    setSelected(null);
    setHint(null);
    setMessage('');
    setReveal(false);
    setDismissed(false);
  }, [save.current]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const tap = (index: number) => {
    if (busy || victory) return;
    setHint(null);
    setMessage('');
    if (selected === null) {
      if (save.board[index].length) setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    if (!pour(save.board, selected, index)) {
      setMessage('Versez sur une couleur identique ou dans un flacon vide.');
      setSelected(save.board[index].length ? index : null);
      return;
    }
    const from = selected;
    if (!save.settings.motion) {
      feedback(save.settings);
      setSave((v) => move(v, from, index));
      setSelected(null);
      return;
    }
    setPouring({ from, to: index });
    setBusy(true);
    feedback(save.settings);
  };
  const finishPour = () => {
    if (!pouring) return;
    setSave((v) => move(v, pouring.from, pouring.to));
    setSelected(null);
    setPouring(null);
    setBusy(false);
  };
  const askHint = () => {
    if (busy || victory) return;
    setMessage('Recherche d’un chemin de restauration…');
    setBusy(true);
    timer.current = setTimeout(() => {
      const initial = JSON.stringify(save.board) === JSON.stringify(levels[save.current - 1].board);
      const path = initial ? levels[save.current - 1].solution : solve(save.board);
      if (path?.length) {
        setHint(path[0]);
        setMessage(`Versez le flacon ${path[0].from + 1} dans le flacon ${path[0].to + 1}.`);
      } else
        setMessage(
          'Aucun chemin trouvé dans la limite de recherche. Annulez vos derniers mouvements ou recommencez gratuitement.',
        );
      setBusy(false);
    }, 60);
  };
  const restorePigment = () => {
    setReveal(true);
    feedback(save.settings, true);
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: save.settings.motion ? 1400 : 0,
      useNativeDriver: true,
    }).start();
  };
  const next = () => {
    setDismissed(true);
    if (save.current < 100) setSave((v) => loadLevel(v, v.current + 1));
    else router.push('/herbier');
  };
  return (
    <ScrollView contentContainerStyle={[ui.page, width < 800 && { padding: 20 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>LE CARNET DE RESTAURATION</Label>
        <T style={{ fontSize: 11, color: C.muted }}>
          NIVEAU {String(save.current).padStart(2, '0')} / 100
        </T>
      </View>
      <T serif style={[ui.title, width < 800 && { fontSize: 34, lineHeight: 38 }]}>
        {width < 800 ? 'L’Atelier' : <>Un peu de couleur,{`\n`}beaucoup de vie.</>}
      </T>
      <T style={{ color: C.muted, marginBottom: width < 800 ? 18 : 28, fontSize: 13 }}>
        Triez les pigments. Révélez la beauté du vivant.
      </T>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 23, alignItems: 'stretch' }}>
        <Paper
          style={[
            ui.card,
            {
              flex: wide ? 1.35 : undefined,
              padding: wide ? 30 : 20,
              minHeight: width < 800 ? 430 : 500,
              backgroundColor:
                save.theme === 'sauge' ? '#ecf0e4' : save.theme === 'rose' ? '#f5eae3' : C.card,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Label>
                CHAPITRE {chapter + 1} · {chapters[chapter].name.toLocaleUpperCase('fr')}
              </Label>
              <T serif style={{ fontSize: width < 800 ? 26 : 30, lineHeight: 36, marginTop: 9 }}>
                L’atelier des pigments
              </T>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icon name="water-outline" color={C.gold} />
              <T style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{save.moves} mouvements</T>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: C.line, marginTop: 22 }} />
          {save.current === 1 && width >= 800 && (
            <T style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 18 }}>
              Touchez un flacon, puis un autre pour verser.
            </T>
          )}
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingVertical: 8,
              minHeight: width < 800 ? 250 : 290,
            }}
          >
            <LiquidBoard
              board={save.board}
              selected={selected}
              hint={hint}
              pouring={pouring}
              disabled={busy || victory}
              motion={save.settings.motion}
              patterns={save.settings.patterns}
              onTap={tap}
              onFinish={finishPour}
            />
          </View>
          <T
            accessibilityLiveRegion="polite"
            style={{
              minHeight: 38,
              textAlign: 'center',
              fontSize: 12,
              color: C.muted,
              marginBottom: 12,
            }}
          >
            {message ||
              (save.current === 1
                ? 'Touchez un flacon, puis un autre pour verser.'
                : 'Une couleur par flacon, un pigment pour l’herbier.')}
          </T>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              borderTopWidth: 1,
              borderColor: C.line,
              paddingTop: 20,
            }}
          >
            {[
              {
                name: 'Annuler',
                icon: 'arrow-undo-outline',
                action: () => {
                  setSave(undo);
                  setSelected(null);
                  setHint(null);
                },
                disabled: !save.history.length || victory,
              },
              {
                name: 'Recommencer',
                icon: 'refresh-outline',
                action: () => {
                  setSave((v) => loadLevel(v, v.current));
                  setSelected(null);
                  setHint(null);
                  setDismissed(false);
                },
                disabled: false,
              },
              { name: 'Indice', icon: 'bulb-outline', action: askHint, disabled: victory },
            ].map((a) => (
              <Pressable
                key={a.name}
                accessibilityLabel={a.name}
                accessibilityRole="button"
                onPress={a.action}
                disabled={busy || a.disabled}
                style={{
                  alignItems: 'center',
                  gap: 7,
                  flex: 1,
                  padding: 10,
                  opacity: a.disabled ? 0.35 : 1,
                }}
              >
                <Icon name={a.icon as 'bulb-outline'} color={C.green} />
                <T style={{ fontSize: 11 }}>{a.name}</T>
              </Pressable>
            ))}
          </View>
        </Paper>
        <Paper
          style={[
            ui.card,
            { flex: wide ? 1 : undefined, alignItems: 'center', padding: 21, overflow: 'hidden' },
          ]}
        >
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Label>PLANCHE {String(plant + 1).padStart(2, '0')}</Label>
            <Icon name="leaf-outline" size={17} color={C.gold} />
          </View>
          <Botanical index={plant} stage={stage} size={wide ? 260 : 280} />
          <T serif style={{ fontSize: 31, lineHeight: 34, marginTop: 5 }}>
            {s.name}
          </T>
          <T style={{ fontFamily: 'CormorantItalic', fontSize: 19, color: C.muted, marginTop: 4 }}>
            {s.latin}
          </T>
          <View style={{ width: '100%', marginTop: 23 }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}
            >
              <T style={{ fontSize: 11, color: C.muted }}>Restauration de la planche</T>
              <T style={{ fontSize: 11, color: C.green }}>{stage} / 5 pigments</T>
            </View>
            <Progress value={stage / 5} />
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/herbier', params: { plant: String(plant) } })}
            style={{ paddingTop: 18, paddingBottom: 4 }}
          >
            <T style={{ fontSize: 11, color: C.green }}>Observer la planche ↗</T>
          </Pressable>
        </Paper>
      </View>
      <View style={{ alignItems: 'center', paddingTop: 24 }}>
        <T style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>
          PRENEZ VOTRE TEMPS. LA NATURE AUSSI.
        </T>
      </View>
      <Modal visible={!save.started} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: '#233e31b0',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <ScrollView style={{ maxHeight: '95%', maxWidth: 480, width: '100%' }}>
            <Paper style={[ui.card, { maxWidth: 480, width: '100%', alignItems: 'center' }]}>
              <Label>BIENVENUE DANS VOTRE HERBIER</Label>
              <Botanical index={0} stage={0} size={190} />
              <T serif style={{ fontSize: 36, lineHeight: 40, textAlign: 'center' }}>
                Les couleurs ont disparu.{`\n`}Faisons-les renaître.
              </T>
              <T style={{ color: C.muted, textAlign: 'center', marginVertical: 20 }}>
                Rassemblez les liquides de même couleur dans les flacons. Chaque énigme redonne vie
                à une planche botanique.
              </T>
              <Button onPress={() => setSave((v) => ({ ...v, started: true }))}>
                Commencer la restauration
              </Button>
            </Paper>
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={victory && !dismissed && save.started}
        transparent
        animationType={save.settings.motion ? 'fade' : 'none'}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#233e31b0',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <ScrollView style={{ maxHeight: '95%', width: '100%', maxWidth: 460 }}>
            <Paper style={[ui.card, { alignItems: 'center' }]}>
              <Label>
                {save.current === 100
                  ? 'L’HERBIER RETROUVE SES COULEURS'
                  : replay
                    ? 'PIGMENT DÉJÀ RETROUVÉ'
                    : 'UN NOUVEAU PIGMENT'}
              </Label>
              <T serif style={{ fontSize: 32, marginTop: 13, lineHeight: 38 }}>
                {save.current === 100
                  ? 'Votre collection est complète.'
                  : s.organs[(save.current - 1) % 5]}
              </T>
              <T style={{ color: C.gold, fontSize: 24, marginTop: 8 }}>
                {'★'.repeat(save.completed[save.current]?.stars ?? 1)}
              </T>
              {!reveal ? (
                <>
                  <Botanical
                    index={plant}
                    stage={replay ? stage : Math.max(0, stage - 1)}
                    size={200}
                  />
                  <Button onPress={restorePigment}>✧ Révéler la couleur</Button>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      fade.setValue(1);
                      setReveal(true);
                    }}
                    style={{ padding: 16 }}
                  >
                    <T style={{ fontSize: 12, color: C.muted }}>Passer l’animation</T>
                  </Pressable>
                </>
              ) : (
                <>
                  <Animated.View style={{ opacity: fade }}>
                    <Botanical index={plant} stage={stage} size={215} />
                  </Animated.View>
                  <T style={{ textAlign: 'center', color: C.muted, marginBottom: 18 }}>
                    {stage === 5
                      ? 'Planche restaurée et scellée dans votre herbier.'
                      : 'Une nouvelle nuance a rejoint votre collection.'}
                    {`\n`}
                    {save.current === 100
                      ? '20 planches · 100 pigments · 5 écosystèmes'
                      : 'Le vivant reprend ses couleurs.'}
                  </T>
                  <Button onPress={next}>
                    {save.current === 100
                      ? 'Contempler mon herbier'
                      : 'Poursuivre la restauration →'}
                  </Button>
                  <Button
                    secondary
                    onPress={() => {
                      setDismissed(true);
                      router.push('/herbier');
                    }}
                    style={{ marginTop: 10 }}
                  >
                    Ouvrir l’herbier
                  </Button>
                </>
              )}
            </Paper>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
