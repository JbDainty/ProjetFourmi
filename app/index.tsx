import { F } from '../src/components/fonts';
import { Paper } from '../src/components/Paper';
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Modal, Animated, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../src/state/store';
import { loadLevel, move, undo, restoration } from '../src/state/model';
import { won, solve, pour, Move } from '../src/engine/puzzle';
import levels from '../src/data/levels.json';
import { species, chapters } from '../src/data/botany';
import { botanicalFact } from '../src/data/botanicalFacts';
import { LiquidBoard } from '../src/components/LiquidBoard';
import { Botanical } from '../src/components/Botanical';
import { BotanicalStamp } from '../src/components/BotanicalStamp';
import { PageFolio } from '../src/components/PageFolio';
import { HintScroll } from '../src/components/HintScroll';
import { T, Label, Icon, Button, Progress, C, ui } from '../src/components/ui';
import { feedback } from '../src/services/feedback';
type Note = { text: string; kind: 'info' | 'hint'; request: number; pending: boolean };
export default function Atelier() {
  const { save, setSave } = useGame(),
    { width } = useWindowDimensions(),
    wide = width > 1100;
  const [replay, setReplay] = useState(!!save.completed[save.current]);
  const [selected, setSelected] = useState<number | null>(null),
    [note, setNote] = useState<Note>({ text: '', kind: 'info', request: 0, pending: false }),
    [hint, setHint] = useState<Move | null>(null),
    [busy, setBusy] = useState(false),
    [pouring, setPouring] = useState<Move | null>(null),
    [reveal, setReveal] = useState(false),
    [dismissed, setDismissed] = useState(false),
    [plateOpen, setPlateOpen] = useState(false);
  const fade = useRef(new Animated.Value(0)).current,
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plant = Math.floor((save.current - 1) / 5),
    s = species[plant],
    chapter = Math.floor((save.current - 1) / 20),
    stage = restoration(save, plant),
    victory = won(save.board);
  const clearNote = () =>
    setNote((previous) => ({ ...previous, text: '', kind: 'info', pending: false }));
  useEffect(() => {
    setReplay(!!save.completed[save.current]);
    setSelected(null);
    setHint(null);
    clearNote();
    setReveal(false);
    setDismissed(false);
    setPlateOpen(false);
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
    clearNote();
    if (selected === null) {
      if (save.board[index].length) setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    if (!pour(save.board, selected, index)) {
      setNote((previous) => ({
        ...previous,
        text: 'Versez sur une couleur identique ou dans un flacon vide.',
        kind: 'info',
        pending: false,
      }));
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
    setHint(null);
    setNote((previous) => ({
      text: '',
      kind: 'hint',
      request: previous.request + 1,
      pending: true,
    }));
    setBusy(true);
    timer.current = setTimeout(() => {
      const initial = JSON.stringify(save.board) === JSON.stringify(levels[save.current - 1].board);
      const path = initial ? levels[save.current - 1].solution : solve(save.board);
      if (path?.length) setHint(path[0]);
      const explanation = path?.length
        ? `Versez le flacon ${path[0].from + 1} dans le flacon ${path[0].to + 1}.`
        : 'Aucun chemin trouvé dans la limite de recherche. Annulez vos derniers mouvements ou recommencez gratuitement.';
      setNote((previous) => ({ ...previous, text: explanation, kind: 'hint', pending: false }));
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
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
        maxWidth: 1180,
        alignSelf: 'center',
        paddingHorizontal: width < 800 ? 18 : 32,
        paddingTop: 100,
        paddingBottom: 20,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: wide ? 'row' : 'column',
          gap: 28,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        <View testID="integrated-game-scene" style={{ flex: wide ? 1.35 : 1 }}>
          <PageFolio page={save.current} />
          {!wide ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8 }}
            >
              <BotanicalStamp
                index={plant}
                stage={stage}
                disabled={busy}
                onPress={() => setPlateOpen(true)}
              />
              <View style={{ flex: 1 }}>
                <Label>CHAPITRE {String(chapter + 1).padStart(2, '0')}</Label>
                <T style={{ fontSize: 12, lineHeight: 17, color: C.muted }}>
                  {chapters[chapter].name}
                </T>
                <T serif style={{ fontSize: width < 360 ? 23 : 26, lineHeight: 30, marginTop: 4 }}>
                  {s.name}
                </T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <Icon name="leaf-outline" size={15} color={C.green} />
                  <T style={{ fontSize: 11, lineHeight: 17, color: C.green }}>
                    {stage} / 5 pigments restaurés
                  </T>
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Label>
                    CHAPITRE {chapter + 1} · {chapters[chapter].name.toLocaleUpperCase('fr')}
                  </Label>
                  <T
                    serif
                    style={{ fontSize: width < 800 ? 26 : 30, lineHeight: 36, marginTop: 9 }}
                  >
                    La serre des pigments
                  </T>
                </View>
              </View>
            </>
          )}
          {!wide && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
                gap: 12,
              }}
            >
              <T style={{ flex: 1, fontSize: 10, lineHeight: 14, color: C.muted }}>
                Touchez le timbre pour observer la planche
              </T>
            </View>
          )}

          {save.current === 1 && width >= 800 && (
            <T style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 18 }}>
              Touchez un flacon, puis un autre pour verser.
            </T>
          )}
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              paddingVertical: 2,
              minHeight: width < 800 ? 250 : 290,
            }}
          >
            {note.kind === 'info' && !!note.text && (
              <T
                accessibilityLiveRegion="polite"
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 8,
                  right: 8,
                  textAlign: 'center',
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                {note.text}
              </T>
            )}
            <LiquidBoard
              integrated
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
          <View
            testID="hint-scroll-slot"
            style={{ minHeight: 64, justifyContent: 'center', marginBottom: 8 }}
          >
            {note.kind === 'hint' && (
              <HintScroll
                text={note.text}
                pending={note.pending}
                motion={save.settings.motion}
                request={note.request}
              />
            )}
          </View>
          <Paper
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 30,
              backgroundColor: '#f4ead6ee',
              width: '100%',
              maxWidth: 420,
              alignSelf: 'center',
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
                  clearNote();
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
                  clearNote();
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
                  paddingVertical: 10,
                  paddingHorizontal: 2,
                  opacity: a.disabled ? 0.35 : 1,
                }}
              >
                <Icon size={25} name={a.icon as 'bulb-outline'} color={C.green} />
                <T
                  style={{
                    fontFamily: F.handwritingMedium,
                    fontSize: Math.min(22, width / 18.5),
                    lineHeight: 27,
                    color: C.green,
                  }}
                >
                  {a.name}
                </T>
              </Pressable>
            ))}
          </Paper>
        </View>
        {wide && (
          <Paper
            testID="atelier-full-plate"
            vitality={stage / 5}
            style={[
              ui.card,
              {
                flex: wide ? 1 : undefined,
                alignSelf: 'flex-start',
                alignItems: 'center',
                padding: 21,
                overflow: 'hidden',
              },
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
            <T style={{ fontFamily: F.scientific, fontSize: 19, color: C.muted, marginTop: 4 }}>
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
              onPress={() =>
                router.push({ pathname: '/herbier', params: { plant: String(plant) } })
              }
              style={{ paddingTop: 18, paddingBottom: 4 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="eye-outline" size={18} color={C.green} />
                <T style={{ fontSize: 11, color: C.green }}>Observer la planche</T>
              </View>
            </Pressable>
          </Paper>
        )}
      </View>
      <Modal
        visible={plateOpen && save.started}
        transparent
        animationType={save.settings.motion ? 'fade' : 'none'}
        onRequestClose={() => setPlateOpen(false)}
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
          <ScrollView style={{ width: '100%', maxWidth: 620, maxHeight: '94%' }}>
            <Paper
              testID="current-plate-dialog"
              vitality={stage / 5}
              style={[ui.card, { alignItems: 'center' }]}
            >
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Label>
                  PLANCHE {String(plant + 1).padStart(2, '0')} · {s.family}
                </Label>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fermer la planche"
                  onPress={() => setPlateOpen(false)}
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="close-outline" size={24} />
                </Pressable>
              </View>
              <Botanical index={plant} stage={stage} size={Math.min(width - 100, 370)} />
              <T serif style={{ fontSize: 33, lineHeight: 39, textAlign: 'center', marginTop: 8 }}>
                {s.name}
              </T>
              <T
                style={{
                  fontFamily: F.scientific,
                  fontSize: 21,
                  color: C.muted,
                  textAlign: 'center',
                }}
              >
                {s.latin}
              </T>
              <View style={{ width: '100%', marginVertical: 22 }}>
                <T style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 9 }}>
                  {stage} / 5 pigments restaurés
                </T>
                <Progress value={stage / 5} />
              </View>
              <Button icon="flask-outline" onPress={() => setPlateOpen(false)}>
                Revenir au jeu
              </Button>
            </Paper>
          </ScrollView>
        </View>
      </Modal>
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
                Remplissez chaque flacon avec une seule couleur. Les autres flacons doivent être
                vides. Touchez un flacon, puis un autre pour verser. Chaque énigme redonne vie à une
                planche botanique.
              </T>
              <Button icon="leaf-outline" onPress={() => setSave((v) => ({ ...v, started: true }))}>
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
                    ? 'UNE PAGE À NOUVEAU COLORÉE'
                    : 'VOTRE HERBIER REPREND VIE'}
              </Label>
              <T serif style={{ fontSize: 32, marginTop: 13, lineHeight: 38 }}>
                {save.current === 100
                  ? 'Votre collection est complète.'
                  : s.organs[(save.current - 1) % 5]}
              </T>
              <T style={{ color: C.gold, fontSize: 24, marginTop: 8 }}>
                {'★'.repeat(save.completed[save.current]?.stars ?? 1)}
              </T>
              <T
                testID="page-result-moves"
                style={{
                  fontFamily: F.handwriting,
                  fontSize: 23,
                  lineHeight: 29,
                  color: C.muted,
                  marginTop: 4,
                }}
              >
                Page achevée en {save.moves} {save.moves === 1 ? 'mouvement' : 'mouvements'}.
              </T>
              {!reveal ? (
                <>
                  <Botanical
                    index={plant}
                    stage={replay ? stage : Math.max(0, stage - 1)}
                    size={200}
                  />
                  <Button icon="water-outline" onPress={restorePigment}>
                    Révéler la couleur
                  </Button>
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
                  <T
                    testID="restoration-botanical-fact"
                    style={{ textAlign: 'center', color: C.muted, marginBottom: 18 }}
                  >
                    {botanicalFact(save.current, 'reveal')}
                  </T>
                  <Button icon="arrow-forward-outline" onPress={next}>
                    {save.current === 100 ? 'Contempler mon herbier' : 'Poursuivre la restauration'}
                  </Button>
                  <Button
                    icon="book-outline"
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
