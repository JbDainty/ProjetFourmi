import { BookScrollView } from '../src/components/BookScrollView';
import Constants from 'expo-constants';
import { F } from '../src/components/fonts';
import { Paper } from '../src/components/Paper';
import React, { useState } from 'react';
import { View, Switch, TextInput } from 'react-native';
import { useGame } from '../src/state/store';
import { normalizeNickname, Settings } from '../src/state/model';
import { T, Label, Button, C, ui } from '../src/components/ui';
import { ResetProgressDialog } from '../src/components/ResetProgressDialog';
import { router } from 'expo-router';
import { unlockAmbience } from '../src/services/ambience';
import { AccountConnections } from '../src/components/AccountConnections';
export default function Parametres() {
  const { save, setSave, error, reset } = useGame(),
    [nickname, setNickname] = useState(save.nickname),
    [note, setNote] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const options: { key: keyof Settings; name: string; detail: string }[] = [
    {
      key: 'sound',
      name: 'Sons de l’atelier',
      detail: 'Eau du ruisseau, tintement des fioles, pages, vent et félicitations.',
    },
    {
      key: 'music',
      name: 'Musique du livre',
      detail:
        'Introduction magique, puis cinq ambiances de harpe, cordes et bois doux, réduites pendant les bruitages.',
    },
    {
      key: 'haptics',
      name: 'Vibrations légères',
      detail: 'Retours tactiles sur les appareils compatibles.',
    },
    {
      key: 'patterns',
      name: 'Symboles dans les liquides',
      detail: 'Identifier les pigments sans dépendre de leur couleur.',
    },
    {
      key: 'motion',
      name: 'Animations douces',
      detail: 'Désactivez pour des transitions immédiates.',
    },
  ];
  return (
    <BookScrollView contentContainerStyle={ui.page}>
      <Label>À VOTRE RYTHME</Label>
      <T serif style={ui.title}>
        {save.nickname ? `Le carnet de ${save.nickname}` : 'Les réglages du carnet'}
      </T>
      <Paper style={[ui.card, { marginTop: 20 }]}>
        {options.map((o, i) => (
          <View
            key={o.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
              paddingVertical: 18,
              borderBottomWidth: i < options.length - 1 ? 1 : 0,
              borderColor: C.line,
            }}
          >
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 15 }}>{o.name}</T>
              <T style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{o.detail}</T>
            </View>
            <Switch
              accessibilityLabel={o.name}
              value={save.settings[o.key]}
              trackColor={{ false: C.line, true: '#8fa58a' }}
              thumbColor={C.card}
              onValueChange={(value) => {
                unlockAmbience();
                setSave((s) => ({ ...s, settings: { ...s.settings, [o.key]: value } }));
              }}
            />
          </View>
        ))}
      </Paper>
      <Paper style={[ui.card, { marginTop: 22 }]}>
        <Label>VOTRE PARCOURS</Label>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 26 }}>
          {[
            [Object.keys(save.completed).length, 'pages'],
            [Object.values(save.completed).reduce((n, l) => n + l.stars, 0), 'étoiles'],
            [save.pigments.length, 'découvertes'],
          ].map(([n, l]) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <T serif style={{ fontSize: 38, lineHeight: 45 }}>
                {n}
              </T>
              <T style={{ fontSize: 11, color: C.muted }}>{l}</T>
            </View>
          ))}
        </View>
      </Paper>
      <Paper style={[ui.card, { marginTop: 22 }]}>
        <Label>VOTRE SIGNATURE</Label>
        <TextInput
          accessibilityLabel="Votre pseudo"
          value={nickname}
          onChangeText={setNickname}
          maxLength={24}
          placeholder="Votre nom de botaniste"
          style={{
            fontFamily: F.handwritingMedium,
            fontSize: 27,
            color: C.ink,
            borderBottomWidth: 1,
            borderColor: C.line,
            minHeight: 56,
            marginVertical: 14,
            padding: 8,
          }}
        />
        <Button
          icon="leaf-outline"
          secondary
          onPress={() => {
            const name = normalizeNickname(nickname);
            if (name.length < 2) {
              setNote('Choisissez un pseudo de 2 à 24 caractères.');
              return;
            }
            setSave((s) => ({ ...s, nickname: name }));
            setNickname(name);
            setNote('Votre signature a été mise à jour.');
          }}
        >
          Modifier ma signature
        </Button>
        {!!note && (
          <T accessibilityLiveRegion="polite" style={{ color: C.muted, marginTop: 10 }}>
            {note}
          </T>
        )}
        <View style={ui.rule} />
        <AccountConnections />
        {!!error && <T accessibilityRole="alert">{error}</T>}
      </Paper>
      <Paper style={[ui.card, { marginTop: 22, gap: 14 }]}>
        <Label>UN NOUVEAU DÉPART</Label>
        <T serif style={{ fontSize: 28 }}>
          Recommencer l’herbier
        </T>
        <T style={{ color: C.muted }}>
          Repartir de la première page en effaçant votre progression. Un avertissement et une
          seconde confirmation vous seront demandés.
        </T>
        <Button icon="refresh-outline" secondary onPress={() => setResetOpen(true)}>
          Remettre ma progression à zéro
        </Button>
      </Paper>
      {resetOpen && (
        <ResetProgressDialog
          motion={save.settings.motion}
          onCancel={() => setResetOpen(false)}
          onConfirm={async () => {
            const success = await reset();
            if (success) {
              setNote('');
              setResetOpen(false);
              router.replace('/');
            }
            return success;
          }}
        />
      )}
      <Paper style={[ui.card, { marginTop: 22 }]}>
        <Label>CONFIDENTIALITÉ & CRÉDITS</Label>
        <T style={{ marginTop: 14, fontSize: 13, color: C.muted, lineHeight: 23 }}>
          Aucune mesure d’audience, aucune publicité active. La connexion Apple et Google n’est pas
          encore activée. La progression reste dans le stockage local de votre appareil.
          Illustrations et papier ont été créés pour ce projet. Les compositions originales sont
          sous CC0, avec instruments acoustiques FluidR3 sous MIT. L’eau du ruisseau a été
          enregistrée par jackthemurray sous CC0. Ces ressources sont réutilisables sans redevances
          ; leurs notices sont incluses dans le jeu. Aucun conseil de consommation ou d’usage
          médicinal n’est fourni.
        </T>
        <T style={{ marginTop: 15, fontSize: 12, color: C.muted }}>
          Les périodes de floraison sont indicatives. La nomenclature et les illustrations doivent
          être relues par un botaniste avant une publication scientifique. Références : GBIF
          Backbone Taxonomy, Plants of the World Online (Royal Botanic Gardens, Kew) et TAXREF/INPN.
          Le statut exact des contrôles est documenté dans le README.
        </T>
        <T serif style={{ fontSize: 24, marginTop: 22 }}>
          Herbier des couleurs · Volume I
        </T>
        <T style={{ fontSize: 11, color: C.muted }}>
          Herbier des couleurs · version {Constants.expoConfig?.version ?? '1.0.2'}
        </T>
      </Paper>
    </BookScrollView>
  );
}
