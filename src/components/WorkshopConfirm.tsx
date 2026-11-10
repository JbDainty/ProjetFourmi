import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Paper } from './Paper';
import { SpellIcon } from './SpellIcon';
import { Button, C, T } from './ui';
import { F } from './fonts';

export function WorkshopConfirm({
  kind,
  motion,
  onCancel,
  onConfirm,
}: {
  kind: 'hint' | 'mix';
  motion: boolean;
  onCancel: () => void;
  onConfirm: (skip: boolean) => void;
}) {
  const [skip, setSkip] = useState(false);
  const submitted = useRef(false);
  const hint = kind === 'hint';
  return (
    <Modal transparent visible animationType={motion ? 'fade' : 'none'} onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#233e31c9',
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ScrollView
          style={{ maxHeight: '94%', width: '100%', maxWidth: 410 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <Paper
            testID="workshop-confirm"
            accessibilityViewIsModal
            style={{
              padding: 30,
              borderRadius: 28,
              gap: 14,
              alignItems: 'center',
              backgroundColor: C.card,
              flexShrink: 0,
            }}
          >
            <SpellIcon name={hint ? 'hint' : 'mix'} size={44} />
            <T
              serif
              accessibilityRole="header"
              style={{ fontSize: 28, lineHeight: 32, textAlign: 'center' }}
            >
              {hint ? 'Cueillir un indice ?' : 'Mélanger les teintes ?'}
            </T>
            <T style={{ fontSize: 16, textAlign: 'center', color: C.muted }}>
              {hint
                ? 'Un nouvel indice utilise une graine. Relire cet indice dans la même situation reste gratuit.'
                : 'Les couleurs seront redistribuées dans une nouvelle disposition résoluble de cette page. Les mouvements repartent à zéro. Votre herbier et vos étoiles gagnées sont conservés. Ce mélange est gratuit.'}
            </T>
            {hint && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Ne plus me prévenir"
                accessibilityState={{ checked: skip }}
                onPress={() => setSkip((v) => !v)}
                style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <View
                  style={{
                    width: 23,
                    height: 23,
                    borderWidth: 1,
                    borderColor: C.green,
                    borderRadius: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: skip ? '#dce5cc' : 'transparent',
                  }}
                >
                  <T style={{ color: C.green }}>{skip ? '✓' : ''}</T>
                </View>
                <T style={{ fontFamily: F.scientific }}>Ne plus me prévenir</T>
              </Pressable>
            )}
            <Button
              icon={hint ? 'seed-outline' : 'refresh-outline'}
              style={{ width: '100%' }}
              onPress={() => {
                if (submitted.current) return;
                submitted.current = true;
                onConfirm(skip);
              }}
            >
              {hint ? 'Utiliser une graine' : 'Mélanger cette page'}
            </Button>
            <Button secondary style={{ width: '100%' }} onPress={onCancel}>
              Continuer à chercher
            </Button>
          </Paper>
        </ScrollView>
      </View>
    </Modal>
  );
}
