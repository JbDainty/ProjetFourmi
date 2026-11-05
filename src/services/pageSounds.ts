import { createBotanicalCue } from './botanicalAudio';
import type { BookTurnKind } from '../animation/book';

const single = createBotanicalCue(require('../../assets/page-turn.wav'), 0.2);
const multiple = createBotanicalCue(require('../../assets/pages-riffle.wav'), 0.2);

/** Unlock/preload within the click or pour gesture, before any delayed sound. */
export function preparePageSounds() {
  single.prepare();
  multiple.prepare();
}

export function playPageSound(kind: BookTurnKind, enabled: boolean, animated: boolean): () => void {
  if (!enabled) return () => {};
  preparePageSounds();
  const cue = kind === 'species' ? multiple : single;
  const delay = animated ? (kind === 'species' ? 280 : 350) : 0;
  let cancelled = false,
    stop = () => {};
  let release: ReturnType<typeof setTimeout> | undefined;
  const begin = () => {
    if (cancelled) return;
    stop = cue.play(true);
    release = setTimeout(() => stop(), (kind === 'species' ? 1850 : 1150) + 750);
  };
  const timer = setTimeout(begin, delay);
  return () => {
    cancelled = true;
    clearTimeout(timer);
    clearTimeout(release);
    stop();
  };
}
