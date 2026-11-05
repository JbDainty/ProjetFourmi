let context: AudioContext | undefined;
export function sharedAudioContext(): AudioContext | undefined {
  try {
    const Constructor =
      globalThis.AudioContext ||
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return;
    context ??= new Constructor();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    return context;
  } catch {
    return;
  }
}
