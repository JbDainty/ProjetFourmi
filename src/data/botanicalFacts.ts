import { species } from './botany';

// Short annotations drawn from the existing botanical descriptions. Five
// entries per species follow its five pages; the reveal shows the next entry.
const annotations = species.map((plant) => [
  ...(plant.facts.match(/[^.!?]+[.!?]*/g) || []).map((sentence) => sentence.trim()),
  `Son habitat : ${plant.habitat.charAt(0).toLocaleLowerCase('fr') + plant.habitat.slice(1)}.`,
  plant.form === 'fern'
    ? 'Cette fougère se reproduit par des spores et ne porte pas de fleurs.'
    : plant.form === 'conifer'
      ? 'Ses organes reproducteurs sont des cônes, et non des fleurs.'
      : `Sa floraison s’observe généralement entre ${plant.bloom.toLocaleLowerCase('fr').replace(' — ', ' et ')}.`,
]);

export function botanicalFact(page: number, context: 'play' | 'reveal' = 'play'): string {
  const index = Math.floor((page - 1) / 5);
  const entries = annotations[index];
  const offset = ((page - 1) % 5) + (context === 'reveal' ? 1 : 0);
  return entries[offset % entries.length];
}
