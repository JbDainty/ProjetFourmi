import { Image } from 'react-native';
import { botanicalRasters } from '../data/botanicalRasters';

export function preparePageArtwork(plant: number, stage: number) {
  const source = botanicalRasters[plant]?.[Math.round(Math.max(0, Math.min(4, stage)))];
  if (!source) return;
  const uri = Image.resolveAssetSource(source)?.uri;
  if (uri) void Image.prefetch(uri).catch(() => {});
}
