import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Paper } from './Paper';
import { Button, C, Label, T, ui } from './ui';

export function ResetProgressDialog({
  motion,
  onCancel,
  onConfirm,
}: {
  motion: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, setPending] = useState(false);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  useEffect(() => {
    if (step !== 2) return;
    // The second click of a double-tap must not approve a newly displayed action.
    const timer = setTimeout(() => setArmed(true), 600);
    return () => clearTimeout(timer);
  }, [step]);
  const confirm = async () => {
    if (step !== 2 || !armed || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    let success = false;
    try {
      success = await onConfirm();
    } catch {}
    if (!success) {
      submitting.current = false;
      setPending(false);
      setError('L’effacement n’a pas pu être enregistré. Réessayez ou annulez.');
    }
  };
  return (
    <Modal
      transparent
      visible
      animationType={motion ? 'fade' : 'none'}
      onRequestClose={() => {
        if (!submitting.current) onCancel();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#233e31c9',
          padding: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ScrollView style={{ width: '100%', maxWidth: 440, maxHeight: '94%' }}>
          <Paper
            key={step}
            testID={step === 1 ? 'reset-progress-warning' : 'reset-progress-confirmation'}
            accessibilityViewIsModal
            style={[ui.card, { gap: 16 }]}
          >
            <Label>{step === 1 ? 'AVANT DE TOURNER LA PAGE' : 'DERNIÈRE CONFIRMATION'}</Label>
            <T serif accessibilityRole="header" style={{ fontSize: 30, lineHeight: 35 }}>
              {step === 1 ? 'Repartir de zéro ?' : 'Effacer votre progression ?'}
            </T>
            {step === 1 ? (
              <>
                <T style={{ fontSize: 16, color: C.muted }}>
                  Vos pages terminées, étoiles, plantes restaurées, pigments, graines gagnées et
                  papiers acquis seront effacés de cet appareil.
                </T>
                <T style={{ color: C.muted }}>
                  Vous recommencerez à la page 1 avec une graine de départ. Vos réglages de son et
                  d’accessibilité seront conservés.
                </T>
                <T style={{ color: '#805747' }}>
                  Votre pseudo sera effacé et le livre s’ouvrira à nouveau pour un nouveau départ.
                </T>
                <Button icon="arrow-forward-outline" onPress={() => setStep(2)}>
                  Continuer vers la confirmation
                </Button>
                <Button icon="leaf-outline" secondary onPress={onCancel}>
                  Conserver ma progression
                </Button>
              </>
            ) : (
              <>
                <T style={{ fontSize: 16, color: C.muted }}>
                  Confirmez-vous l’effacement de votre progression ? Cette action remplace votre
                  sauvegarde actuelle par un nouvel herbier. Vous ne pourrez pas retrouver vos
                  anciennes données.
                </T>
                {/* Cancellation is first; the destructive action also waits for a fresh gesture. */}
                <Button icon="leaf-outline" secondary disabled={pending} onPress={onCancel}>
                  Conserver ma progression
                </Button>
                <Button
                  icon="refresh-outline"
                  disabled={pending || !armed}
                  onPress={() => void confirm()}
                  style={{ backgroundColor: '#805747', borderColor: '#805747' }}
                >
                  {pending ? 'Effacement en cours…' : 'Oui, effacer ma progression'}
                </Button>
                {!!error && (
                  <T accessibilityRole="alert" style={{ color: '#805747' }}>
                    {error}
                  </T>
                )}
              </>
            )}
          </Paper>
        </ScrollView>
      </View>
    </Modal>
  );
}
