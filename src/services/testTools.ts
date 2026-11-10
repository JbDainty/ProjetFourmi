import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
export const testToolsAvailable = () =>
  __DEV__ ||
  Updates.channel === 'preview' ||
  (Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', 'jbdainty.github.io'].includes(window.location.hostname));
