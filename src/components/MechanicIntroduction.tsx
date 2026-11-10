import { MechanicVials } from './MechanicVials';
import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { mechanicDetails, type Mechanic } from '../engine/mechanics';
import { Paper } from './Paper';
import { T, Button, C } from './ui';
export function MechanicIntroduction({
  mechanics,
  motion,
  onClose,
}: {
  mechanics: Mechanic[];
  motion: boolean;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible animationType={motion ? 'fade' : 'none'} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#233e31c9',
          padding: 18,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ScrollView
          style={{ maxHeight: '94%', width: '100%', maxWidth: 430 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <Paper
            testID="mechanic-introduction"
            accessibilityViewIsModal
            style={{ padding: 30, borderRadius: 28, backgroundColor: C.card, gap: 14 }}
          >
            <T style={{ letterSpacing: 2, fontSize: 11, textAlign: 'center' }}>
              UNE NOUVELLE PAGE DU SAVOIR
            </T>
            {mechanics.map((id) => (
              <View key={id} style={{ alignItems: 'center', gap: 10 }}>
                <T serif style={{ fontSize: 29, lineHeight: 32, textAlign: 'center' }}>
                  {mechanicDetails[id].name}
                </T>
                <MechanicVials mechanic={id} />
                <T style={{ fontSize: 17, lineHeight: 24, textAlign: 'center' }}>
                  {mechanicDetails[id].intro}
                </T>
              </View>
            ))}
            <Button icon="leaf-outline" onPress={onClose}>
              J’ai compris
            </Button>
          </Paper>
        </ScrollView>
      </View>
    </Modal>
  );
}
