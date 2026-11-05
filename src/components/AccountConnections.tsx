import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { C, T } from './ui';
import { F } from './fonts';

/** Honest preparation: no OAuth, fake account or remote-save success is simulated. */
export function AccountConnections() {
  const [provider, setProvider] = useState('');
  return (
    <View style={{ gap: 10 }}>
      <T style={{ fontFamily: F.scientific, color: C.muted, fontSize: 14 }}>
        Retrouver mon herbier avec un compte
      </T>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {['Google', 'Apple'].map((name) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={`Connexion ${name}, bientôt disponible`}
            onPress={() => setProvider(name)}
            style={{
              flex: 1,
              minWidth: 112,
              minHeight: 48,
              borderColor: C.line,
              borderWidth: 1,
              borderRadius: 18,
              padding: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T style={{ fontFamily: F.display, fontSize: 19, color: C.green }}>{name}</T>
            <T style={{ fontSize: 11, color: C.muted }}>À activer</T>
          </Pressable>
        ))}
      </View>
      <T
        testID="account-connection-status"
        accessibilityLiveRegion="polite"
        style={{ fontSize: 12, color: C.muted }}
      >
        {provider
          ? `La connexion ${provider} n’est pas encore activée. Votre carnet reste enregistré sur cet appareil ; ce bouton ne crée pas de compte en ligne.`
          : 'Connexion en ligne bientôt disponible. Pour le moment, votre carnet reste sur cet appareil.'}
      </T>
    </View>
  );
}
