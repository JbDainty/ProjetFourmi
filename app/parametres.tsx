import { BookScrollView } from '../src/components/BookScrollView';
import { F } from '../src/components/fonts';
import { Paper } from '../src/components/Paper';
import React, { useState } from 'react';
import { View, Switch, TextInput } from 'react-native';
import { useGame } from '../src/state/store';
import { restore, Settings } from '../src/state/model';
import { T, Label, Button, C, ui } from '../src/components/ui';
import { ResetProgressDialog } from '../src/components/ResetProgressDialog';
import { router } from 'expo-router';
import { unlockAmbience } from '../src/services/ambience';
export default function Parametres() {
  const { save, setSave, error, reset } = useGame(),
    [backup, setBackup] = useState(''),
    [note, setNote] = useState(''),
    [confirm, setConfirm] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const options: { key: keyof Settings; name: string; detail: string }[] = [
    {
      key: 'sound',
      name: 'Sons de l’atelier',
      detail: 'Eau du ruisseau, tintement des fioles, pages, vent et félicitations.',
    },
    {
      key: 'music',
      name: 'Musique des écosystèmes',
      detail:
        'Harpe, cordes et bois doux. Cinq ambiances discrètes qui baissent pendant les bruitages.',
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
        Les réglages du carnet
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
            [save.pigments.length, 'pigments'],
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
        <Label>CONSERVER VOTRE HERBIER</Label>
        <T style={{ marginVertical: 14, color: C.muted }}>
          Votre progression est enregistrée automatiquement sur cet appareil. Conservez une copie du
          texte ci-dessous pour la transférer ou la restaurer. Effacer les données du navigateur
          supprime la copie locale.
        </T>
        <Button
          icon="archive-outline"
          secondary
          onPress={() => {
            setBackup(JSON.stringify(save));
            setNote('Copie générée. Sélectionnez et conservez le texte dans un fichier.');
          }}
        >
          Créer une copie de sauvegarde
        </Button>
        <TextInput
          accessibilityLabel="Contenu de la sauvegarde"
          multiline
          value={backup}
          onChangeText={setBackup}
          placeholder="Votre sauvegarde JSON…"
          style={{
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 14,
            minHeight: 100,
            maxHeight: 180,
            padding: 14,
            marginVertical: 16,
            color: C.ink,
            fontSize: 12,
            textAlignVertical: 'top',
            fontFamily: F.body,
          }}
        />
        {confirm ? (
          <View style={{ gap: 10 }}>
            <T>Remplacer la progression actuelle par cette sauvegarde ?</T>
            <Button
              icon="book-outline"
              onPress={() => {
                try {
                  const restored = restore(backup);
                  setSave(() => restored);
                  setNote('Votre herbier a été restauré.');
                } catch (e) {
                  setNote(e instanceof Error ? e.message : 'Sauvegarde non reconnue.');
                }
                setConfirm(false);
              }}
            >
              Confirmer la restauration
            </Button>
            <Button icon="arrow-undo-outline" secondary onPress={() => setConfirm(false)}>
              Annuler
            </Button>
          </View>
        ) : (
          <Button
            icon="book-outline"
            secondary
            disabled={!backup.trim()}
            onPress={() => {
              try {
                restore(backup);
                setConfirm(true);
              } catch (e) {
                setNote(e instanceof Error ? e.message : 'Sauvegarde non reconnue.');
              }
            }}
          >
            Restaurer cette copie
          </Button>
        )}
        <T accessibilityLiveRegion="polite" style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
          {note || error || 'Sauvegarde locale automatique · format version 2'}
        </T>
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
              setBackup('');
              setConfirm(false);
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
          Aucun compte, aucune mesure d’audience, aucune publicité active. La progression reste dans
          le stockage local de votre appareil. Illustrations et papier ont été créés pour ce projet.
          Les compositions originales sont sous CC0, avec instruments acoustiques FluidR3 sous MIT.
          L’eau du ruisseau a été enregistrée par jackthemurray sous CC0. Ces ressources sont
          réutilisables sans redevances ; leurs notices sont incluses dans le jeu. Aucun conseil de
          consommation ou d’usage médicinal n’est fourni.
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
        <T style={{ fontSize: 11, color: C.muted }}>Herbier des couleurs · version 1.0.0</T>
      </Paper>
    </BookScrollView>
  );
}
