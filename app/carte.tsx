import { Paper } from '../src/components/Paper';
import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { chapters, species } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { unlocked, loadLevel } from '../src/state/model';
import { T, Label, Icon, Progress, C, ui } from '../src/components/ui';
import { Botanical } from '../src/components/Botanical';
export default function Carte() {
  const { save, setSave } = useGame();
  return (
    <ScrollView contentContainerStyle={ui.page}>
      <Label>LE CARNET D’EXPLORATION</Label>
      <T serif style={ui.title}>
        Cinq paysages.{`\n`}Cent nuances à retrouver.
      </T>
      <T style={[ui.muted, { marginBottom: 28 }]}>
        Traversez la flore européenne, des prairies à la garrigue.
      </T>
      {chapters.map((c, i) => {
        const open = unlocked(save, i * 20 + 1),
          count = Array.from({ length: 20 }, (_, j) => !!save.completed[i * 20 + j + 1]).filter(
            Boolean,
          ).length;
        return (
          <Paper key={c.name} style={[ui.card, { marginBottom: 20, opacity: open ? 1 : 0.6 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 15 }}>
              <View style={{ flex: 1 }}>
                <Label>
                  CHAPITRE {String(i + 1).padStart(2, '0')} · NIVEAUX {i * 20 + 1}—{i * 20 + 20}
                </Label>
                <T serif style={{ fontSize: 32, lineHeight: 38, marginVertical: 9 }}>
                  {c.name}
                </T>
                <T style={{ color: C.muted, fontSize: 12 }}>{c.subtitle}</T>
                <T style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>
                  {species
                    .slice(i * 4, i * 4 + 4)
                    .map((s) => s.name)
                    .join(' · ')}
                </T>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Icon
                  name={
                    count === 20 ? 'ribbon-outline' : open ? 'leaf-outline' : 'lock-closed-outline'
                  }
                  size={30}
                  color={c.color}
                />
                <T style={{ fontSize: 12, marginTop: 12 }}>{count * 5} %</T>
              </View>
            </View>
            <View style={{ marginVertical: 20 }}>
              <Progress value={count / 20} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {Array.from({ length: 20 }, (_, j) => {
                const id = i * 20 + j + 1,
                  available = unlocked(save, id),
                  done = save.completed[id];
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Niveau ${id}${available ? '' : ', verrouillé'}`}
                    key={id}
                    disabled={!available}
                    onPress={() => {
                      setSave((s) => loadLevel(s, id));
                      router.push('/');
                    }}
                    style={{
                      width: 46,
                      height: 54,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: done ? C.green : C.line,
                      backgroundColor:
                        id === save.current ? C.green : done ? '#e5eadb' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <T
                      style={{
                        color: id === save.current ? '#fff' : available ? C.ink : C.muted,
                        fontSize: 13,
                      }}
                    >
                      {available ? id : '·'}
                    </T>
                    {done && (
                      <T style={{ fontSize: 8, color: C.gold, lineHeight: 11 }}>
                        {'★'.repeat(done.stars)}
                      </T>
                    )}
                  </Pressable>
                );
              })}
            </View>
            {!open && (
              <T style={{ color: C.muted, fontSize: 11, marginTop: 18 }}>
                Restaurez le chapitre précédent pour ouvrir ce paysage.
              </T>
            )}
            {count === 20 && (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Label>ÉCOSYSTÈME RESTAURÉ</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[0, 1, 2, 3].map((j) => (
                    <Botanical key={j} index={i * 4 + j} stage={5} size={110} labels={false} />
                  ))}
                </View>
              </View>
            )}
          </Paper>
        );
      })}
    </ScrollView>
  );
}
