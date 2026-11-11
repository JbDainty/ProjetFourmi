import { blocked, crystalOpen, capacity } from '../src/engine/puzzle';
import { colorNames } from '../src/data/botany';
import { MechanicIntroduction } from '../src/components/MechanicIntroduction';
import { F } from '../src/components/fonts';
import { Paper } from '../src/components/Paper';
import { PageTurnContext } from '../src/components/PageTurn';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  View,
  ScrollView,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { useGame } from '../src/state/store';
import {
  loadLevel,
  move,
  undo,
  restoration,
  currentHint,
  hintPurchased,
  purchaseHint,
  remixPage,
  activeRules,
} from '../src/state/model';
import { certifiedHint } from '../src/engine/remix';
import { WorkshopConfirm } from '../src/components/WorkshopConfirm';
import { usePrimaryAnimation } from '../src/components/usePrimaryAnimation';
import { won, pour, Move } from '../src/engine/puzzle';
import { findHintPath } from '../src/engine/hintSearch';
import { ecosystemForPage } from '../src/data/ecology';
import { species } from '../src/data/botany';
import { LiquidBoard } from '../src/components/LiquidBoard';
import { Botanical } from '../src/components/Botanical';
import { SpellIcon } from '../src/components/SpellIcon';
import { HintScroll } from '../src/components/HintScroll';
import {
  HintSlot,
  emptySeedHint,
  missingPathHint,
  blockedPathHint,
  compactHint,
} from '../src/components/HintSlot';
import { MistakeLeaves } from '../src/components/MistakeLeaves';
import { SceneSizeContext } from '../src/components/SceneSize';
import { BookChromeContext } from '../src/components/BookScrollView';
import { WorkshopHud, WorkshopCaption } from '../src/components/WorkshopChrome';
import { WorkshopPlate } from '../src/components/WorkshopPlate';
import { T, Label, Icon, Button, C, ui } from '../src/components/ui';
import { feedback } from '../src/services/feedback';
import { playPourSound } from '../src/services/pourSound';
import { playRevealMelody } from '../src/services/revealMelody';
import { playPlantMelody } from '../src/services/plantMelody';
import { completedByPour, type TubeReward } from '../src/animation/tubeReward';
import { playVialChime } from '../src/services/vialChime';
import { preparePageArtwork } from '../src/services/pageArtwork';
import { RestorationProgress } from '../src/components/RestorationProgress';
import { RestorationResult } from '../src/components/RestorationResult';
import { workshopLayout } from '../src/layout/workshop';
type Note = { text: string; kind: 'info' | 'hint'; request: number; pending: boolean };
export default function Atelier() {
  const { save } = useGame();
  if (!save.started) return null;
  if (!save.guideSeen)
    return <Redirect href={{ pathname: '/aide', params: { premiersPas: '1' } }} />;
  return <Workshop />;
}
function Workshop() {
  const reportSceneHeight = React.useContext(SceneSizeContext);
  const turnPage = React.useContext(PageTurnContext);
  const { save, setSave } = useGame(),
    { width, height, fontScale } = useWindowDimensions();
  const { availableWidth, availableHeight, hintHeight } = React.useContext(BookChromeContext);
  const layout = workshopLayout(width, availableWidth, {
    height: availableHeight || height,
    tubes: save.board.length,
    fontScale,
    hintHeight,
  });
  const { wide } = layout;
  const rules = activeRules(save);
  const introductions = (rules?.mechanics ?? []).filter((m) => !save.seenMechanics?.includes(m));
  useEffect(() => reportSceneHeight(layout.height), [layout.height, reportSceneHeight]);
  const [replay, setReplay] = useState(!!save.completed[save.current]);
  const [tubeReward, setTubeReward] = useState<TubeReward | null>(null);
  const [winReady, setWinReady] = useState(won(save.board, rules));
  const hintPending = useRef(false);
  const [confirm, setConfirm] = useState<'hint' | 'mix' | null>(null);
  const mixOpacity = useRef(new Animated.Value(1)).current;
  const mixAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const mixPending = useRef(false);
  const mixFrame = useRef<number | null>(null);
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
  const hintSearchAbort = useRef<AbortController | null>(null);
  usePrimaryAnimation(busy && mixPending.current);
  const plant = Math.floor((save.current - 1) / 5),
    s = species[plant],
    chapter = ecosystemForPage(save.current),
    stage = restoration(save, plant),
    sealPage = save.current % 5 === 0,
    victory = won(save.board, rules);
  useEffect(() => {
    mixAnimation.current?.stop();
    if (mixFrame.current !== null) cancelAnimationFrame(mixFrame.current);
    mixPending.current = false;
    mixOpacity.setValue(1);
    setConfirm(null);
    if (!victory) return;
    preparePageArtwork(plant, stage);
    const nextPlant = Math.floor(save.current / 5);
    if (save.current < 1000 && nextPlant !== plant)
      preparePageArtwork(nextPlant, restoration(save, nextPlant));
  }, [victory, save.current, plant, stage]);
  const clearNote = () =>
    setNote((previous) => ({ ...previous, text: '', kind: 'info', pending: false }));
  useEffect(() => {
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
    hintSearchAbort.current?.abort();
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
      mixAnimation.current?.stop();
      if (mixFrame.current !== null) cancelAnimationFrame(mixFrame.current);
      if (timer.current) clearTimeout(timer.current);
      hintSearchAbort.current?.abort();
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
    const after = pour(save.board, from, to, rules);
    if (after && completedByPour(save.board, after, to, rules)) {
      setTubeReward({ id: ++rewardId.current, tube: to, color: after[to][0] });
      stopChime.current();
      stopChime.current = playVialChime(save.settings.sound);
    }
    setSave((value) => move(value, from, to));
  };
  const tap = (index: number) => {
    if (busy || victory || introductions.length) return;
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
    const after = pour(save.board, selected, index, rules);
    if (!after) {
      setNote((previous) => ({
        ...previous,
        text: (() => {
          const gate = rules?.gates?.find(
            (g) => (g.tube === selected || g.tube === index) && blocked(save.board, g.tube, rules),
          );
          if (gate) return `Complétez la fiole ${gate.key + 1} au pinceau pour ouvrir ce verrou.`;
          if (rules?.collectors?.includes(selected))
            return 'Cette fiole conserve les teintes : elle reçoit, mais ne se reverse pas.';
          const frost = rules?.crystals?.find(
            (c) => c.tube === selected && !crystalOpen(save.board, c.color, rules),
          );
          if (frost)
            return `Complétez une fiole ${colorNames[frost.color].toLowerCase()} pour libérer le cristal.`;
          const filter = rules?.filters?.find((f) => f.tube === index);
          if (filter)
            return `Ce filtre reçoit seulement la teinte ${colorNames[filter.color].toLowerCase()}.`;
          if (rules?.links?.some((pair) => pair.includes(index)))
            return 'Ces fioles sœurs doivent recevoir la même teinte au sommet.';
          return 'Versez sur une couleur identique\nou dans un flacon vide.';
        })(),
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
    if (!hintPurchased(save) && save.seeds < 1) {
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
    hintSearchAbort.current?.abort();
    const controller = new AbortController();
    hintSearchAbort.current = controller;
    timer.current = setTimeout(async () => {
      let suggestion = owned ?? certifiedHint(page, save.board, save.remix);
      let blocked = false;
      if (!suggestion) {
        const result = await findHintPath(save.board, rules, { signal: controller.signal }).catch(
          () => ({ status: 'limit' as const, expanded: 0 }),
        );
        if (controller.signal.aborted || result.status === 'cancelled') return;
        if (result.status === 'found') suggestion = result.path[0];
        blocked = result.status === 'blocked';
      }
      if (controller.signal.aborted) return;
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
          : blocked
            ? blockedPathHint
            : missingPathHint,
      }));
      hintPending.current = false;
      setBusy(false);
    }, 60);
  };
  const requestHint = () => {
    if (busy || victory || hintPending.current || mixPending.current) return;
    if (!hintPurchased(save) && save.seeds > 0 && save.settings.confirmHints !== false)
      setConfirm('hint');
    else askHint();
  };
  const mixColors = () => {
    if (busy || victory || mixPending.current || save.seeds < 1) return;
    mixPending.current = true;
    setBusy(true);
    setSelected(null);
    setHint(null);
    clearNote();
    setTubeReward(null);
    stopPour.current();
    stopChime.current();
    const current = save.current,
      before = JSON.stringify(save.board);
    const apply = () => {
      setSave((v) =>
        v.current === current && JSON.stringify(v.board) === before ? remixPage(v) : v,
      );
    };
    if (!save.settings.motion) {
      apply();
      mixPending.current = false;
      setBusy(false);
      return;
    }
    const out = Animated.timing(mixOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    });
    mixAnimation.current = out;
    out.start(({ finished }) => {
      if (!finished) return;
      apply();
      // Reveal only after React has committed the new mixture under the hidden glass.
      mixFrame.current = requestAnimationFrame(() => {
        const enter = Animated.timing(mixOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: Platform.OS !== 'web',
        });
        mixAnimation.current = enter;
        enter.start(({ finished }) => {
          if (finished) {
            mixPending.current = false;
            setBusy(false);
          }
        });
      });
    });
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
    if (save.current < 1000) {
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
      setSave((value) => loadLevel(value, current));
      setDismissed(false);
    });
  };
  const chromeProps = {
    layout,
    plant,
    stage,
    page: save.current,
    seeds: save.seeds,
    motion: save.settings.motion,
    busy,
    testMode: !!save.testSession,
    onOpen: () => setPlateOpen(true),
  };
  const actions = (
    <Paper
      testID="game-actions"
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 26,
        paddingHorizontal: layout.actionHorizontalPadding,
        borderRadius: 30,
        backgroundColor: '#f4ead6ee',
        width: '100%',
        height: layout.actionsHeight,
        maxWidth: 480,
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
        {
          name: 'Mélanger',
          icon: 'mix' as const,
          action: () => {
            if (save.seeds < 1) {
              setNote((previous) => ({
                text: emptySeedHint,
                kind: 'hint',
                request: previous.request + 1,
                pending: false,
              }));
            } else setConfirm('mix');
          },
          disabled: victory,
        },
        { name: 'Indice', icon: 'hint' as const, action: requestHint, disabled: victory },
      ].map((a) => (
        <Pressable
          key={a.name}
          accessibilityLabel={a.name}
          accessibilityRole="button"
          accessibilityHint={
            a.name === 'Indice'
              ? hintPurchased(save)
                ? 'Conseil déjà cueilli, sans nouvelle dépense'
                : 'Un nouveau conseil coûte une graine'
              : undefined
          }
          onPress={a.action}
          disabled={busy || a.disabled || introductions.length > 0}
          style={{
            alignItems: 'center',
            gap: 2,
            flex: 1,
            minWidth: 0,
            minHeight: 44,
            justifyContent: 'center',
            paddingVertical: 0,
            paddingHorizontal: 2,
            opacity: a.disabled ? 0.35 : 1,
          }}
        >
          <SpellIcon size={layout.actionIconSize} name={a.icon} />
          {layout.showActionLabels && (
            <T
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
              style={{
                fontFamily: F.handwritingMedium,
                fontSize: layout.actionLabelSize,
                lineHeight: layout.actionLabelLine,
                height: layout.actionLabelHeight,
                color: C.green,
                textAlign: 'center',
                maxWidth: '100%',
              }}
            >
              {a.name}
            </T>
          )}
        </Pressable>
      ))}
    </Paper>
  );
  return (
    <View
      testID="workshop-screen"
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
        padding: layout.padding,
      }}
    >
      <WorkshopHud {...chromeProps} />
      <View
        testID="integrated-game-scene"
        style={{ flex: 1, minHeight: 0, flexDirection: wide ? 'row' : 'column', gap: layout.gap }}
      >
        <View style={{ width: layout.boardWidth, height: '100%', minHeight: 0, gap: 4 }}>
          <WorkshopCaption {...chromeProps} />
          <View
            testID="liquid-play-area"
            style={{ flex: 1, minHeight: 0, justifyContent: 'center' }}
          >
            {note.kind === 'info' && !!note.text && (
              <MistakeLeaves
                key={note.request}
                text={note.text}
                motion={save.settings.motion}
                onDismiss={clearNote}
              />
            )}
            <Animated.View
              style={{ opacity: mixOpacity }}
              testID={mixPending.current ? 'workshop-mixing' : 'workshop-mixture-ready'}
            >
              <LiquidBoard
                initialWidth={layout.boardWidth}
                maxHeight={layout.boardHeight}
                integrated
                reward={victory && winReady ? null : tubeReward}
                onRewardDone={(id) =>
                  setTubeReward((previous) => (previous?.id === id ? null : previous))
                }
                board={save.board}
                rules={rules}
                known={save.known}
                selected={selected}
                hint={hint}
                pouring={pouring}
                disabled={busy || victory || introductions.length > 0}
                motion={save.settings.motion}
                patterns={save.settings.patterns}
                onTap={tap}
                onFinish={finishPour}
              />
            </Animated.View>
          </View>
          <View
            testID="workshop-footer"
            style={{
              height: layout.footerHeight,
              width: '100%',
              flexDirection: layout.landscape ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <View style={{ width: layout.hintWidth, height: layout.hintHeight }}>
              <HintSlot
                key={`${layout.hintWidth}/${fontScale}`}
                layoutWidth={layout.hintWidth}
                compact
                fixedHeight={layout.hintHeight}
              >
                {note.kind === 'hint' && (
                  <HintScroll
                    key={note.request}
                    text={compactHint(note.text)}
                    spokenText={note.text}
                    compact
                    pending={note.pending}
                    motion={save.settings.motion}
                    request={note.request}
                  />
                )}
              </HintSlot>
            </View>
            <View
              style={{
                width: layout.landscape ? layout.boardWidth - layout.hintWidth - 4 : '100%',
                height: layout.actionsHeight,
                alignItems: 'center',
              }}
            >
              {actions}
            </View>
          </View>
        </View>
        {wide && <WorkshopPlate plant={plant} stage={stage} />}
      </View>
      {!!introductions.length && (
        <MechanicIntroduction
          mechanics={introductions}
          motion={save.settings.motion}
          onClose={() =>
            setSave((s) => ({
              ...s,
              seenMechanics: [...new Set([...(s.seenMechanics ?? []), ...introductions])],
            }))
          }
        />
      )}
      {confirm && (
        <WorkshopConfirm
          kind={confirm}
          motion={save.settings.motion}
          onCancel={() => setConfirm(null)}
          onConfirm={(skip) => {
            const kind = confirm;
            setConfirm(null);
            if (kind === 'hint') {
              if (skip)
                setSave((v) => ({ ...v, settings: { ...v.settings, confirmHints: false } }));
              askHint();
            } else mixColors();
          }}
        />
      )}
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
        {victory && winReady && !dismissed && save.started && (
          <RestorationResult
            save={save}
            replay={replay}
            reveal={reveal}
            revealAnimated={revealAnimated}
            sealFinished={sealFinished}
            onReveal={restorePigment}
            onContinue={next}
            onReplay={replayPage}
            onHerbarium={() => {
              setDismissed(true);
              router.push('/herbier');
            }}
            onSealDone={() => setSealFinished(true)}
          />
        )}
      </Modal>
    </View>
  );
}
