import { Paper } from '../src/components/Paper';
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useGame } from '../src/state/store';
import { commerce } from '../src/services/commerce';
import { T, Label, Button, Icon, C, ui } from '../src/components/ui';
import { themes, acquireTheme, dailyReward } from '../src/state/economy';
export default function Boutique() {
  const { save, setSave } = useGame(),
    [note, setNote] = useState('');
  const day = new Date().toLocaleDateString('sv-SE');
  return (
    <ScrollView contentContainerStyle={ui.page}>
      <Label>LES PETITS PLAISIRS DU CARNET</Label>
      <T serif style={ui.title}>
        La Boutique
      </T>
      <T style={ui.muted}>Des détails à votre image. Le vivant reste accessible à tous.</T>
      <Paper
        style={[
          ui.card,
          {
            marginVertical: 25,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          },
        ]}
      >
        <Icon name="sunny-outline" size={38} color={C.gold} />
        <View style={{ flex: 1, minWidth: 170 }}>
          <T serif style={{ fontSize: 27 }}>
            Le rendez-vous du jour
          </T>
          <T style={{ fontSize: 12, color: C.muted }}>
            Une petite réserve de 15 graines, chaque jour.
          </T>
        </View>
        <Button
          icon="seed-outline"
          disabled={save.daily === day}
          onPress={() => setSave((s) => dailyReward(s, day))}
        >
          {save.daily === day ? 'À demain' : 'Recueillir les graines'}
        </Button>
      </Paper>
      <Label>LES PAPIERS DE L’ATELIER</Label>
      <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap', marginTop: 16 }}>
        {themes.map((t) => {
          const owned = save.owned.includes(t.id),
            active = save.theme === t.id;
          return (
            <Paper key={t.id} style={[ui.card, { flex: 1, minWidth: 210 }]}>
              <View
                style={{
                  height: 120,
                  backgroundColor: t.color,
                  borderWidth: 0,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Icon name="leaf-outline" size={40} color={C.gold} />
              </View>
              <T serif style={{ fontSize: 27 }}>
                {t.name}
              </T>
              <T style={{ fontSize: 12, color: C.muted, marginTop: 5, marginBottom: 20 }}>
                {owned ? 'Dans votre collection' : `${t.cost} graines dorées`}
              </T>
              <Button
                icon="leaf-outline"
                secondary
                disabled={active || (!owned && save.seeds < t.cost)}
                onPress={() => setSave((s) => acquireTheme(s, t.id))}
              >
                {active ? 'Papier utilisé' : owned ? 'Utiliser ce papier' : 'Acquérir ce papier'}
              </Button>
            </Paper>
          );
        })}
      </View>
      <Paper style={[ui.card, { marginTop: 25 }]}>
        <Label>LES AIDES À LA RESTAURATION</Label>
        <T serif style={{ fontSize: 28, marginTop: 10 }}>
          Du temps, jamais de contraintes.
        </T>
        <T style={{ color: C.muted, marginTop: 8 }}>
          Les indices, les annulations et les 100 niveaux sont gratuits. Votre progression botanique
          ne dépend d’aucun achat ni d’aucune publicité.
        </T>
        <View style={ui.rule} />
        <T style={{ fontSize: 12, color: C.muted }}>
          Achats intégrés et publicités : désactivés sur cette version. Aucun paiement n’est
          effectué. Les packs de graines, d’indices et la suppression de publicités ne sont pas
          commercialisés.
        </T>
        <Button
          icon="lock-closed-outline"
          secondary
          disabled={!commerce.available}
          onPress={() => setNote('Le fournisseur commercial n’est pas configuré.')}
          style={{ marginTop: 18 }}
        >
          Services commerciaux indisponibles
        </Button>
        {!!note && <T>{note}</T>}
      </Paper>
    </ScrollView>
  );
}
