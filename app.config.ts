import type { ExpoConfig } from 'expo/config';
import app from './app.json';

const basePath = (process.env.EXPO_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
if (basePath && !/^\/[A-Za-z0-9_/-]+$/.test(basePath)) {
  throw new Error('EXPO_PUBLIC_BASE_PATH doit être un chemin absolu sans point ni espace.');
}
export default {
  ...app.expo,
  experiments: { ...app.expo.experiments, baseUrl: basePath },
} as ExpoConfig;
