import React from 'react';
import { View } from 'react-native';
import { restorationCaption, restorationState } from '../animation/restoration';
import { C, Progress, T } from './ui';

export function RestorationProgress({
  stage,
  compact = false,
}: {
  stage: number;
  compact?: boolean;
}) {
  const { colors } = restorationState(stage);
  return (
    <View testID="plant-restoration-progress" style={{ width: '100%', gap: 8 }}>
      <Progress value={colors / 4} />
      <T style={{ textAlign: 'center', fontSize: compact ? 10 : 12, color: C.muted }}>
        {restorationCaption(stage)}
      </T>
    </View>
  );
}
