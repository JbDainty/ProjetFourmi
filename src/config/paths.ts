/** Public build setting shared by the router, manifest and offline cache. */
export const basePath = (process.env.EXPO_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
