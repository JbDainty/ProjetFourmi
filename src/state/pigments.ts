import { species } from '../data/botany';
export type Pigment = {
  id: number;
  name: string;
  shade: string;
  species: number;
  discovered: string;
};
export function discoverPigment(level: number, now: string): Pigment {
  const plant = Math.floor((level - 1) / 5),
    step = (level - 1) % 5;
  return {
    id: level,
    name: species[plant].organs[step],
    shade: step < 2 ? '#7a9274' : species[plant].color,
    species: plant,
    discovered: now,
  };
}
