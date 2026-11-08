import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { OpeningScene } from './OpeningScene';
import { movieClock } from '../animation/movieClock';
import { useIntroMusic } from './useIntroMusic';
import { prologueDuration, prologueFrame } from '../animation/prologue';
import { Paper, PaperTexture } from './Paper';
import { Button, C, Icon, Label, T } from './ui';
import { F } from './fonts';
import { normalizeNickname } from '../state/model';
import { AccountConnections } from './AccountConnections';
export function BookEntrance({
  returning,
  nickname,
  motion,
  music,
  onMusicChange,
  onEnter,
  guide,
  onGuideClose,
  replayOnly = false,
  onReplayDone,
}: {
  returning: boolean;
  nickname: string;
  motion: boolean;
  music: boolean;
  onMusicChange: (enabled: boolean) => void;
  onEnter: (nickname: string) => void;
  guide?: React.ReactNode;
  onGuideClose?: () => void;
  replayOnly?: boolean;
  onReplayDone?: () => void;
}) {
  const value = useRef(new Animated.Value(returning || !motion ? 1 : 0)).current;
  const clock = useMemo(() => movieClock(prologueDuration, () => performance.now()), []);
  const [finished, setFinished] = useState(returning || !motion);
  const [name, setName] = useState(nickname),
    [error, setError] = useState('');
  const [replayRun, setReplayRun] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  const readProgress = useCallback(() => clock.progress(), [clock]);
  const readPosition = useCallback(() => (clock.progress() * prologueDuration) / 1000, [clock]);
  const intro = useIntroMusic(
    !finished && music,
    music && sceneReady && foreground && !finished,
    readPosition,
  );
  const submitted = useRef(false);
  const replayDone = useRef(onReplayDone);
  replayDone.current = onReplayDone;
  const finishMovie = useCallback(() => {
    clock.setActive(false);
    clock.seek(1);
    value.stopAnimation();
    value.setValue(1);
    setFinished(true);
    if (replayOnly) replayDone.current?.();
  }, [clock, value, replayOnly]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        clock.setActive(false);
        value.stopAnimation();
      }
      setForeground(state === 'active');
    });
    return () => sub.remove();
  }, [clock, value]);
  useEffect(() => {
    if ((returning && replayRun === 0) || !motion) {
      finishMovie();
      return;
    }
    if (!sceneReady || !foreground || finished) {
      clock.setActive(false);
      return;
    }
    value.setValue(clock.progress());
    const remaining = prologueDuration * (1 - clock.progress());
    clock.setActive(true);
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished: done }) => {
      if (done) finishMovie();
    });
    return () => {
      clock.setActive(false);
      animation.stop();
    };
  }, [returning, motion, value, replayRun, sceneReady, foreground, finished, clock, finishMovie]);
  const curves = useMemo(() => {
    const inputRange = Array.from({ length: 61 }, (_, i) => i / 60);
    return {
      scale: value.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1.04] }),
      growth: value.interpolate({
        inputRange,
        outputRange: inputRange.map((p) => 0.22 + prologueFrame(p).growth * 0.12),
      }),
      arrival: value.interpolate({
        inputRange,
        outputRange: inputRange.map((p) => prologueFrame(p).arrival),
      }),
      caption: value.interpolate({
        inputRange,
        outputRange: inputRange.map((p) => (1 - prologueFrame(p).arrival) * 0.95),
      }),
    };
  }, [value]);
  const captions = useMemo(
    () =>
      [
        { text: 'Le livre se souvient.', input: [0, 0.27, 0.3, 1], output: [1, 1, 0, 0] },
        {
          text: 'Un souffle réveille ses pages.',
          input: [0, 0.27, 0.3, 0.69, 0.72, 1],
          output: [0, 0, 1, 1, 0, 0],
        },
        {
          text: 'Et le vivant retrouve son chemin.',
          input: [0, 0.69, 0.72, 1],
          output: [0, 0, 1, 1],
        },
      ].map((caption) => ({
        text: caption.text,
        opacity: value.interpolate({ inputRange: caption.input, outputRange: caption.output }),
      })),
    [value],
  );
  const enter = () => {
    if (submitted.current) return;
    const cleaned = normalizeNickname(name);
    if (!returning && cleaned.length < 2) {
      setError('Choisissez un pseudo de 2 à 24 caractères pour signer votre carnet.');
      return;
    }
    submitted.current = true;
    Keyboard.dismiss();
    onEnter(cleaned || nickname);
  };
  return (
    <Modal
      visible
      animationType="none"
      onRequestClose={() => {
        if (guide) onGuideClose?.();
        else if (!finished) {
          finishMovie();
        }
      }}
    >
      {guide || (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: finished ? C.paper : '#203b30' }}
        >
          {finished ? (
            <PaperTexture background />
          ) : (
            <View
              testID="book-opening-film"
              onTouchStart={intro.unlock}
              style={{ flex: 1, backgroundColor: '#101f19' }}
            >
              <Animated.Image
                source={require('../../assets/illustrations/serre.png')}
                blurRadius={4}
                resizeMode="cover"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: curves.growth,
                  transform: [{ scale: curves.scale }],
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#0b2019',
                  opacity: 0.33,
                }}
              />
              <View style={{ flex: 1 }}>
                <OpeningScene
                  progress={0}
                  progressSource={readProgress}
                  onReady={() => setSceneReady(true)}
                  onLoading={() => setSceneReady(false)}
                />
              </View>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 64,
                  opacity: curves.caption,
                  left: 20,
                  right: 20,
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <T style={{ fontSize: 10, letterSpacing: 2, color: '#d5c698' }}>
                  HERBIER DES COULEURS
                </T>
                <View style={{ width: '100%', height: 120 }} accessible={false}>
                  {captions.map((caption) => (
                    <Animated.View
                      key={caption.text}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        opacity: caption.opacity,
                      }}
                    >
                      <T serif style={{ fontSize: 34, color: '#f4e5bc', textAlign: 'center' }}>
                        {caption.text}
                      </T>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                testID="prologue-paper-dissolve"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: C.paper,
                  opacity: curves.arrival,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  intro.blocked
                    ? 'Éveiller la musique de l’introduction'
                    : music
                      ? 'Couper la musique de l’introduction'
                      : 'Activer la musique de l’introduction'
                }
                onPress={() => {
                  intro.unlock();
                  onMusicChange(intro.blocked ? true : !music);
                }}
                style={{
                  position: 'absolute',
                  bottom: 104,
                  alignSelf: 'center',
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Icon name="leaf-outline" size={18} color="#dfd0ad" />
                <T style={{ fontFamily: F.scientific, fontSize: 13, color: '#dfd0ad' }}>
                  {intro.blocked
                    ? 'Éveiller la musique'
                    : music
                      ? 'Musique éveillée'
                      : 'Musique en sommeil'}
                </T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Passer le prologue"
                onPress={() => {
                  finishMovie();
                }}
                style={{ position: 'absolute', bottom: 36, alignSelf: 'center', padding: 15 }}
              >
                <T style={{ fontFamily: F.scientific, color: '#dfd0ad' }}>Passer le prologue</T>
              </Pressable>
            </View>
          )}
          {finished && (
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24,
                paddingVertical: 42,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <Paper
                testID="book-signature-page"
                style={{
                  width: '100%',
                  maxWidth: 460,
                  padding: 30,
                  gap: 18,
                  backgroundColor: '#f2e4c8',
                  borderRadius: 8,
                }}
              >
                <Label>{returning ? 'VOTRE LIVRE VOUS ATTEND' : 'CE CARNET APPARTIENT À'}</Label>
                <T serif style={{ fontSize: 39, lineHeight: 44, textAlign: 'center' }}>
                  {returning
                    ? nickname
                      ? `L’herbier de ${nickname}`
                      : 'Herbier des couleurs'
                    : 'Herbier des couleurs'}
                </T>
                {!returning && (
                  <>
                    <T style={{ fontFamily: F.scientific, textAlign: 'center', color: C.muted }}>
                      Les couleurs se sont endormies entre ces pages. Signez le livre pour leur
                      redonner vie.
                    </T>
                    <TextInput
                      testID="nickname-input"
                      accessibilityLabel="Votre pseudo"
                      value={name}
                      onChangeText={(v) => {
                        setName(v);
                        setError('');
                      }}
                      maxLength={24}
                      placeholder="Votre pseudo"
                      autoCapitalize="words"
                      autoComplete="off"
                      returnKeyType="done"
                      onSubmitEditing={enter}
                      style={{
                        fontFamily: F.handwritingMedium,
                        fontSize: 29,
                        color: C.ink,
                        borderBottomWidth: 1,
                        borderColor: C.gold,
                        paddingVertical: 13,
                        textAlign: 'center',
                        minHeight: 56,
                      }}
                    />
                    {!!error && (
                      <T accessibilityRole="alert" style={{ color: '#875342' }}>
                        {error}
                      </T>
                    )}
                    <T style={{ fontSize: 13, textAlign: 'center', color: C.muted }}>
                      Regroupez chaque couleur dans une fiole pleine. Une graine vous attend ; trois
                      étoiles en feront éclore une autre.
                    </T>
                  </>
                )}
                <Button icon="book-outline" onPress={enter}>
                  {returning ? 'Rouvrir mon herbier' : 'Créer mon carnet'}
                </Button>
                {returning && motion && (
                  <Button
                    icon="leaf-outline"
                    secondary
                    onPress={() => {
                      value.stopAnimation();
                      value.setValue(0);
                      clock.seek(0);
                      setFinished(false);
                      setSceneReady(false);
                      setReplayRun((n) => n + 1);
                    }}
                  >
                    Revoir le prologue
                  </Button>
                )}
                {!returning && (
                  <>
                    <T
                      style={{
                        fontFamily: F.scientific,
                        fontSize: 12,
                        textAlign: 'center',
                        color: C.muted,
                      }}
                    >
                      Votre pseudo et votre progression sont enregistrés sur cet appareil.
                    </T>
                    <AccountConnections />
                  </>
                )}
                {returning && (
                  <T
                    style={{
                      fontFamily: F.scientific,
                      fontSize: 13,
                      textAlign: 'center',
                      color: C.muted,
                    }}
                  >
                    Ouvrez le livre pour retrouver vos pages et leur musique.
                  </T>
                )}
              </Paper>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}
