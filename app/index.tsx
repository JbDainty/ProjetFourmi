import { F } from '../src/components/fonts';
import { Paper } from '../src/components/Paper';
import { VictoryPaper } from '../src/components/VictoryPaper';
import { StampPrompt } from '../src/components/StampPrompt';
import { VictoryAction } from '../src/components/VictoryAction';
import { PageTurnContext } from '../src/components/PageTurn';
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Modal, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../src/state/store';
import { loadLevel, move, undo, restoration, currentHint, purchaseHint } from '../src/state/model';
import { won, solve, pour, Move } from '../src/engine/puzzle';
import levels from '../src/data/levels.json';
import { species } from '../src/data/botany';
import { botanicalFact } from '../src/data/botanicalFacts';
import { LiquidBoard } from '../src/components/LiquidBoard';
import { Botanical } from '../src/components/Botanical';
import { ChapterVignette } from '../src/components/ChapterVignette';
import { SpellIcon } from '../src/components/SpellIcon';
import { PageFolio } from '../src/components/PageFolio';
import { HintScroll } from '../src/components/HintScroll';
import { HintSlot, emptySeedHint, missingPathHint } from '../src/components/HintSlot';
import { MistakeLeaves } from '../src/components/MistakeLeaves';
import { SceneSizeContext } from '../src/components/SceneSize';
import { BookScrollView, bookHeaderHeight } from '../src/components/BookScrollView';
import { T, Label, Icon, Button, C, ui } from '../src/components/ui';
import { feedback } from '../src/services/feedback';
import { pageStars, starLimits } from '../src/state/stars';
import { RewardStars } from '../src/components/RewardStars';
import { playPourSound } from '../src/services/pourSound';
import { playRevealMelody } from '../src/services/revealMelody';
import { playPlantMelody } from '../src/services/plantMelody';
import { completedByPour, type TubeReward } from '../src/animation/tubeReward';
import { playVialChime } from '../src/services/vialChime';
import { preparePageArtwork } from '../src/services/pageArtwork';
import { RestorationProgress } from '../src/components/RestorationProgress';
import { ColorReveal } from '../src/components/ColorReveal';
import { SealCeremony } from '../src/components/SealCeremony';
import { restorationTitles } from '../src/animation/restoration';
type Note = { text: string; kind: 'info' | 'hint'; request: number; pending: boolean };
const scenePadding = { top: 0, bottom: 20 };
export default function Atelier() {
  const reportSceneHeight = React.useContext(SceneSizeContext);
  const turnPage = React.useContext(PageTurnContext);
  const scroll = useRef<ScrollView>(null);
  const { save, setSave } = useGame(),
    { width, height, fontScale } = useWindowDimensions(),
    wide = width > 1100;
  const resultPlateSize = Math.max(
    112,
    Math.min(200, Math.round((height * 0.23) / Math.max(1, fontScale / 1.2))),
  );
  const [replay, setReplay] = useState(!!save.completed[save.current]);
  const [tubeReward, setTubeReward] = useState<TubeReward | null>(null);
  const [winReady, setWinReady] = useState(won(save.board));
  const hintPending = useRef(false);
  const rewardId = useRef(0),
    revealPlayed = useRef(false);
  const stopPour = useRef<() => void>(() => {}),
    stopReveal = useRef<() => void>(() => {}),
    stopChime = useRef<() => void>(() => {});
  const [selected, setSelected] = useState<number | null>(null),
    [note, setNote] = useState<Note>({ text: '', kind: 'info', request: 0, pending: false }),
    [hint, setHint] = useState<Move | null>(null),
    [busy, setBusy] = useState(false),
    [pouring, setPouring] = useState<Move | null>(null),
    [reveal, setReveal] = useState(false),
    [revealAnimated, setRevealAnimated] = useState(true),
    [sealFinished, setSealFinished] = useState(false),
    [dismissed, setDismissed] = useState(false),
    [plateOpen, setPlateOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plant = Math.floor((save.current - 1) / 5),
    s = species[plant],
    chapter = Math.floor((save.current - 1) / 20),
    stage = restoration(save, plant),
    sealPage = save.current % 5 === 0,
    victory = won(save.board);
  const sealActive = sealPage && reveal && !sealFinished && revealAnimated;
  const resultMotion = save.settings.motion && !(sealPage && reveal);
  const earnedStars = pageStars(save.moves, levels[save.current - 1].par);
  useEffect(() => {
    if (!victory) return;
    preparePageArtwork(plant, stage);
    const nextPlant = Math.floor(save.current / 5);
    if (save.current < 100 && nextPlant !== plant)
      preparePageArtwork(nextPlant, restoration(save, nextPlant));
  }, [victory, save.current, plant, stage]);
  const clearNote = () =>
    setNote((previous) => ({ ...previous, text: '', kind: 'info', pending: false }));
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    setReplay(!!save.completed[save.current]);
    setSelected(null);
    setHint(null);
    clearNote();
    setReveal(false);
    setSealFinished(false);
    setDismissed(false);
    setPlateOpen(false);
    setTubeReward(null);
    if (timer.current) clearTimeout(timer.current);
    hintPending.current = false;
    setBusy(false);
    setPouring(null);
    revealPlayed.current = false;
    stopPour.current();
    stopReveal.current();
    stopChime.current();
  }, [save.current]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stopPour.current();
      stopReveal.current();
      stopChime.current();
    },
    [],
  );
  useEffect(() => {
    if (!victory) {
      setWinReady(false);
      return;
    }
    if (!save.settings.motion || !tubeReward) {
      setWinReady(true);
      return;
    }
    setWinReady(false);
    const timer = setTimeout(() => setWinReady(true), 650);
    return () => clearTimeout(timer);
  }, [victory, save.current, save.settings.motion, tubeReward?.id]);
  useEffect(() => {
    if (dismissed || !victory) stopReveal.current();
  }, [dismissed, victory]);
  const commitPour = (from: number, to: number) => {
    const after = pour(save.board, from, to);
    if (after && completedByPour(save.board, after, to)) {
      setTubeReward({ id: ++rewardId.current, tube: to, color: after[to][0] });
      stopChime.current();
      stopChime.current = playVialChime(save.settings.sound);
    }
    setSave((value) => move(value, from, to));
  };
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
    const after = pour(save.board, selected, index);
    if (!after) {
      setNote((previous) => ({
        ...previous,
        text: 'Versez sur une couleur identique\nou dans un flacon vide.',
        kind: 'info',
        request: previous.request + 1,
        pending: false,
      }));
      setSelected(save.board[index].length ? index : null);
      return;
    }
    const from = selected;
    if (tubeReward?.tube === from) setTubeReward(null);
    stopPour.current();
    stopPour.current = playPourSound(save.settings, save.board[from].length - after[from].length);
    if (!save.settings.motion) {
      feedback(save.settings);
      commitPour(from, index);
      setSelected(null);
      return;
    }
    setPouring({ from, to: index });
    setBusy(true);
    feedback(save.settings);
  };
  const finishPour = () => {
    if (!pouring) return;
    commitPour(pouring.from, pouring.to);
    setSelected(null);
    setPouring(null);
    setBusy(false);
  };
  const askHint = () => {
    if (busy || victory || hintPending.current) return;
    const owned = currentHint(save);
    if (!owned && save.seeds < 1) {
      setNote((previous) => ({
        text: emptySeedHint,
        kind: 'hint',
        request: previous.request + 1,
        pending: false,
      }));
      return;
    }
    hintPending.current = true;
    setHint(null);
    setNote((previous) => ({
      text: '',
      kind: 'hint',
      request: previous.request + 1,
      pending: true,
    }));
    setBusy(true);
    const boardKey = JSON.stringify(save.board),
      page = save.current;
    timer.current = setTimeout(() => {
      const isInitial = boardKey === JSON.stringify(levels[page - 1].board);
      let suggestion = owned ?? (isInitial ? levels[page - 1].solution : solve(save.board))?.[0];
      if (suggestion) {
        const proposed = suggestion;
        let accepted = false;
        setSave((value) => {
          if (value.current !== page || JSON.stringify(value.board) !== boardKey) return value;
          const next = purchaseHint(value, proposed);
          accepted = !!currentHint(next);
          return next;
        });
        if (accepted) setHint(proposed);
        else suggestion = undefined;
      }
      setNote((previous) => ({
        ...previous,
        pending: false,
        text: suggestion
          ? `Versez le flacon ${suggestion.from + 1} dans le flacon ${suggestion.to + 1}.`
          : missingPathHint,
      }));
      hintPending.current = false;
      setBusy(false);
    }, 60);
  };
  const restorePigment = (animate = true) => {
    if (revealPlayed.current) return;
    revealPlayed.current = true;
    setRevealAnimated(save.settings.motion && animate);
    setSealFinished(!save.settings.motion || !animate);
    setReveal(true);
    feedback({ ...save.settings, sound: false }, true);
    stopReveal.current();
    stopReveal.current =
      stage === 5 && save.current % 5 === 0 && !replay
        ? playPlantMelody(save.settings.sound)
        : playRevealMelody(save.settings.sound);
  };
  const next = () => {
    if (sealPage && !sealFinished) return;
    setDismissed(true);
    if (save.current < 100) {
      const target = save.current + 1;
      turnPage(target, () => setSave((v) => loadLevel(v, target)));
    } else router.push('/herbier');
  };
  const replayPage = () => {
    const current = save.current;
    setDismissed(true);
    turnPage(current, () => {
      if (timer.current) clearTimeout(timer.current);
      setSelected(null);
      setHint(null);
      clearNote();
      setReveal(false);
      setPlateOpen(false);
      setBusy(false);
      setPouring(null);
      setReplay(true);
      setTubeReward(null);
      revealPlayed.current = false;
      stopPour.current();
      stopReveal.current();
      stopChime.current();
      setSealFinished(false);
      scroll.current?.scrollTo({ y: 0, animated: false });
      setSave((value) => loadLevel(value, current));
      setDismissed(false);
    });
  };
  const replayAction = (
    <VictoryAction icon="refresh-outline" secondary onPress={replayPage}>
      Rejouer la page
    </VictoryAction>
  );
  return (
    <BookScrollView
      ref={scroll}
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
        maxWidth: 1180,
        alignSelf: 'center',
        paddingHorizontal: width < 800 ? 18 : 32,
        paddingTop: scenePadding.top,
        paddingBottom: scenePadding.bottom,
      }}
    >
      <View
        onLayout={(event) =>
          reportSceneHeight(
            event.nativeEvent.layout.height +
              bookHeaderHeight +
              scenePadding.top +
              scenePadding.bottom,
          )
        }
        style={{
          flexDirection: wide ? 'row' : 'column',
          gap: 28,
          alignItems: wide ? 'flex-start' : 'stretch',
        }}
      >
        <View testID="integrated-game-scene" style={{ flex: wide ? 1.35 : undefined }}>
          <PageFolio page={save.current} />
          <ChapterVignette
            plant={plant}
            chapter={chapter}
            stage={stage}
            compact={!wide}
            narrow={width < 360}
            busy={busy}
            onOpen={() => setPlateOpen(true)}
          />
          {!wide && (
            <StampPrompt
              onPress={() => setPlateOpen(true)}
              disabled={busy}
              motion={save.settings.motion}
            />
          )}

          {save.current === 1 && width >= 800 && (
            <T style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 18 }}>
              Touchez un flacon, puis un autre pour verser.
            </T>
          )}
          <View
            testID="liquid-play-area"
            style={{
              paddingVertical: 2,
            }}
          >
            {note.kind === 'info' && !!note.text && (
              <MistakeLeaves
                key={note.request}
                text={note.text}
                motion={save.settings.motion}
                onDismiss={clearNote}
              />
            )}
            <LiquidBoard
              integrated
              reward={victory && winReady ? null : tubeReward}
              onRewardDone={(id) =>
                setTubeReward((previous) => (previous?.id === id ? null : previous))
              }
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
          <HintSlot>
            {note.kind === 'hint' && (
              <HintScroll
                key={note.request}
                text={note.text}
                pending={note.pending}
                motion={save.settings.motion}
                request={note.request}
              />
            )}
          </HintSlot>
          <Paper
            testID="game-actions"
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 6,
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
                icon: 'undo' as const,
                action: () => {
                  setSave(undo);
                  setSelected(null);
                  setHint(null);
                  clearNote();
                  setTubeReward(null);
                  stopPour.current();
                  stopChime.current();
                },
                disabled: !save.history.length || victory,
              },
              {
                name: 'Recommencer',
                icon: 'restart' as const,
                action: () => {
                  setSave((v) => loadLevel(v, v.current));
                  setSelected(null);
                  setHint(null);
                  clearNote();
                  setDismissed(false);
                  setTubeReward(null);
                  stopPour.current();
                  stopChime.current();
                },
                disabled: false,
              },
              { name: 'Indice', icon: 'hint' as const, action: askHint, disabled: victory },
            ].map((a) => (
              <Pressable
                key={a.name}
                accessibilityLabel={a.name}
                accessibilityRole="button"
                onPress={a.action}
                disabled={busy || a.disabled}
                style={{
                  alignItems: 'center',
                  gap: 3,
                  flex: 1,
                  minWidth: 0,
                  minHeight: 82,
                  paddingVertical: 6,
                  paddingHorizontal: 2,
                  opacity: a.disabled ? 0.35 : 1,
                }}
              >
                <SpellIcon size={32} name={a.icon} />
                <T
                  style={{
                    fontFamily: F.handwritingMedium,
                    fontSize: Math.min(19, width / 19),
                    lineHeight: 24,
                    color: C.green,
                    textAlign: 'center',
                    maxWidth: '100%',
                  }}
                >
                  {a.name}
                </T>
                {a.name === 'Indice' ? (
                  <T
                    testID="hint-seed-price"
                    style={{
                      fontSize: 10,
                      lineHeight: 16,
                      color: C.muted,
                      fontFamily: F.scientific,
                      textAlign: 'center',
                    }}
                  >
                    {currentHint(save) ? 'Déjà cueilli' : '1 graine'}
                  </T>
                ) : (
                  <View style={{ height: 16 }} />
                )}
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
                <T style={{ fontSize: 11, color: C.green }}>{Math.min(stage, 4)} / 4 couleurs</T>
              </View>
              <RestorationProgress stage={stage} />
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
                <RestorationProgress stage={stage} />
              </View>
              <Button icon="flask-outline" onPress={() => setPlateOpen(false)}>
                Revenir au jeu
              </Button>
            </Paper>
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={victory && winReady && !dismissed && save.started}
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
          <ScrollView
            testID="victory-result-scroll"
            pointerEvents={sealActive ? 'none' : 'auto'}
            accessibilityElementsHidden={sealActive}
            importantForAccessibility={sealActive ? 'no-hide-descendants' : 'auto'}
            style={{ maxHeight: '95%', width: '100%', maxWidth: 460, opacity: sealActive ? 0 : 1 }}
          >
            {victory && winReady && !dismissed && save.started && (
              <VictoryPaper motion={resultMotion} sound={save.settings.sound}>
                <Label>
                  {save.current === 100
                    ? 'L’HERBIER RETROUVE SES COULEURS'
                    : sealPage
                      ? 'LE SCEAU DU BOTANISTE'
                      : replay
                        ? 'UNE PAGE À NOUVEAU COLORÉE'
                        : 'VOTRE HERBIER REPREND VIE'}
                </Label>
                <T serif style={{ fontSize: 32, marginTop: 13, lineHeight: 38 }}>
                  {save.current === 100
                    ? 'Votre collection est complète.'
                    : sealPage
                      ? s.name
                      : restorationTitles[(save.current - 1) % 5]}
                </T>
                <RewardStars count={earnedStars} motion={resultMotion} />
                <T
                  testID="page-result-moves"
                  style={{
                    fontFamily: F.handwriting,
                    fontSize: 21,
                    lineHeight: 28,
                    color: C.muted,
                    marginTop: 4,
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  Page achevée en {save.moves} {save.moves === 1 ? 'mouvement' : 'mouvements'}.
                </T>
                <T
                  testID="page-star-target"
                  accessibilityLabel={`Minimum possible : ${levels[save.current - 1].par} mouvements. Trois étoiles jusqu’à ${starLimits(levels[save.current - 1].par).three} mouvements.`}
                  style={{
                    fontFamily: F.scientific,
                    fontSize: 15,
                    color: C.muted,
                    textAlign: 'center',
                    marginTop: 3,
                  }}
                >
                  Minimum : {levels[save.current - 1].par} · Objectif ★★★ :{' '}
                  {starLimits(levels[save.current - 1].par).three}
                </T>
                {(save.completed[save.current]?.stars ?? 0) > earnedStars && (
                  <T
                    testID="page-saved-best-stars"
                    style={{
                      fontFamily: F.scientific,
                      fontSize: 14,
                      color: C.green,
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                  >
                    Meilleur résultat conservé : {'★'.repeat(save.completed[save.current].stars)}
                  </T>
                )}
                <T
                  testID="page-seed-reward"
                  style={{
                    fontFamily: F.scientific,
                    color: C.green,
                    textAlign: 'center',
                    marginTop: 12,
                  }}
                >
                  {earnedStars === 3
                    ? 'Trois étoiles : une graine a rejoint votre réserve.'
                    : 'Trois étoiles feront éclore une nouvelle graine.'}
                </T>
                {earnedStars < 3 && replayAction}
                {!reveal ? (
                  <>
                    <Botanical
                      index={plant}
                      stage={sealPage ? 4 : replay ? stage : Math.max(0, stage - 1)}
                      size={resultPlateSize}
                    />
                    <VictoryAction icon="water-outline" onPress={() => restorePigment()}>
                      {sealPage ? 'Estampiller la planche' : 'Révéler la couleur'}
                    </VictoryAction>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        restorePigment(false);
                      }}
                      style={{ padding: 16 }}
                    >
                      <T style={{ fontFamily: F.scientific, fontSize: 16, color: C.muted }}>
                        Passer l’animation
                      </T>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {sealPage ? (
                      <View
                        testID="finished-plate-ceremony"
                        style={{ width: resultPlateSize, height: resultPlateSize * 1.36 }}
                      >
                        <Botanical
                          index={plant}
                          stage={sealFinished ? 5 : 4}
                          size={resultPlateSize}
                        />
                      </View>
                    ) : (
                      <ColorReveal
                        index={plant}
                        from={replay ? stage : Math.max(0, stage - 1)}
                        to={stage}
                        size={resultPlateSize}
                        motion={revealAnimated}
                      />
                    )}
                    <T
                      testID="restoration-botanical-fact"
                      style={{ textAlign: 'center', color: C.muted, marginBottom: 18 }}
                    >
                      {botanicalFact(save.current, 'reveal')}
                    </T>
                    <VictoryAction
                      icon="arrow-forward-outline"
                      onPress={next}
                      disabled={sealPage && !sealFinished}
                    >
                      {save.current === 100
                        ? 'Contempler mon herbier'
                        : sealPage
                          ? 'Découvrir l’espèce suivante'
                          : 'Poursuivre la restauration'}
                    </VictoryAction>
                  </>
                )}
                {earnedStars === 3 && replayAction}
                {reveal && (
                  <VictoryAction
                    icon="book-outline"
                    secondary
                    onPress={() => {
                      setDismissed(true);
                      router.push('/herbier');
                    }}
                  >
                    Ouvrir l’herbier
                  </VictoryAction>
                )}
              </VictoryPaper>
            )}
          </ScrollView>
          {sealActive && (
            <SealCeremony
              index={plant}
              name={s.name}
              sound={save.settings.sound}
              onDone={() => setSealFinished(true)}
            />
          )}
        </View>
      </Modal>
    </BookScrollView>
  );
}
