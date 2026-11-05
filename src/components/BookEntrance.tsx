import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { OpeningScene } from './OpeningScene';
import { prologueDuration, prologueFrame } from '../animation/prologue';
import { Image } from 'react-native';
import { Paper, PaperTexture } from './Paper';
import { Button, C, Label, T } from './ui';
import { F } from './fonts';
import { normalizeNickname } from '../state/model';
import { AccountConnections } from './AccountConnections';
export function BookEntrance({
  returning,
  nickname,
  motion,
  onEnter,
}: {
  returning: boolean;
  nickname: string;
  motion: boolean;
  onEnter: (nickname: string) => void;
}) {
  const value = useRef(new Animated.Value(returning || !motion ? 1 : 0)).current;
  const [progress, setProgress] = useState(returning || !motion ? 1 : 0),
    [name, setName] = useState(nickname),
    [error, setError] = useState('');
  const [replayRun, setReplayRun] = useState(0);
  const submitted = useRef(false);
  const finished = progress >= 1;
  const frame = prologueFrame(progress);
  useEffect(() => {
    if ((returning && replayRun === 0) || !motion) {
      value.setValue(1);
      setProgress(1);
      return;
    }
    value.setValue(0);
    setProgress(0);
    const listener = value.addListener(({ value }) => setProgress(value));
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: prologueDuration,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      value.removeListener(listener);
    };
  }, [returning, motion, value, replayRun]);
  const enter = () => {
    if (submitted.current) return;
    const cleaned = normalizeNickname(name);
    if (!returning && cleaned.length < 2) {
      setError('Choisissez un pseudo de 2 à 24 caractères pour signer votre carnet.');
      return;
    }
    submitted.current = true;
    onEnter(cleaned || nickname);
  };
  return (
    <Modal
      visible
      animationType="none"
      onRequestClose={() => {
        if (!finished) {
          value.stopAnimation();
          value.setValue(1);
          setProgress(1);
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: finished ? C.paper : '#203b30' }}
      >
        {finished ? (
          <PaperTexture background />
        ) : (
          <View testID="book-opening-film" style={{ flex: 1, backgroundColor: '#101f19' }}>
            <Image
              source={require('../../assets/illustrations/serre.png')}
              blurRadius={4}
              resizeMode="cover"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0.22 + frame.growth * 0.12,
                transform: [{ scale: 1.12 - progress * 0.08 }],
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
              <OpeningScene progress={progress} />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 64,
                opacity: (1 - frame.arrival) * 0.95,
                left: 20,
                right: 20,
                alignItems: 'center',
                gap: 12,
              }}
            >
              <T style={{ fontSize: 10, letterSpacing: 2, color: '#d5c698' }}>
                HERBIER DES COULEURS
              </T>
              <T serif style={{ fontSize: 34, color: '#f4e5bc', textAlign: 'center' }}>
                {frame.caption}
              </T>
            </View>
            <View
              pointerEvents="none"
              testID="prologue-paper-dissolve"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: C.paper,
                opacity: frame.arrival,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Passer le prologue"
              onPress={() => {
                value.stopAnimation();
                value.setValue(1);
                setProgress(1);
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
                <Button icon="leaf-outline" secondary onPress={() => setReplayRun((n) => n + 1)}>
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
    </Modal>
  );
}
